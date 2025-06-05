-- Add selected_slot_id column to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS selected_slot_id UUID REFERENCES public.available_slots(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_selected_slot_id 
ON public.inquiries(selected_slot_id);

-- Add comment for documentation
COMMENT ON COLUMN public.inquiries.selected_slot_id 
IS 'Reference to the selected time slot for the photo shoot';
