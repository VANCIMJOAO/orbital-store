import { vi } from 'vitest';

/**
 * Creates a chainable mock that mimics Supabase's PostgREST query builder.
 * Configure responses by setting mockResolvedValue on terminal methods.
 */
export function createMockSupabaseClient() {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};

  // All chainable methods return `chainable` for chaining
  const chainMethods = [
    'from', 'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'in', 'not', 'filter', 'order', 'limit',
    'gte', 'lte', 'gt', 'lt', 'is', 'match', 'or',
  ];

  for (const method of chainMethods) {
    chainable[method] = vi.fn(() => chainable);
  }

  // Terminal methods return promises
  chainable.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chainable.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  chainable.then = undefined as unknown as ReturnType<typeof vi.fn>; // not a mock - allows await on chain

  // Make chainable itself thenable (for queries without .single())
  const defaultResult = { data: null, error: null };
  Object.defineProperty(chainable, 'then', {
    get() {
      return (resolve: (val: unknown) => void) => resolve(defaultResult);
    },
    configurable: true,
  });

  // Auth mock
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  };

  return { ...chainable, auth } as unknown as ReturnType<typeof vi.fn> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    auth: typeof auth;
  };
}
