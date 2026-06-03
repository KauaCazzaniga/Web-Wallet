// Testes: ForgotPassword page — fluxo por código em duas etapas
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockForgotPassword = vi.fn();
const mockResetPassword = vi.fn();

// Mock useContext no nível do React — Auth e Theme caem no mesmo objeto
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn(() => ({
      forgotPassword: mockForgotPassword,
      resetPassword: mockResetPassword,
      isDark: false,
      toggleTheme: vi.fn(),
    })),
  };
});

import ForgotPassword from './ForgotPassword';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

const irParaEtapaCodigo = async () => {
  fireEvent.change(screen.getByPlaceholderText(/e-mail cadastrado/i), {
    target: { value: 'user@test.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));
  await screen.findByPlaceholderText(/código de 6 dígitos/i);
};

describe('ForgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza input de e-mail e botão de envio na etapa 1', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/e-mail cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();
  });

  it('avança para a etapa de código após enviar o e-mail', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await irParaEtapaCodigo();

    expect(mockForgotPassword).toHaveBeenCalledWith('user@test.com');
    expect(screen.getByPlaceholderText(/código de 6 dígitos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mín\. 6/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro em falha de rede na etapa 1', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Network Error'));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/e-mail cadastrado/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar código/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro no servidor/i)).toBeInTheDocument();
    });
  });

  it('exibe erro client se o código não tem 6 dígitos', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await irParaEtapaCodigo();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/deve ter 6 dígitos/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('exibe erro client se as senhas não coincidem', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await irParaEtapaCodigo();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'diferente' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/não coincidem/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('redefine a senha e redireciona para /login em sucesso', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    mockResetPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await irParaEtapaCodigo();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('user@test.com', '123456', 'senha123');
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true }));
    });
  });

  it('exibe erro da API quando o código é inválido', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'ok' });
    mockResetPassword.mockRejectedValue({
      response: { data: { error: 'Codigo invalido ou expirado.' } },
    });
    renderPage();
    await irParaEtapaCodigo();

    fireEvent.change(screen.getByPlaceholderText(/código de 6 dígitos/i), { target: { value: '999999' } });
    fireEvent.change(screen.getByPlaceholderText(/mín\. 6/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByPlaceholderText(/confirmar nova senha/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(await screen.findByText(/invalido ou expirado/i)).toBeInTheDocument();
  });
});
