import React, { useState } from "react";
import styled, { css } from "styled-components";
import {
    Home,
    PieChart,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Plus,
    Bell,
    Search,
    User,
    AlertTriangle,
} from "lucide-react";

// --- DADOS SIMULADOS (MOCK) ---
const mockSummary = {
    month: "Abril 2026",
    income: 8500.0,
    expense: 4250.0,
    balance: 4250.0,
    totalBudget: 6000.0,
};

const mockCategoryBudgets = [
    { id: 1, name: "Alimentação", limit: 1500, spent: 1350, icon: "🍔" },
    { id: 2, name: "Moradia", limit: 2000, spent: 2000, icon: "🏠" },
    { id: 3, name: "Transporte", limit: 600, spent: 250, icon: "🚗" },
    { id: 4, name: "Lazer", limit: 800, spent: 900, icon: "🎉" }, // Estourou
    { id: 5, name: "Saúde", limit: 500, spent: 100, icon: "💊" },
];

const mockRecentTransactions = [
    {
        id: 1,
        description: "Supermercado Extra",
        amount: -350.0,
        date: "10 Abr",
        category: "Alimentação",
    },
    {
        id: 2,
        description: "Salário",
        amount: 8500.0,
        date: "05 Abr",
        category: "Receita",
    },
    {
        id: 3,
        description: "Uber",
        amount: -45.0,
        date: "04 Abr",
        category: "Transporte",
    },
    {
        id: 4,
        description: "Conta de Luz",
        amount: -180.0,
        date: "02 Abr",
        category: "Moradia",
    },
];

// --- COMPONENTES AUXILIARES VISUAIS ---

// Gráfico Donut (SVG)
const StyledDonutChart = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .circle-bg {
    fill: none;
    stroke: #e2e8f0; // slate-200
    stroke-width: 3;
  }

  .circle-progress {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    transition: all 1s ease-out;
  }
`;

const DonutText = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span:first-child {
    font-size: 1.875rem; // text-3xl
    font-weight: bold;
    color: #1e293b; // slate-800
  }

  span:last-child {
    font-size: 0.75rem; // text-xs
    color: #64748b; // slate-500
  }
`;

