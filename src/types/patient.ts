export type PatientStatus = 
  | 'agendado' 
  | 'veio' 
  | 'nao_veio' 
  | 'sem_interesse' 
  | 'fechado';

export type MediaOrigin = 
  | 'facebook' 
  | 'instagram' 
  | 'indicacao' 
  | 'guia_campanha'
  | 'claudio';

export type ProcedureType = 
  | 'protese_flexivel' 
  | 'protese_total' 
  | 'protese_ppr' 
  | 'protese_ppr_mista';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  contactDate: string;
  appointmentDate: string;
  appointmentTime?: string;
  status: PatientStatus;
  closedValue?: number;
  mediaOrigin: MediaOrigin;
  procedures: ProcedureType[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<PatientStatus, string> = {
  agendado: 'Agendado',
  veio: 'Veio',
  nao_veio: 'Não Veio',
  sem_interesse: 'Sem Interesse',
  fechado: 'Fechado',
};

export const MEDIA_LABELS: Record<MediaOrigin, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  indicacao: 'Indicação',
  guia_campanha: 'Guia Campanha',
  claudio: 'Cláudio',
};

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  protese_flexivel: 'Prótese Flexível',
  protese_total: 'Prótese Total',
  protese_ppr: 'Prótese PPR',
  protese_ppr_mista: 'Prótese PPR Mista',
};
