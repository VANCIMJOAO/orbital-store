/**
 * Utilitários de validação e sanitização para segurança
 */

// Sanitizar username - remover caracteres perigosos
export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .replace(/[<>'"&\\\/]/g, '') // Remove caracteres perigosos para XSS/SQL
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .slice(0, 30); // Limita tamanho
}

// Sanitizar Steam ID
export function sanitizeSteamId(steamId: string): string {
  return steamId.trim().replace(/[<>'"&\\]/g, '');
}

// Validar força da senha
export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-5
  errors: string[];
  strength: 'muito_fraca' | 'fraca' | 'media' | 'forte' | 'muito_forte';
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // Comprimento mínimo (obrigatório)
  if (password.length < 8) {
    errors.push('Senha deve ter no minimo 8 caracteres');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  // Letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiuscula');
  } else {
    score += 1;
  }

  // Letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minuscula');
  } else {
    score += 0.5;
  }

  // Número
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um numero');
  } else {
    score += 1;
  }

  // Caractere especial (opcional mas recomendado)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }

  // Determinar força
  let strength: PasswordValidation['strength'];
  if (score < 1.5) strength = 'muito_fraca';
  else if (score < 2.5) strength = 'fraca';
  else if (score < 3.5) strength = 'media';
  else if (score < 4.5) strength = 'forte';
  else strength = 'muito_forte';

  return {
    isValid: errors.length === 0,
    score: Math.min(5, Math.round(score)),
    errors,
    strength,
  };
}

// Validar username
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeUsername(username);

  if (sanitized.length < 3) {
    return { isValid: false, error: 'Nome de usuario deve ter pelo menos 3 caracteres' };
  }

  if (sanitized.length > 20) {
    return { isValid: false, error: 'Nome de usuario deve ter no maximo 20 caracteres' };
  }

  // Apenas letras, números e underscore
  if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
    return { isValid: false, error: 'Nome de usuario pode conter apenas letras, numeros e underscore' };
  }

  // Não começar com número
  if (/^[0-9]/.test(sanitized)) {
    return { isValid: false, error: 'Nome de usuario nao pode comecar com numero' };
  }

  return { isValid: true };
}

// Validar Steam ID
export function validateSteamId(steamId: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeSteamId(steamId);

  // Formato: 17 dígitos ou URL do perfil Steam
  const steamIdRegex = /^[0-9]{17}$/;
  const steamUrlRegex = /^https?:\/\/steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;

  if (!steamIdRegex.test(sanitized) && !steamUrlRegex.test(sanitized)) {
    return {
      isValid: false,
      error: 'Steam ID invalido. Use o ID de 17 digitos ou URL do perfil'
    };
  }

  return { isValid: true };
}

// Validar email (básico - Supabase faz validação completa)
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: 'Email e obrigatorio' };
  }

  // Regex básico para email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Email invalido' };
  }

  return { isValid: true };
}
