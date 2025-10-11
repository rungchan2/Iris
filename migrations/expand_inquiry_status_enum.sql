-- Expand inquiry_status enum to support payment flow states
-- This allows proper tracking of payment-related inquiry states

-- 1. Add new enum values to inquiry_status
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'expired';

-- Note: PostgreSQL doesn't allow removing enum values
-- The enum now has: new, contacted, completed, cancelled, pending_payment, payment_failed, reserved, expired

-- 2. Update any existing data if needed (optional, based on your data)
-- Example: UPDATE inquiries SET status = 'pending_payment' WHERE status = 'new' AND payment_required = true AND payment_status = 'pending';

-- 3. Add comment for documentation
COMMENT ON TYPE public.inquiry_status IS 'Inquiry status tracking payment flow: new (초기), pending_payment (결제대기), payment_failed (결제실패), reserved (예약확정), contacted (연락완료), completed (완료), cancelled (취소), expired (만료)';

-- 4. Create index on status for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_inquiries_status_payment ON public.inquiries(status, payment_status);