const DonutChart = ({ spent, budget }) => {
    const percentage = Math.min((spent / budget) * 100, 100);

    let color = "#16a34a"; // green-500
    if (percentage > 75) color = "#eab308"; // yellow-500
    if (percentage >= 100) color = "#dc2626"; // red-500

    return (
        <StyledDonutChart>
            <svg viewBox="0 0 36 36">
                <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                    className="circle-progress"
                    stroke={color}
                    strokeDasharray={`${percentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
            </svg>
            <DonutText>
                <span>{percentage.toFixed(0)}%</span>
                <span>Consumido</span>
            </DonutText>
        </StyledDonutChart>
    );
};

// Barra de Progresso Categorias
const ProgressBarContainer = styled.div`
  width: 100%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem; // text-sm
  margin-bottom: 0.25rem;

  span:first-child {
    font-weight: 500;
    color: #334155; // slate-700
    strong { color: #64748b; font-weight: 400; }
  }

  span:last-child {
    font-weight: bold;
    color: ${props => (props.isOver ? "#dc2626" : "#64748b")};
  }
`;

const ProgressBarTrack = styled.div`
  height: 0.5rem; // h-2
  width: 100%;
  background-color: #e2e8f0; // slate-200
  border-radius: 9999px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  border-radius: 9999px;
  transition: all 0.5s;
  width: ${props => props.width}%;
  background-color: ${props => props.color};
`;

const BudgetAlert = styled.p`
  font-size: 0.75rem; // text-xs
  color: #dc2626; // red-500
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ProgressBar = ({ spent, limit }) => {
    const percentage = (spent / limit) * 100;
    const isOverBudget = percentage > 100;
    const cappedPercentage = Math.min(percentage, 100);

    let barColor = "#16a34a"; // green-500
    if (percentage > 75) barColor = "#eab308"; // yellow-500
    if (percentage > 95) barColor = "#dc2626"; // red-500

    return (
        <ProgressBarContainer>
            <ProgressInfo isOver={isOverBudget}>
                <span>
                    R$ {spent.toFixed(2)} <strong>/ R$ {limit.toFixed(2)}</strong>
                </span>
                <span>{percentage.toFixed(0)}%</span>
            </ProgressInfo>
            <ProgressBarTrack>
                <ProgressBarFill width={cappedPercentage} color={barColor} />
            </ProgressBarTrack>
            {isOverBudget && (
                <BudgetAlert>
                    <AlertTriangle size={12} /> Orçamento excedido em R${" "}
                    {(spent - limit).toFixed(2)}
                </BudgetAlert>
            )}
        </ProgressBarContainer>
    );
};

// --- ESTILOS GERAIS (LAYOUT) ---

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f8fafc; // slate-50
  display: flex;
  font-family: "Inter", sans-serif;
  color: #0f172a; // slate-900
`;

const Sidebar = styled.aside`
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0; // slate-200
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5; // Indigo-600
  margin-bottom: 2rem;
`;

const NavMenu = styled.nav`
  flex: 1;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background-color: ${props => (props.active ? "#e0e7ff" : "transparent")};
  color: ${props => (props.active ? "#4f46e5" : "#475569")};
  border-radius: 0.75rem;
  font-weight: ${props => (props.active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9;
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
`;

const UserInfo = styled.div`
  font-size: 0.875rem; // text-sm
  p:first-child { font-weight: 500; }
  p:last-child { color: #64748b; font-size: 0.75rem; }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.header`
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
`;

const HeaderTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: none;
  @media (min-width: 640px) { display: block; }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem 0.5rem 2.25rem;
  background-color: #f1f5f9;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  border: none;
  width: 256px;
  &:focus { outline: none; border: 2px solid #4f46e5; }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  color: #64748b;
  border: none;
  background: none;
  border-radius: 9999px;
  cursor: pointer;
  position: relative;
  &:hover { background-color: #f1f5f9; }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: #ef4444; // red-500
  border-radius: 9999px;
`;

const NewTransactionButton = styled.button`
  background-color: #4f46e5;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  &:hover { background-color: #4338ca; }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const ContentWrapper = styled.div`
  max-width: 1152px; // max-w-6xl
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  @media (min-width: 768px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  gap: 1.5rem;
`;

const KpiCard = styled.div`
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
`;

const HighlightCard = styled(KpiCard)`
  background-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const KpiHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  h3 { font-weight: 500; color: #64748b; }
`;

const HighlightHeader = styled(KpiHeader)`
  h3 { color: #e0e7ff; }
`;

const KpiIconWrapper = styled.div`
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  ${props =>
        props.type === "income" &&
        css`
      background-color: #f0fdf4;
      color: #16a34a;
    `}
  ${props =>
        props.type === "expense" &&
        css`
      background-color: #fef2f2;
      color: #dc2626;
    `}
  ${props =>
        props.type === "balance" &&
        css`
      background-color: rgba(99, 102, 241, 0.5);
    `}
`;

const KpiValue = styled.p`
  font-size: 1.875rem; // text-3xl
  font-weight: bold;
  color: #1e293b;
`;

const HighlightValue = styled(KpiValue)`
  color: #ffffff;
`;

const HighlightFooter = styled.p`
  color: #e0e7ff;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  @media (min-width: 1024px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  gap: 1.5rem;
`;

const Panel = styled.div`
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
`;

const BudgetPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const CategoryPanel = styled(Panel)`
  @media (min-width: 1024px) { grid-column: span 2; }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  width: 100%;
  h3 { font-size: 1.125rem; font-weight: 600; }
`;

const TextLink = styled.button`
  font-size: 0.875rem;
  color: #4f46e5;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const BudgetValueArea = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  width: 100%;
  p:first-child { color: #64748b; font-size: 0.875rem; margin-bottom: 0.25rem; }
  p:nth-child(2) { font-size: 1.25rem; font-weight: 600; color: #1e293b; }
`;

const BudgetSummary = styled.p`
  font-size: 0.875rem;
  margin-top: 0.75rem;
  color: #64748b;
  background-color: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.5rem;
  strong { color: #1e293b; }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CategoryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const CategoryIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const CategoryContent = styled.div`
  flex: 1;
  padding-top: 0.25rem;
  p { font-weight: 600; color: #1e293b; margin-bottom: 0.25rem; }
`;

const TransactionPanel = styled(Panel)`
  overflow: hidden;
  padding: 0;
`;

const TransactionHeader = styled(PanelHeader)`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 0;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;

  thead {
    background-color: #f8fafc;
    color: #64748b;
    font-size: 0.875rem;
    th { padding: 1rem; font-weight: 500; }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.2s;
      &:hover { background-color: #f8fafc; }
      &:last-child { border-bottom: none; }
    }
    td { padding: 1rem; font-size: 0.875rem; color: #1e293b; }
  }
`;

const CategoryTd = styled.td`
  color: #64748b !important;
  font-size: 0.875rem;
`;

const AmountTd = styled.td`
  text-align: right;
  font-weight: 500;
  color: ${props => (props.isPositive ? "#16a34a" : "#1e293b")} !important;
`;

// --- COMPONENTE PRINCIPAL (REACT) ---

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("Dashboard");

    return (
        <AppContainer>
            {/* Sidebar (Navegação) */}
            <Sidebar>
                <LogoArea>
                    <Wallet size={24} /> Web-Wallet
                </LogoArea>
                <NavMenu>
                    <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
                        <Home size={20} /> Dashboard
                    </NavItem>
                    <NavItem active={activeTab === "budgets"} onClick={() => setActiveTab("budgets")}>
                        <PieChart size={20} /> Orçamentos
                    </NavItem>
                </NavMenu>
                <SidebarFooter>
                    <UserProfile>
                        <UserAvatar><User size={16} /></UserAvatar>
                        <UserInfo>
                            <p>João Silva</p>
                            <p>joao@email.com</p>
                        </UserInfo>
                    </UserProfile>
                </SidebarFooter>
            </Sidebar>

            {/* Área Principal */}
            <MainContent>
                {/* Header Superior */}
                <Header>
                    <HeaderTitle>Visão Geral</HeaderTitle>
                    <HeaderActions>
                        <SearchWrapper>
                            <SearchIconWrapper><Search size={16} /></SearchIconWrapper>
                            <SearchInput type="text" placeholder="Buscar transação..." />
                        </SearchWrapper>
                        <IconButton>
                            <Bell size={20} />
                            <NotificationBadge />
                        </IconButton>
                        <NewTransactionButton>
                            <Plus size={16} /> Nova Transação
                        </NewTransactionButton>
                    </HeaderActions>
                </Header>

                {/* Conteúdo Rolável */}
                <ContentArea>
                    <ContentWrapper>

                        {/* Cards de Resumo (KPIs) */}
                        <KpiGrid>
                            <KpiCard>
                                <KpiHeader>
                                    <h3>Receitas</h3>
                                    <KpiIconWrapper type="income"><ArrowUpCircle size={20} /></KpiIconWrapper>
                                </KpiHeader>
                                <KpiValue>
                                    R$ {mockSummary.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </KpiValue>
                            </KpiCard>

                            <KpiCard>
                                <KpiHeader>
                                    <h3>Despesas</h3>
                                    <KpiIconWrapper type="expense"><ArrowDownCircle size={20} /></KpiIconWrapper>
                                </KpiHeader>
                                <KpiValue>
                                    R$ {mockSummary.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </KpiValue>
                            </KpiCard>

                            <HighlightCard>
                                <HighlightHeader>
                                    <h3>Saldo Atual</h3>
                                    <KpiIconWrapper type="balance"><Wallet size={20} /></KpiIconWrapper>
                                </HighlightHeader>
                                <HighlightValue>
                                    R$ {mockSummary.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </HighlightValue>
                                <HighlightFooter>Ref. {mockSummary.month}</HighlightFooter>
                            </HighlightCard>
                        </KpiGrid>

                        {/* Seção Principal: Gasto x Orçamento */}
                        <MainGrid>
                            {/* Gráfico Geral de Orçamento */}
                            <BudgetPanel>
                                <PanelHeader><h3>Orçamento Mensal Total</h3></PanelHeader>
                                <DonutChart spent={mockSummary.expense} budget={mockSummary.totalBudget} />
                                <BudgetValueArea>
                                    <p>Limite Total Definido</p>
                                    <p>R$ {mockSummary.totalBudget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    <BudgetSummary>
                                        Você ainda tem <strong>R$ {(mockSummary.totalBudget - mockSummary.expense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> disponíveis.
                                    </BudgetSummary>
                                </BudgetValueArea>
                            </BudgetPanel>

                            {/* Índices por Categoria */}
                            <CategoryPanel>
                                <PanelHeader>
                                    <h3>Gasto por Categoria</h3>
                                    <TextLink>Editar Metas</TextLink>
                                </PanelHeader>
                                <CategoryList>
                                    {mockCategoryBudgets.map((cat) => (
                                        <CategoryItem key={cat.id}>
                                            <CategoryIcon>{cat.icon}</CategoryIcon>
                                            <CategoryContent>
                                                <p>{cat.name}</p>
                                                <ProgressBar spent={cat.spent} limit={cat.limit} />
                                            </CategoryContent>
                                        </CategoryItem>
                                    ))}
                                </CategoryList>
                            </CategoryPanel>
                        </MainGrid>

                        {/* Últimas Transações */}
                        <TransactionPanel>
                            <TransactionHeader>
                                <h3>Últimas Transações</h3>
                                <TextLink>Ver todas</TextLink>
                            </TransactionHeader>
                            <TableWrapper>
                                <StyledTable>
                                    <thead>
                                        <tr>
                                            <th>Descrição</th>
                                            <th>Categoria</th>
                                            <th>Data</th>
                                            <th style={{ textAlign: 'right' }}>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockRecentTransactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>{tx.description}</td>
                                                <CategoryTd>{tx.category}</CategoryTd>
                                                <CategoryTd>{tx.date}</CategoryTd>
                                                <AmountTd isPositive={tx.amount > 0}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </AmountTd>
                                            </tr>
                                        ))}
                                    </tbody>
                                </StyledTable>
                            </TableWrapper>
                        </TransactionPanel>

                    </ContentWrapper>
                </ContentArea>
            </MainContent>
        </AppContainer>
    );
}