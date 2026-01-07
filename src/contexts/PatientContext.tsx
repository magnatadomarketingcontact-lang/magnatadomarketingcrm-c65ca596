import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = 'magnata_crm_patients';

// Função para criar paciente de teste com consulta para amanhã
const createTestPatient = (): Patient => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const now = new Date().toISOString();
  
  return {
    id: 'test-patient-tomorrow',
    name: 'Maria Silva (TESTE)',
    phone: '11999999999',
    contactDate: new Date().toISOString().split('T')[0],
    appointmentDate: tomorrow.toISOString().split('T')[0],
    status: 'agendado',
    mediaOrigin: 'instagram',
    procedures: ['protese_total', 'protese_flexivel'],
    observations: 'Paciente de teste para verificar notificações',
    createdAt: now,
    updatedAt: now,
  };
};

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existingPatients: Patient[] = stored ? JSON.parse(stored) : [];
    
    // Adiciona paciente de teste se não existir
    const hasTestPatient = existingPatients.some(p => p.id === 'test-patient-tomorrow');
    if (!hasTestPatient) {
      return [...existingPatients, createTestPatient()];
    }
    return existingPatients;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  return (
    <PatientContext.Provider value={{ patients, addPatient, updatePatient, deletePatient, getPatientById }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
