// Testes: VerifyEmail page — verificação de e-mail por código em duas etapas
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
let mockLocationState = null;
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn(() => ({
      verifyEmail: mockVerifyEmail,
      resendVerification: mockResendVerification,
      isDark: false,
      toggleTheme: vi.fn(),
    })),
  };
});

import VerifyEmail from './VerifyEmail';

const renderPage = () =>
  render(
    <MemoryRouter>
      <VerifyEmail />
    </MemoryRouter>
  );

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  it('sem e-mail no state, começa pedindo o e-mail', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/e-mail cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();
  });

  it('vindo do cadastro (e-mail no state + codeSent), já mostra o campo de código', () => {
    mockLocationState = { email: 'novo@test.com', codeSent: true };
    renderPage();
    expect(screen.getByPlaceholderText(/código de 6 dígitos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verificar/i })).toBeInTheDocument();
  });

  it('vindo do login (e-mail no state, sem codeSent), começa na etapa de envio com o e-mail pré-preenchido', () => {
    mockLocationState = { email: 'antigo@test.com' };
    renderPage();
    // Nenhum código foi enviado pelo login → deve oferecer o input/botão de envio, não o de código
    const emailInput = screen.getByPlaceholderText(/e-mail cadastrado/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('antigo@test.com');
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/código de 6 dígitos/i)).not.toBeInTheDocument();
  });

  it('avança para a etapa de código após enviar o e-mail', async () => {
    mockResendVerification.mockResolvedValue({ message: 'ok' });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/e-mail cadastrado/i), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));

    expect(await screen.findByPlaceholderText(/código de 6 dígitos/i)).toBeInTheDocument();
    expect(mockResendVerification).toHaveBeenCalledWith('user@test.com');
  });

  it('exibe erro client se o código não tem 6 dígitos', async () => {
    mockLocationState = { email: 'novo@test.com', codeSent: true };
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }));

    expect(await screen.findByText(/deve ter 6 dígitos/i)).toBeInTheDocument();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it('verifica e redireciona para /login em sucesso', async () => {
    mockLocationState = { email: 'novo@test.com', codeSent: true };
    mockVerifyEmail.mockResolvedValue({ message: 'ok' });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }));

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('novo@test.com', '123456');
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true }));
    });
  });

  it('exibe erro da API quando o código é inválido', async () => {
    mockLocationState = { email: 'novo@test.com', codeSent: true };
    mockVerifyEmail.mockRejectedValue({
      response: { data: { error: 'Codigo invalido ou expirado.' } },
    });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '999999' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar/i }));

    expect(await screen.findByText(/invalido ou expirado/i)).toBeInTheDocument();
  });
});
