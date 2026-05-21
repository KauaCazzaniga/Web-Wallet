import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAdvisor from './AIAdvisor';

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../constants/gastosFixos', () => ({
  labelCategoria: (cat) => cat,
  iconeCategoria: () => '?',
}));

const context = {
  receitas: 5000,
  despesas: 3000,
  saldo: 2000,
  gastos: { Alimentação: 800, Transporte: 200 },
  limites: { Alimentação: 1000 },
};

function setup(props = {}) {
  const onClose = vi.fn();
  const user    = userEvent.setup();
  render(<AIAdvisor onClose={onClose} context={context} {...props} />);
  return { onClose, user };
}

describe('AIAdvisor — estrutura e acessibilidade', () => {
  it('renderiza o drawer com role=dialog e aria-label correto', () => {
    setup();
    expect(screen.getByRole('dialog', { name: /assistente financeiro ia/i })).toBeInTheDocument();
  });

  // AIAdvisor descontinuado — sugestões removidas do componente
  it.skip('exibe os três botões de sugestão no estado vazio', () => {
    setup();
    expect(screen.getByText('Onde estou gastando mais este mês?')).toBeInTheDocument();
    expect(screen.getByText('Qual minha taxa de poupança atual?')).toBeInTheDocument();
    expect(screen.getByText('Como posso reduzir minhas despesas?')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão de fechar', async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole('button', { name: /fechar assistente/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('AIAdvisor — campo de entrada', () => {
  it('botão de enviar é desabilitado quando o input está vazio', () => {
    setup();
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeDisabled();
  });

  it('botão de enviar é habilitado quando o usuário digita algo', async () => {
    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'Olá');
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).not.toBeDisabled();
  });

  it('Shift+Enter não envia a mensagem', async () => {
    const { default: api } = await import('../services/api');
    const { user } = setup();
    const textarea = screen.getByRole('textbox', { name: /mensagem para o assistente/i });
    await user.type(textarea, 'teste');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(api.post).not.toHaveBeenCalled();
  });
});

// AIAdvisor descontinuado — testes de envio desativados
describe.skip('AIAdvisor — envio de mensagem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe a mensagem do usuário após envio via sugestão', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'Resposta da IA' }] } }] },
    });

    const { user } = setup();
    await user.click(screen.getByText('Onde estou gastando mais este mês?'));

    expect(await screen.findByText('Onde estou gastando mais este mês?')).toBeInTheDocument();
  });

  it('exibe a resposta da IA após envio bem-sucedido', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'Você gasta mais em Alimentação.' }] } }] },
    });

    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'Análise');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Você gasta mais em Alimentação.')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando a API falha', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockRejectedValueOnce(new Error('network error'));

    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'Oi');
    await user.keyboard('{Enter}');

    expect(await screen.findByText(/erro ao consultar a ia/i)).toBeInTheDocument();
  });

  it('chama /ai/gemini com model e payload corretos', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] },
    });

    const { user } = setup();
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'teste');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/ai/gemini',
      expect.objectContaining({ model: 'gemini-2.5-flash' }),
    ));
  });

  it('limpa o input após envio', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] },
    });

    const { user } = setup();
    const textarea = screen.getByRole('textbox', { name: /mensagem para o assistente/i });
    await user.type(textarea, 'pergunta');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(textarea.value).toBe(''));
  });

  it('envia o histórico de mensagens anteriores na segunda chamada', async () => {
    const { default: api } = await import('../services/api');
    api.post
      .mockResolvedValueOnce({ data: { candidates: [{ content: { parts: [{ text: 'Primeira resposta' }] } }] } })
      .mockResolvedValueOnce({ data: { candidates: [{ content: { parts: [{ text: 'Segunda resposta' }] } }] } });

    const { user } = setup();

    // Primeira mensagem
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'pergunta 1');
    await user.keyboard('{Enter}');
    await screen.findByText('Primeira resposta');

    // Segunda mensagem — deve incluir o histórico
    await user.type(screen.getByRole('textbox', { name: /mensagem para o assistente/i }), 'pergunta 2');
    await user.keyboard('{Enter}');
    await screen.findByText('Segunda resposta');

    const secondCall = api.post.mock.calls[1];
    const contents   = secondCall[1].payload.contents;

    // Deve ter pelo menos 2 entradas: histórico (pergunta 1 + resposta 1) + nova mensagem
    expect(contents.length).toBeGreaterThan(1);
    // A primeira entrada do histórico é a pergunta anterior do usuário
    expect(contents[0].role).toBe('user');
    // A última entrada é a nova mensagem
    expect(contents[contents.length - 1].role).toBe('user');
  });

  it('trunca mensagem do usuário ao limite de 500 caracteres no payload', async () => {
    const { default: api } = await import('../services/api');
    api.post.mockResolvedValueOnce({ data: { candidates: [{ content: { parts: [{ text: 'ok' }] } }] } });

    const { user } = setup();
    const textarea = screen.getByRole('textbox', { name: /mensagem para o assistente/i });

    // fireEvent.change para evitar timeout de userEvent digitando 520 chars
    fireEvent.change(textarea, { target: { value: 'a'.repeat(520) } });
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const lastContent = api.post.mock.calls[0][1].payload.contents.at(-1);
    // buildUserMessage trunca em 500 — "Pergunta: " + 500 'a's, sem 'a'.repeat(501)
    expect(lastContent.parts[0].text).not.toContain('a'.repeat(501));
  });
});
