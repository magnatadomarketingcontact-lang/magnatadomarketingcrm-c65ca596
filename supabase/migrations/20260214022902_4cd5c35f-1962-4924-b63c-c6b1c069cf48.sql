
-- Create reminder_logs table to track sent reminders
CREATE TABLE public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  message_type TEXT NOT NULL DEFAULT 'whatsapp',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminder logs
CREATE POLICY "Users can view their own reminder logs"
ON public.reminder_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reminder logs
CREATE POLICY "Users can insert their own reminder logs"
ON public.reminder_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role needs access for the edge function (no auth context)
-- We'll use service role key in the edge function

-- Create index for faster lookups
CREATE INDEX idx_reminder_logs_patient_date ON public.reminder_logs(patient_id, appointment_date);
CREATE INDEX idx_reminder_logs_user ON public.reminder_logs(user_id);
