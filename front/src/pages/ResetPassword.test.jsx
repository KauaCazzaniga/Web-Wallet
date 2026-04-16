// Testes: ResetPassword page
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockResetPassword = vi.fn();
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn(() => ({
      resetPassword: mockResetPassword,
      isDark: false,
      toggleTheme: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    })),
  };
});

import ResetPassword from './ResetPassword';

const renderWithToken = (token = 'validtoken') => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { search: token ? `?token=${token}` : '' },
  });
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redireciona para /forgot-password se não houver token na URL', () => {
    renderWithToken('');
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password', expect.anything());
  });

  it('exibe erro client se senhas não coincidem', async () => {
    renderWithToken('abc123');
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'diferente' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/não coincidem/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('exibe erro client se senha menor que 6 chars', async () => {
    renderWithToken('abc123');
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/6 caracteres/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('chama resetPassword e redireciona para /login em sucesso', async () => {
    mockResetPassword.mockResolvedValue({ message: 'ok' });
    renderWithToken('validtoken');

    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('validtoken', 'senha123');
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true }));
    });
  });

  it('exibe erro da API quando token é inválido', async () => {
    mockResetPassword.mockRejectedValue({
      response: { data: { error: 'Token inválido ou expirado.' } },
    });
    renderWithToken('badtoken');

    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/inválido ou expirado/i)).toBeInTheDocument();
  });
});
