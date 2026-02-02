/**
 * Safe error message utility to prevent information leakage
 * Maps internal error codes to user-friendly messages
 */

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  // PostgreSQL constraint violations
  '23505': 'Este registro já existe',
  '23503': 'Este registro está vinculado a outros dados',
  '23514': 'Os dados fornecidos são inválidos',
  '23502': 'Campos obrigatórios não foram preenchidos',
  
  // RLS and permission errors
  '42501': 'Você não tem permissão para esta ação',
  '42503': 'Acesso negado',
  'PGRST116': 'Operação não permitida',
  'PGRST301': 'Você não tem permissão para acessar este recurso',
  
  // Authentication errors
  'invalid_credentials': 'Email ou senha inválidos',
  'email_not_confirmed': 'Por favor, confirme seu email antes de fazer login',
  'user_not_found': 'Usuário não encontrado',
  'invalid_grant': 'Email ou senha inválidos',
  'weak_password': 'A senha deve ter pelo menos 6 caracteres',
  
  // Rate limiting
  'over_request_limit': 'Muitas tentativas. Aguarde um momento',
  'too_many_requests': 'Muitas tentativas. Aguarde um momento',
  
  // Network errors
  'FetchError': 'Erro de conexão. Verifique sua internet',
  'NetworkError': 'Erro de conexão. Verifique sua internet',
};

// Auth-specific error messages that are safe to show
const AUTH_SAFE_MESSAGES = [
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
  'Password should be at least 6 characters',
];

export function getSafeErrorMessage(error: unknown, defaultMessage: string = 'Ocorreu um erro. Tente novamente.'): string {
  if (!error) {
    return defaultMessage;
  }

  const err = error as SupabaseError;
  
  // Check if error code exists in our mapping
  if (err.code && ERROR_MESSAGES[err.code]) {
    return ERROR_MESSAGES[err.code];
  }

  // Check for auth errors that are safe to display
  if (err.message) {
    // Map common auth error messages
    if (err.message.includes('Invalid login credentials')) {
      return 'Email ou senha inválidos';
    }
    if (err.message.includes('Email not confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login';
    }
    if (err.message.includes('User already registered')) {
      return 'Este email já está cadastrado';
    }
    if (err.message.includes('Password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    if (err.message.includes('rate limit') || err.message.includes('too many')) {
      return 'Muitas tentativas. Aguarde um momento';
    }
    if (err.message.includes('network') || err.message.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet';
    }
  }

  // Log full error in development for debugging
  if (import.meta.env.DEV) {
    console.error('Full error details:', error);
  }

  return defaultMessage;
}

export function getPatientErrorMessage(error: unknown): string {
  return getSafeErrorMessage(error, 'Erro ao processar dados do paciente');
}

export function getAuthErrorMessage(error: unknown): string {
  return getSafeErrorMessage(error, 'Erro de autenticação');
}
