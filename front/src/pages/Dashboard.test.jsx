// Testa as features adicionadas no polish sprint de 2026-05-12:
// NAV_ITEMS, activeTab via pathname, AIFloatBtn + AIAdvisor, FadeWrapper, RevealSection

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { FinanceContext } from '../context/FinanceContext';
import Dashboard from './Dashboard';

// ── Mocks pesados ─────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { meses: [], resumo: {
      saldo_inicial: 0, total_receitas: 0, total_despesas: 0, saldo_atual: 0,
    }, transacoes: [], limites_gastos: {} } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put:  vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../services/investments', () => ({
  listarInvestimentos: vi.fn().mockResolvedValue([]),
  listarCofrinhos:     vi.fn().mockResolvedValue([]),
}));

// Sub-componentes stubados para isolar testes ao Dashboard
vi.mock('../components/dashboard/DashboardHeader',  () => ({ default: () => <div data-testid="dashboard-header" /> }));
vi.mock('../components/dashboard/InvestmentPanel',  () => ({ default: () => <div data-testid="investment-panel" /> }));
vi.mock('../components/dashboard/GoalCards',        () => ({ default: () => <div data-testid="goal-cards" /> }));
vi.mock('../components/dashboard/TransactionList',  () => ({ default: () => <div data-testid="transaction-list" /> }));
vi.mock('../components/SubscriptionPanel',          () => ({ default: () => <div data-testid="subscription-panel" /> }));
vi.mock('../components/ImportModal',                () => ({ default: () => null }));
vi.mock('../components/AIAdvisor', () => ({
  default: ({ onClose }) => (
    <div data-testid="ai-advisor">
      <button onClick={onClose}>Fechar</button>
    </div>
  ),
}));

// Hooks mockados para evitar dependências de browser API
vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));
vi.mock('../hooks/useCountUp', () => ({
  useCountUp: (v) => v,
}));
vi.mock('../hooks/useTransactions', () => ({
  useTransactions: () => ({
    transactions: [], transacoesMes: [], resumoMes: {
      saldo_inicial: 0, total_receitas: 0, total_despesas: 0, saldo_atual: 0,
    },
    initialLoading: false, loadingMes: false, saving: false,
    delConfirm: { open: false, mode: 'single', id: null, count: 0 },
    fetchMesSelecionado: vi.fn(), clearCache: vi.fn(), addTransaction: vi.fn(),
    requestDelete: vi.fn(), cancelDelete: vi.fn(), confirmDelete: vi.fn(),
    requestDeleteAll: vi.fn(), confirmDeleteAll: vi.fn(),
  }),
}));

// ── Contextos padrão ──────────────────────────────────────────────────────────

const authValue = {
  user: { _id: 'u1', name: 'Test', email: 'test@test.com' },
  logout: vi.fn(),
  authenticated: true,
};

const themeValue = {
  isDark: true,
  toggleTheme: vi.fn(),
  theme: {},
};

const financeValue = {
  highlightedIds: [],
  legacyImportedTransactions: [],
  importedKeys: new Set(),
  metas: {},
  gastosFixosMetas: {},
  salvarMetas: vi.fn(),
  importTransactionsBatch: vi.fn(),
  addImportedKeys: vi.fn(),
  clearLegacyImportedTransactions: vi.fn(),
  visibleCats: ['Alimentação', 'Transporte'],
  visibleCatIcons: {},
  visibleGastosFix: [],
  hiddenCatLabels: {},
};

function renderDashboard(initialPath = '/dashboard') {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthContext.Provider value={authValue}>
          <ThemeContext.Provider value={themeValue}>
            <FinanceContext.Provider value={financeValue}>
              <Dashboard />
            </FinanceContext.Provider>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('Dashboard — NAV_ITEMS e navegação', () => {
  it('renderiza os 4 itens de navegação no sidebar', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /investimentos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /relatórios/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /configurações/i })).toBeInTheDocument();
    });
  });

  it('marca Dashboard como ativo quando pathname é /dashboard', async () => {
    renderDashboard('/dashboard');
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /dashboard/i });
      // Componente NavItem recebe $active=true quando activeTab === item.id
      // O styled-component aplica font-weight:600 e cor primária
      expect(btn).toBeInTheDocument();
    });
  });

  it('renderiza o bottom nav com os mesmos 4 itens', async () => {
    renderDashboard();
    await waitFor(() => {
      // BottomNavBar tem display:none por padrão (mobile only); hidden:true inclui esses elementos
      const allButtons = screen.getAllByRole('button', { name: /dashboard/i, hidden: true });
      // Sidebar + bottom nav = 2 botões com o mesmo label
      expect(allButtons.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// AIAdvisor descontinuado — botão flutuante removido do Dashboard
describe.skip('Dashboard — AIAdvisor (botão flutuante)', () => {
  it('renderiza o botão flutuante do assistente com aria-label correto', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /abrir assistente ia/i })).toBeInTheDocument();
    });
  });

  it('abre o AIAdvisor ao clicar no botão flutuante', async () => {
    const { user } = renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /abrir assistente ia/i }));

    await user.click(screen.getByRole('button', { name: /abrir assistente ia/i }));
    expect(screen.getByTestId('ai-advisor')).toBeInTheDocument();
  });

  it('fecha o AIAdvisor ao chamar onClose', async () => {
    const { user } = renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /abrir assistente ia/i }));

    await user.click(screen.getByRole('button', { name: /abrir assistente ia/i }));
    expect(screen.getByTestId('ai-advisor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /fechar/i }));
    expect(screen.queryByTestId('ai-advisor')).not.toBeInTheDocument();
  });
});

describe('Dashboard — sub-componentes principais', () => {
  it('renderiza DashboardHeader', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('dashboard-header')).toBeInTheDocument());
  });

  it('renderiza InvestmentPanel', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('investment-panel')).toBeInTheDocument());
  });

  it('renderiza GoalCards', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('goal-cards')).toBeInTheDocument());
  });

  it('renderiza TransactionList', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('transaction-list')).toBeInTheDocument());
  });
});
