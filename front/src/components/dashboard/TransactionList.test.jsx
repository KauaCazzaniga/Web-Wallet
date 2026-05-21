// Testa TransactionList: busca debounced, filtro de categoria, paginação, loading, delete

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionList from './TransactionList';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTx(overrides = {}) {
  return {
    _id: `tx-${Math.random().toString(36).slice(2)}`,
    descricao: 'Mercado',
    categoria: 'Alimentação',
    data: '2026-05-10',
    valor: 100,
    tipo: 'despesa',
    importadoViaPdf: false,
    ...overrides,
  };
}

function makeMany(n, overrides = {}) {
  return Array.from({ length: n }, (_, i) =>
    makeTx({ _id: `tx-${i}`, descricao: `Transação ${i + 1}`, ...overrides })
  );
}

const defaultProps = {
  transacoesMes: [],
  loadingMes: false,
  labelMes: 'Maio 2026',
  highlightedIds: [],
  onDelete: vi.fn(),
  onDeleteAll: vi.fn(),
  onAddFirst: vi.fn(),
};

function renderList(props = {}) {
  const user = userEvent.setup({ delay: null });
  render(<TransactionList {...defaultProps} {...props} />);
  return { user };
}

// ── Renderização base ─────────────────────────────────────────────────────────

