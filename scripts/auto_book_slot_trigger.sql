-- =====================================================
-- Auto Book Slot Trigger Function and Trigger
-- =====================================================
-- This script creates a function and trigger that automatically
-- updates available_slots.is_available to false when a new inquiry
-- is inserted with a selected_slot_id

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS auto_book_slot_on_inquiry_insert ON public.inquiries;
DROP FUNCTION IF EXISTS auto_book_slot();

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION auto_book_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new inquiry has a selected_slot_id
  IF NEW.selected_slot_id IS NOT NULL THEN
    -- Update the corresponding slot to mark it as unavailable
    UPDATE public.available_slots 
    SET is_available = false,
        updated_at = NOW()
    WHERE id = NEW.selected_slot_id;
    
    -- Optional: Log the booking (you can remove this if not needed)
    RAISE NOTICE 'Slot % has been automatically booked for inquiry %', NEW.selected_slot_id, NEW.id;
  END IF;
  
  -- Return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER auto_book_slot_on_inquiry_insert
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION auto_book_slot();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_book_slot() TO anon, authenticated;

-- Optional: Create a function to unbook a slot when inquiry is deleted or slot is changed
CREATE OR REPLACE FUNCTION auto_unbook_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    IF OLD.selected_slot_id IS NOT NULL THEN
      UPDATE public.available_slots 
      SET is_available = true,
          updated_at = NOW()
      WHERE id = OLD.selected_slot_id;
      
      RAISE NOTICE 'Slot % has been automatically unbooked due to inquiry deletion', OLD.selected_slot_id;
    END IF;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE operations (when slot changes)
  IF TG_OP = 'UPDATE' THEN
    -- If slot was changed from one to another
    IF OLD.selected_slot_id IS DISTINCT FROM NEW.selected_slot_id THEN
      -- Unbook the old slot
      IF OLD.selected_slot_id IS NOT NULL THEN
        UPDATE public.available_slots 
        SET is_available = true,
            updated_at = NOW()
        WHERE id = OLD.selected_slot_id;
        
        RAISE NOTICE 'Slot % has been automatically unbooked due to slot change', OLD.selected_slot_id;
      END IF;
      
      -- Book the new slot
      IF NEW.selected_slot_id IS NOT NULL THEN
        UPDATE public.available_slots 
        SET is_available = false,
            updated_at = NOW()
        WHERE id = NEW.selected_slot_id;
        
        RAISE NOTICE 'Slot % has been automatically booked due to slot change', NEW.selected_slot_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for DELETE and UPDATE operations
DROP TRIGGER IF EXISTS auto_unbook_slot_on_inquiry_change ON public.inquiries;

CREATE TRIGGER auto_unbook_slot_on_inquiry_change
  AFTER UPDATE OR DELETE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION auto_unbook_slot();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_unbook_slot() TO anon, authenticated;

-- =====================================================
-- Test the functionality (optional - remove in production)
-- =====================================================

-- Function to test the trigger functionality
CREATE OR REPLACE FUNCTION test_auto_booking()
RETURNS TEXT AS $$
DECLARE
  test_slot_id UUID;
  test_inquiry_id UUID;
  slot_status BOOLEAN;
  result_text TEXT := '';
BEGIN
  -- Find an available slot for testing
  SELECT id INTO test_slot_id 
  FROM public.available_slots 
  WHERE is_available = true 
  LIMIT 1;
  
  IF test_slot_id IS NULL THEN
    RETURN 'No available slots found for testing';
  END IF;
  
  result_text := result_text || 'Testing with slot: ' || test_slot_id || E'\n';
  
  -- Check initial status
  SELECT is_available INTO slot_status 
  FROM public.available_slots 
  WHERE id = test_slot_id;
  
  result_text := result_text || 'Initial slot status: ' || slot_status || E'\n';
  
  -- Insert a test inquiry (this should trigger the auto-booking)
  INSERT INTO public.inquiries (
    name, 
    phone, 
    selected_slot_id,
    people_count,
    status
  ) VALUES (
    'Test User',
    '010-1234-5678',
    test_slot_id,
    2,
    'new'
  ) RETURNING id INTO test_inquiry_id;
  
  result_text := result_text || 'Created test inquiry: ' || test_inquiry_id || E'\n';
  
  -- Check if slot was booked
  SELECT is_available INTO slot_status 
  FROM public.available_slots 
  WHERE id = test_slot_id;
  
  result_text := result_text || 'Slot status after booking: ' || slot_status || E'\n';
  
  -- Clean up test data
  DELETE FROM public.inquiries WHERE id = test_inquiry_id;
  
  result_text := result_text || 'Test inquiry deleted' || E'\n';
  
  -- Check if slot was unbooked
  SELECT is_available INTO slot_status 
  FROM public.available_slots 
  WHERE id = test_slot_id;
  
  result_text := result_text || 'Final slot status: ' || slot_status || E'\n';
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Grant permission to test function
GRANT EXECUTE ON FUNCTION test_auto_booking() TO anon, authenticated;

-- =====================================================
-- Usage Instructions:
-- =====================================================
-- 1. Run this script in your Supabase SQL editor
-- 2. To test the functionality, run: SELECT test_auto_booking();
-- 3. The test function will show you the booking/unbooking process
-- 4. In production, remove the test function if not needed 