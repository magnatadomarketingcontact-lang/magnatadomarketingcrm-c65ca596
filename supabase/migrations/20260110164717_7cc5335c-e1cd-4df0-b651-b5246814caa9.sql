-- Create enum types for patient data
CREATE TYPE public.patient_status AS ENUM ('agendado', 'veio', 'nao_veio', 'sem_interesse', 'fechado');
CREATE TYPE public.media_origin AS ENUM ('facebook', 'instagram', 'indicacao', 'guia_campanha');
CREATE TYPE public.procedure_type AS ENUM ('protese_flexivel', 'protese_total', 'protese_ppr', 'protese_ppr_mista');

-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    contact_date DATE NOT NULL,
    appointment_date DATE NOT NULL,
    status patient_status NOT NULL DEFAULT 'agendado',
    closed_value NUMERIC,
    media_origin media_origin NOT NULL,
    procedures procedure_type[] NOT NULL DEFAULT '{}',
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only see their own patients
CREATE POLICY "Users can view their own patients" 
ON public.patients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients" 
ON public.patients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" 
ON public.patients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" 
ON public.patients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_appointment_date ON public.patients(appointment_date);