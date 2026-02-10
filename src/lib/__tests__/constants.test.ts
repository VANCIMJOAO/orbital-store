import { describe, it, expect } from 'vitest';
import {
  CS2_MAP_POOL,
  MAP_DISPLAY_NAMES,
  MAP_COLORS,
  VETO_SEQUENCE_BO1,
  VETO_SEQUENCE_BO3,
} from '@/lib/constants';

// ============================================================
// CS2_MAP_POOL
// ============================================================
describe('CS2_MAP_POOL', () => {
  it('should contain exactly 7 maps', () => {
    expect(CS2_MAP_POOL).toHaveLength(7);
  });

  it('should only contain maps prefixed with de_', () => {
    CS2_MAP_POOL.forEach((map) => {
      expect(map).toMatch(/^de_/);
    });
  });

  it('should have no duplicates', () => {
    const unique = new Set(CS2_MAP_POOL);
    expect(unique.size).toBe(CS2_MAP_POOL.length);
  });

  it('should include core competitive maps', () => {
    expect(CS2_MAP_POOL).toContain('de_mirage');
    expect(CS2_MAP_POOL).toContain('de_inferno');
    expect(CS2_MAP_POOL).toContain('de_nuke');
    expect(CS2_MAP_POOL).toContain('de_dust2');
  });
});

// ============================================================
// MAP_DISPLAY_NAMES
// ============================================================
describe('MAP_DISPLAY_NAMES', () => {
  it('should have an entry for every map in the pool', () => {
    CS2_MAP_POOL.forEach((map) => {
      expect(MAP_DISPLAY_NAMES).toHaveProperty(map);
      expect(typeof MAP_DISPLAY_NAMES[map]).toBe('string');
    });
  });

  it('should use display names without de_ prefix', () => {
    Object.values(MAP_DISPLAY_NAMES).forEach((name) => {
      expect(name).not.toMatch(/^de_/);
    });
  });
});

// ============================================================
// MAP_COLORS
// ============================================================
describe('MAP_COLORS', () => {
  it('should have an entry for every map in the pool', () => {
    CS2_MAP_POOL.forEach((map) => {
      expect(MAP_COLORS).toHaveProperty(map);
    });
  });

  it('should have from, to, and accent color fields', () => {
    Object.values(MAP_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty('from');
      expect(colors).toHaveProperty('to');
      expect(colors).toHaveProperty('accent');
    });
  });

  it('should use valid hex color format', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    Object.values(MAP_COLORS).forEach((colors) => {
      expect(colors.from).toMatch(hexRegex);
      expect(colors.to).toMatch(hexRegex);
      expect(colors.accent).toMatch(hexRegex);
    });
  });
});

// ============================================================
// VETO_SEQUENCE_BO1
// ============================================================
describe('VETO_SEQUENCE_BO1', () => {
  it('should have 6 steps (bans)', () => {
    expect(VETO_SEQUENCE_BO1).toHaveLength(6);
  });

  it('should only contain ban actions', () => {
    VETO_SEQUENCE_BO1.forEach((step) => {
      expect(step.action).toBe('ban');
    });
  });

  it('should alternate between first and second', () => {
    expect(VETO_SEQUENCE_BO1[0].actor).toBe('first');
    expect(VETO_SEQUENCE_BO1[1].actor).toBe('second');
    expect(VETO_SEQUENCE_BO1[2].actor).toBe('first');
    expect(VETO_SEQUENCE_BO1[3].actor).toBe('second');
    expect(VETO_SEQUENCE_BO1[4].actor).toBe('first');
    expect(VETO_SEQUENCE_BO1[5].actor).toBe('second');
  });

  it('should leave exactly 1 map remaining (7 maps - 6 bans = 1 leftover)', () => {
    expect(CS2_MAP_POOL.length - VETO_SEQUENCE_BO1.length).toBe(1);
  });
});

// ============================================================
// VETO_SEQUENCE_BO3
// ============================================================
describe('VETO_SEQUENCE_BO3', () => {
  it('should have 6 steps', () => {
    expect(VETO_SEQUENCE_BO3).toHaveLength(6);
  });

  it('should follow ban-ban-pick-pick-ban-ban sequence', () => {
    const actions = VETO_SEQUENCE_BO3.map((s) => s.action);
    expect(actions).toEqual(['ban', 'ban', 'pick', 'pick', 'ban', 'ban']);
  });

  it('should alternate between first and second', () => {
    expect(VETO_SEQUENCE_BO3[0].actor).toBe('first');
    expect(VETO_SEQUENCE_BO3[1].actor).toBe('second');
    expect(VETO_SEQUENCE_BO3[2].actor).toBe('first');
    expect(VETO_SEQUENCE_BO3[3].actor).toBe('second');
    expect(VETO_SEQUENCE_BO3[4].actor).toBe('first');
    expect(VETO_SEQUENCE_BO3[5].actor).toBe('second');
  });

  it('should leave exactly 1 map remaining (7 maps - 4 bans - 2 picks = 1 leftover)', () => {
    const bans = VETO_SEQUENCE_BO3.filter((s) => s.action === 'ban').length;
    const picks = VETO_SEQUENCE_BO3.filter((s) => s.action === 'pick').length;
    expect(CS2_MAP_POOL.length - bans - picks).toBe(1);
  });
});
