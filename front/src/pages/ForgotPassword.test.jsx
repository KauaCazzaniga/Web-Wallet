// Testes: ForgotPassword page
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const mockForgotPassword = vi.fn();
const mockToggleTheme = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  AuthContext: {},
  useContext: vi.fn(),
}));
vi.mock('../contexts/ThemeContext', () => ({
  ThemeContext: {},
  useContext: vi.fn(),
}));

// Mock useContext at React level via module mock
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn((ctx) => {
      // Identificar pelo objeto — AuthContext e ThemeContext são objetos simples
      return {
        forgotPassword: mockForgotPassword,
        isDark: false,
        toggleTheme: mockToggleTheme,
      };
    }),
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

describe('ForgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza input de e-mail e botão de envio', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/e-mail cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
  });

  it('exibe mensagem de sucesso após submissão válida', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/e-mail cadastrado/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/receberá um link/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro em falha de rede', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Network Error'));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/e-mail cadastrado/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro no servidor/i)).toBeInTheDocument();
    });
  });
});
