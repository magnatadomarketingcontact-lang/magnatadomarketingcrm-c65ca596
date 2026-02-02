-- Add database constraints for input validation on patients table

-- Name length constraint (max 255 characters)
ALTER TABLE public.patients ADD CONSTRAINT patients_name_length 
CHECK (length(name) <= 255);

-- Phone format and length constraint (allows digits, +, (), -, spaces; max 20 chars)
ALTER TABLE public.patients ADD CONSTRAINT patients_phone_length 
CHECK (length(phone) <= 20);

ALTER TABLE public.patients ADD CONSTRAINT patients_phone_format 
CHECK (phone ~ '^[+0-9()\s-]+$');

-- Observations length constraint (max 5000 characters)
ALTER TABLE public.patients ADD CONSTRAINT patients_observations_length 
CHECK (observations IS NULL OR length(observations) <= 5000);