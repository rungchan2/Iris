-- delete trigger and function : handle_inquiry_delete


DECLARE
  row_count INTEGER;
BEGIN
  IF OLD.selected_slot_id IS NOT NULL THEN
    UPDATE available_slots
    SET 
      is_available = true,
      updated_at = NOW()
    WHERE id = OLD.selected_slot_id;

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE LOG '[flog][DELETE] Rows affected in available_slots: %', row_count;
  END IF;

  RETURN OLD;
END;

-- insert trigger and function : handle_inquiry_insert

DECLARE
  row_count INTEGER;
BEGIN
  IF NEW.selected_slot_id IS NOT NULL THEN
    UPDATE available_slots
    SET 
      is_available = false,
      updated_at = NOW()
    WHERE id = NEW.selected_slot_id;

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE LOG '[flog][INSERT] Rows affected in available_slots: %', row_count;
  END IF;

  RETURN NEW;
END;