describe('TransactionList — renderização base', () => {
  it('exibe o cabeçalho com o label do mês', () => {
    renderList();
    expect(screen.getByText('Transações — Maio 2026')).toBeInTheDocument();
  });

  it('exibe o campo de busca e o select de categoria', () => {
    renderList();
    expect(screen.getByRole('textbox', { name: /buscar transação/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filtrar por categoria/i })).toBeInTheDocument();
  });

  it('exibe mensagem de vazio quando não há transações', () => {
    renderList({ labelMes: 'Maio 2026' });
    expect(screen.getByText(/nenhuma transação em Maio 2026/i)).toBeInTheDocument();
  });

  it('exibe botão "Adicionar primeira transação" no estado vazio', () => {
    const onAddFirst = vi.fn();
    renderList({ onAddFirst });
    expect(screen.getByText(/adicionar primeira transação/i)).toBeInTheDocument();
  });

  it('chama onAddFirst ao clicar em adicionar primeira transação', async () => {
    const onAddFirst = vi.fn();
    const { user } = renderList({ onAddFirst });
    await user.click(screen.getByText(/adicionar primeira transação/i));
    expect(onAddFirst).toHaveBeenCalledOnce();
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('TransactionList — loading', () => {
  it('exibe skeleton quando loadingMes=true', () => {
    renderList({ loadingMes: true });
    // 5 linhas de skeleton — verificamos pelo número de células com shimmer
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('não exibe o estado vazio enquanto carrega', () => {
    renderList({ loadingMes: true });
    expect(screen.queryByText(/nenhuma transação/i)).not.toBeInTheDocument();
  });
});

// ── Transações ────────────────────────────────────────────────────────────────

describe('TransactionList — exibição de transações', () => {
  it('renderiza descrição, valor e botão de excluir', () => {
    const tx = makeTx({ descricao: 'Aluguel pago', valor: 1500, tipo: 'despesa' });
    renderList({ transacoesMes: [tx] });
    expect(screen.getByText('Aluguel pago')).toBeInTheDocument();
    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument();
    // DelBtn tem title="Excluir" (nome acessível exato, sem "tudo")
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('exibe "+" para receitas e "-" para despesas', () => {
    const receita = makeTx({ descricao: 'Salário', valor: 5000, tipo: 'receita' });
    const despesa = makeTx({ descricao: 'Aluguel', valor: 1200, tipo: 'despesa' });
    renderList({ transacoesMes: [receita, despesa] });
    expect(screen.getByText(/\+ R\$ 5\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/- R\$ 1\.200,00/)).toBeInTheDocument();
  });

  it('exibe badge "Importada via PDF" quando importadoViaPdf=true', () => {
    const tx = makeTx({ importadoViaPdf: true });
    renderList({ transacoesMes: [tx] });
    expect(screen.getByText(/importada via pdf/i)).toBeInTheDocument();
  });

  it('não exibe badge de importação para transações normais', () => {
    const tx = makeTx({ importadoViaPdf: false });
    renderList({ transacoesMes: [tx] });
    expect(screen.queryByText(/importada via pdf/i)).not.toBeInTheDocument();
  });

  it('chama onDelete ao clicar no botão de excluir', async () => {
    const onDelete = vi.fn();
    const tx = makeTx({ descricao: 'Netflix' });
    const { user } = renderList({ transacoesMes: [tx], onDelete });
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onDelete).toHaveBeenCalledWith(tx);
  });

  it('exibe botão "Excluir tudo" quando há transações e sem filtro', () => {
    renderList({ transacoesMes: [makeTx()] });
    expect(screen.getByText(/excluir tudo/i)).toBeInTheDocument();
  });

  it('chama onDeleteAll ao clicar em excluir tudo', async () => {
    const onDeleteAll = vi.fn();
    const { user } = renderList({ transacoesMes: [makeTx()], onDeleteAll });
    await user.click(screen.getByText(/excluir tudo/i));
    expect(onDeleteAll).toHaveBeenCalledOnce();
  });

  it('aplica estilo de destaque para transações highlighted', () => {
    const tx = makeTx({ _id: 'tx-hl' });
    renderList({ transacoesMes: [tx], highlightedIds: ['tx-hl'] });
    const row = screen.getByText('Mercado').closest('tr');
    expect(row.style.background).toContain('rgba');
  });
});

// ── Busca com debounce ────────────────────────────────────────────────────────

describe('TransactionList — busca com debounce', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  function renderWithFakeTimers(props = {}) {
    // advanceTimers necessário para userEvent funcionar com fake timers
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, delay: null });
    render(<TransactionList {...defaultProps} {...props} />);
    return { user };
  }

  it('filtra transações após 300ms de debounce', async () => {
    const txs = [
      makeTx({ _id: 'tx-a', descricao: 'Mercado Extra' }),
      makeTx({ _id: 'tx-b', descricao: 'Farmácia' }),
    ];
    const { user } = renderWithFakeTimers({ transacoesMes: txs });

    const input = screen.getByRole('textbox', { name: /buscar/i });
    await user.type(input, 'Mercado');

    // Antes do debounce — ambas ainda visíveis
    expect(screen.getByText('Mercado Extra')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(screen.getByText('Mercado Extra')).toBeInTheDocument();
      expect(screen.queryByText('Farmácia')).not.toBeInTheDocument();
    });
  });

  it('exibe mensagem "nenhuma transação encontrada" quando busca não retorna resultados', async () => {
    const txs = [makeTx({ descricao: 'Aluguel' })];
    const { user } = renderWithFakeTimers({ transacoesMes: txs });

    const input = screen.getByRole('textbox', { name: /buscar/i });
    await user.type(input, 'netflix');
    act(() => vi.advanceTimersByTime(300));

    await waitFor(() => {
      expect(screen.getByText(/nenhuma transação encontrada para este filtro/i)).toBeInTheDocument();
    });
  });

  it('exibe botão de limpar busca quando input não está vazio', async () => {
    const { user } = renderWithFakeTimers({ transacoesMes: [makeTx()] });
    const input = screen.getByRole('textbox', { name: /buscar/i });
    await user.type(input, 'a');
    expect(screen.getByRole('button', { name: /limpar busca/i })).toBeInTheDocument();
  });

  it('limpa o input ao clicar no botão X', async () => {
    const { user } = renderWithFakeTimers({ transacoesMes: [makeTx()] });
    const input = screen.getByRole('textbox', { name: /buscar/i });
    await user.type(input, 'algo');
    await user.click(screen.getByRole('button', { name: /limpar busca/i }));
    expect(input.value).toBe('');
  });

  it('não exibe botão de limpar quando input está vazio', () => {
    renderWithFakeTimers();
    expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument();
  });
});

// ── Filtro de categoria ───────────────────────────────────────────────────────

describe('TransactionList — filtro de categoria', () => {
  it('filtra por categoria ao selecionar no select', async () => {
    const txs = [
      makeTx({ _id: 'tx-1', descricao: 'Mercado', categoria: 'Alimentação' }),
      makeTx({ _id: 'tx-2', descricao: 'Uber', categoria: 'Transporte' }),
    ];
    const { user } = renderList({ transacoesMes: txs });
    const select = screen.getByRole('combobox', { name: /filtrar por categoria/i });
    await user.selectOptions(select, 'Transporte');
    expect(screen.getByText('Uber')).toBeInTheDocument();
    expect(screen.queryByText('Mercado')).not.toBeInTheDocument();
  });

  it('oculta o botão "Excluir tudo" quando há filtro ativo', async () => {
    const txs = [makeTx({ categoria: 'Alimentação' })];
    const { user } = renderList({ transacoesMes: txs });
    const select = screen.getByRole('combobox', { name: /filtrar por categoria/i });
    await user.selectOptions(select, 'Alimentação');
    expect(screen.queryByText(/excluir tudo/i)).not.toBeInTheDocument();
  });
});

// ── Paginação ─────────────────────────────────────────────────────────────────

describe('TransactionList — paginação', () => {
  it('não exibe a barra de paginação quando há ≤ 15 transações', () => {
    renderList({ transacoesMes: makeMany(15) });
    expect(screen.queryByText(/anterior/i)).not.toBeInTheDocument();
  });

  it('exibe a barra de paginação quando há > 15 transações', () => {
    renderList({ transacoesMes: makeMany(16) });
    expect(screen.getByText(/anterior/i)).toBeInTheDocument();
    expect(screen.getByText(/próxima/i)).toBeInTheDocument();
  });

  it('exibe apenas 15 itens por página', () => {
    renderList({ transacoesMes: makeMany(20) });
    // Apenas as primeiras 15 transações visíveis
    const rows = screen.getAllByText(/transação \d+/i);
    expect(rows.length).toBe(15);
  });

  it('navega para a próxima página ao clicar em "Próxima"', async () => {
    const { user } = renderList({ transacoesMes: makeMany(20) });
    await user.click(screen.getByText(/próxima/i));
    // Página 2: transações 16-20
    expect(screen.getByText('Transação 16')).toBeInTheDocument();
    expect(screen.queryByText('Transação 1')).not.toBeInTheDocument();
  });

  it('botão "Anterior" está desabilitado na primeira página', () => {
    renderList({ transacoesMes: makeMany(20) });
    expect(screen.getByText(/anterior/i).closest('button')).toBeDisabled();
  });

  it('exibe info de intervalo de paginação', () => {
    renderList({ transacoesMes: makeMany(20) });
    expect(screen.getByText(/1–15 de 20 transações/i)).toBeInTheDocument();
  });
});
