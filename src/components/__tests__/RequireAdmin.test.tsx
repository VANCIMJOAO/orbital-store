import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock useAuth from AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

import { RequireAdmin } from '@/components/RequireAdmin';

describe('RequireAdmin', () => {
  it('should show loading message while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, loading: true });

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, loading: false });

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>
    );

    expect(mockPush).toHaveBeenCalledWith('/campeonatos/login');
  });

  it('should redirect to /campeonatos when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { is_admin: false },
      loading: false,
    });

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>
    );

    expect(mockPush).toHaveBeenCalledWith('/campeonatos');
  });

  it('should show redirecting when user exists but is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { is_admin: false },
      loading: false,
    });

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Redirecionando...')).toBeInTheDocument();
  });

  it('should render children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1' },
      profile: { is_admin: true },
      loading: false,
    });

    render(
      <RequireAdmin>
        <div>Admin Content</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
