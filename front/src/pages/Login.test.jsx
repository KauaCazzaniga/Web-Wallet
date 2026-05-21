import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Login from './Login';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

const mockNavigate = vi.fn();

function renderLogin({ loginFn = vi.fn().mockResolvedValue({ success: true }) } = {}) {
  useNavigate.mockReturnValue(mockNavigate);
  useLocation.mockReturnValue({ state: null });

  return {
    user: userEvent.setup(),
    loginFn,
    ...render(
      <AuthContext.Provider value={{ login: loginFn }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    ),
  };
}

describe('Login — renderização', () => {
  it('renderiza o campo de e-mail', () => {
    renderLogin();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('renderiza o campo de senha', () => {
    renderLogin();
    // Usa match exato para evitar conflito com aria-label="Mostrar senha" no toggle button
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('renderiza o botão de submit', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
  });

  it('renderiza o heading de boas-vindas', () => {
    renderLogin();
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
  });
});

describe('Login — visibilidade da senha', () => {
  it('inicia com o campo de senha oculto (type=password)', () => {
    renderLogin();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('exibe a senha ao clicar no botão de toggle', async () => {
    const { user } = renderLogin();
    await user.click(screen.getByRole('button', { name: /mostrar senha/i }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
  });

  it('oculta a senha ao clicar novamente no toggle', async () => {
    const { user } = renderLogin();
    await user.click(screen.getByRole('button', { name: /mostrar senha/i }));
    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });
});

describe('Login — submit', () => {
  it('chama login com e-mail e senha preenchidos', async () => {
    const loginFn = vi.fn().mockResolvedValue({ success: true });
    const { user } = renderLogin({ loginFn });

    await user.type(screen.getByLabelText(/e-mail/i), 'user@test.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    expect(loginFn).toHaveBeenCalledWith('user@test.com', 'senha123');
  });

  it('redireciona para /dashboard após login bem-sucedido', async () => {
    const loginFn = vi.fn().mockResolvedValue({ success: true });
    const { user } = renderLogin({ loginFn });

    await user.type(screen.getByLabelText(/e-mail/i), 'user@test.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('exibe mensagem de erro quando login falha', async () => {
    const loginFn = vi.fn().mockResolvedValue({ success: false, error: 'Credenciais inválidas.' });
    const { user } = renderLogin({ loginFn });

    await user.type(screen.getByLabelText(/e-mail/i), 'errado@test.com');
    await user.type(screen.getByLabelText('Senha'), 'errado');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    expect(await screen.findByText('Credenciais inválidas.')).toBeInTheDocument();
  });

  it('desabilita o botão de submit enquanto carrega', async () => {
    const loginFn = vi.fn().mockImplementation(() => new Promise(() => {})); // nunca resolve
    const { user } = renderLogin({ loginFn });

    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com');
    await user.type(screen.getByLabelText('Senha'), '123');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    expect(screen.getByRole('button', { name: /autenticando/i })).toBeDisabled();
  });
});
