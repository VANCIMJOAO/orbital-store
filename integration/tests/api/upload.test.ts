import { describe, it, expect } from 'vitest';
import { getAnonClient } from '../../helpers/supabase-client';

describe('Integration: Upload Routes Auth', () => {
  it('should not allow anon to upload to logos bucket', async () => {
    const anon = getAnonClient();
    const { error } = await anon.storage
      .from('logos')
      .upload('test/test.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    // Should fail with auth error
    expect(error).not.toBeNull();
  });

  it('should not allow anon to upload to banners bucket', async () => {
    const anon = getAnonClient();
    const { error } = await anon.storage
      .from('banners')
      .upload('test/test.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    expect(error).not.toBeNull();
  });
});
