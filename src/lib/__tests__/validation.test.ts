import { describe, it, expect } from 'vitest';
import {
  sanitizeUsername,
  sanitizeSteamId,
  validatePassword,
  validateUsername,
  validateSteamId,
  validateEmail,
} from '@/lib/validation';

// ============================================================
// sanitizeUsername
// ============================================================
describe('sanitizeUsername', () => {
  it('should trim whitespace', () => {
    expect(sanitizeUsername('  player  ')).toBe('player');
  });

  it('should remove XSS characters (<, >, \', ", &, \\, /)', () => {
    expect(sanitizeUsername('user<script>alert</script>')).toBe('userscriptalertscript');
    expect(sanitizeUsername("user'name\"test")).toBe('usernametest');
    expect(sanitizeUsername('user&test')).toBe('usertest');
    expect(sanitizeUsername('user\\path')).toBe('userpath');
    expect(sanitizeUsername('user/path')).toBe('userpath');
  });

  it('should replace spaces with underscores', () => {
    expect(sanitizeUsername('user name')).toBe('user_name');
    expect(sanitizeUsername('a  b  c')).toBe('a_b_c');
  });

  it('should truncate to 30 characters', () => {
    const long = 'a'.repeat(50);
    expect(sanitizeUsername(long)).toHaveLength(30);
  });

  it('should handle empty string', () => {
    expect(sanitizeUsername('')).toBe('');
  });

  it('should handle string with only dangerous chars', () => {
    expect(sanitizeUsername('<>"\'/\\')).toBe('');
  });
});

// ============================================================
// sanitizeSteamId
// ============================================================
describe('sanitizeSteamId', () => {
  it('should trim whitespace', () => {
    expect(sanitizeSteamId('  76561198012345678  ')).toBe('76561198012345678');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeSteamId("765<>'\"\\\\"+"&")).toBe('765');
  });

  it('should leave valid Steam ID unchanged', () => {
    expect(sanitizeSteamId('76561198012345678')).toBe('76561198012345678');
  });
});

// ============================================================
// validatePassword
// ============================================================
describe('validatePassword', () => {
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Ab1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Senha deve ter no minimo 8 caracteres');
  });

  it('should require at least one uppercase letter', () => {
    const result = validatePassword('abcdefgh1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiuscula');
  });

  it('should require at least one lowercase letter', () => {
    const result = validatePassword('ABCDEFGH1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Senha deve conter pelo menos uma letra minuscula');
  });

  it('should require at least one number', () => {
    const result = validatePassword('Abcdefgh');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Senha deve conter pelo menos um numero');
  });

  it('should accept valid password with all requirements', () => {
    const result = validatePassword('Abcdefg1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should classify short-only-lower as "muito_fraca"', () => {
    const result = validatePassword('abc');
    expect(result.strength).toBe('muito_fraca');
  });

  it('should classify "Abcdefg1" as "forte" (uppercase + lowercase + number + length >= 8)', () => {
    const result = validatePassword('Abcdefg1');
    // score: 1 (length>=8) + 1 (uppercase) + 0.5 (lowercase) + 1 (number) = 3.5 → forte
    expect(result.strength).toBe('forte');
  });

  it('should classify 12+ char password as "muito_forte"', () => {
    const result = validatePassword('Abcdefghij12');
    expect(result.isValid).toBe(true);
    // score: 1 (length>=8) + 1 (length>=12) + 1 (uppercase) + 0.5 (lowercase) + 1 (number) = 4.5 → muito_forte
    expect(result.strength).toBe('muito_forte');
  });

  it('should classify password with special chars and 12+ chars as "muito_forte"', () => {
    const result = validatePassword('Abcdefghij12!@');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('muito_forte');
  });

  it('should return score capped at 5', () => {
    const result = validatePassword('Abcdefghijklmnop12!@#');
    expect(result.score).toBeLessThanOrEqual(5);
  });
});

// ============================================================
// validateUsername
// ============================================================
describe('validateUsername', () => {
  it('should reject username shorter than 3 characters', () => {
    const result = validateUsername('ab');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('3 caracteres');
  });

  it('should reject username longer than 20 characters', () => {
    const result = validateUsername('a'.repeat(21));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('20 caracteres');
  });

  it('should reject username with special characters', () => {
    const result = validateUsername('user@name');
    expect(result.isValid).toBe(false);
  });

  it('should reject username starting with number', () => {
    const result = validateUsername('1username');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('numero');
  });

  it('should accept valid alphanumeric username', () => {
    expect(validateUsername('player1').isValid).toBe(true);
  });

  it('should accept username with underscores', () => {
    expect(validateUsername('player_one').isValid).toBe(true);
  });

  it('should accept exactly 3 characters', () => {
    expect(validateUsername('abc').isValid).toBe(true);
  });

  it('should accept exactly 20 characters', () => {
    expect(validateUsername('a'.repeat(20)).isValid).toBe(true);
  });
});

// ============================================================
// validateSteamId
// ============================================================
describe('validateSteamId', () => {
  it('should accept valid 17-digit Steam ID', () => {
    expect(validateSteamId('76561198012345678').isValid).toBe(true);
  });

  it('should accept valid Steam profile URL', () => {
    expect(validateSteamId('https://steamcommunity.com/profiles/76561198012345678').isValid).toBe(true);
  });

  it('should accept valid Steam custom URL', () => {
    expect(validateSteamId('https://steamcommunity.com/id/custom_name').isValid).toBe(true);
  });

  it('should reject 16-digit number', () => {
    expect(validateSteamId('7656119801234567').isValid).toBe(false);
  });

  it('should reject random text', () => {
    const result = validateSteamId('not-a-steam-id');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject empty string', () => {
    expect(validateSteamId('').isValid).toBe(false);
  });
});

// ============================================================
// validateEmail
// ============================================================
describe('validateEmail', () => {
  it('should reject empty string', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('obrigatorio');
  });

  it('should reject whitespace-only string', () => {
    expect(validateEmail('   ').isValid).toBe(false);
  });

  it('should reject email without @', () => {
    expect(validateEmail('useratdomain.com').isValid).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(validateEmail('user@').isValid).toBe(false);
  });

  it('should accept valid email', () => {
    expect(validateEmail('user@example.com').isValid).toBe(true);
  });

  it('should trim and lowercase email', () => {
    expect(validateEmail('  User@Example.COM  ').isValid).toBe(true);
  });
});
