import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FileText, Home, LogOut, Menu, Moon, Settings, SunMedium, Wallet, TrendingUp } from 'lucide-react';

import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import FiltroMes from '../components/relatorios/FiltroMes';
import CardsResumo from '../components/relatorios/CardsResumo';
import GraficoBarrasMensal from '../components/relatorios/GraficoBarrasMensal';
import GraficoSaldoAcumulado from '../components/relatorios/GraficoSaldoAcumulado';
import TabelaComparativo from '../components/relatorios/TabelaComparativo';
import CardTaxaPoupanca from '../components/relatorios/CardTaxaPoupanca';
import {
  formatCurrencyBRL,
  getDefaultReportRange,
  listMonthsBetween,
  processarMeses,
} from '../utils/relatorioCalc';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${(props) => props.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,0.18), transparent 24%), linear-gradient(180deg, #04101f 0%, #071425 45%, #030b15 100%)'
    : 'linear-gradient(180deg, #eff4ff 0%, #f8fbff 100%)'};
  color: var(--rel-heading);
  --rel-shell: ${(props) => props.$dark ? 'rgba(7,18,35,0.92)' : '#ffffff'};
  --rel-surface: ${(props) => props.$dark ? 'rgba(9,20,38,0.88)' : '#ffffff'};
  --rel-surface-muted: ${(props) => props.$dark ? 'rgba(13,29,54,0.86)' : '#f6f9ff'};
  --rel-border: ${(props) => props.$dark ? 'rgba(96,165,250,0.16)' : '#d8e3f3'};
  --rel-border-strong: ${(props) => props.$dark ? 'rgba(96,165,250,0.3)' : '#bfd0ea'};
  --rel-heading: ${(props) => props.$dark ? '#eff6ff' : '#0f172a'};
  --rel-text: ${(props) => props.$dark ? '#c6d4f1' : '#334155'};
  --rel-muted: ${(props) => props.$dark ? '#89a0c7' : '#7184a0'};
  --rel-primary: ${(props) => props.$dark ? '#60a5fa' : '#378ADD'};
  --rel-input-bg: ${(props) => props.$dark ? 'rgba(6,18,34,0.92)' : '#f8fbff'};
  --rel-table-head: ${(props) => props.$dark ? 'rgba(12,25,46,0.88)' : '#f4f8ff'};
  --rel-grid: ${(props) => props.$dark ? 'rgba(148,163,184,0.18)' : '#e2e8f0'};
  --rel-shadow: ${(props) => props.$dark ? '0 18px 40px rgba(2,12,27,0.38)' : '0 16px 36px rgba(15,23,42,0.08)'};
  --rel-soft-shadow: ${(props) => props.$dark ? '0 10px 28px rgba(2,12,27,0.3)' : '0 10px 28px rgba(15,23,42,0.05)'};
`;

const Sidebar = styled.aside`
  width: 240px;
  background: var(--rel-shell);
  border-right: 1px solid var(--rel-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  flex-shrink: 0;
  backdrop-filter: blur(18px);
  @media (max-width: 768px) {
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 400;
    transform: ${p => p.$open ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
    box-shadow: ${p => p.$open ? '4px 0 32px rgba(0,0,0,0.35)' : 'none'};
  }
`;
const MobileOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${p => p.$visible ? 'block' : 'none'};
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5); z-index: 399;
    backdrop-filter: blur(2px);
  }
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rel-primary);
  margin-bottom: 2rem;
`;

const NavMenu = styled.nav`
  flex: 1;
  padding: 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 0.625rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  transition: all 0.15s;
  background: ${(props) => props.$active ? 'rgba(55,138,221,0.12)' : 'transparent'};
  color: ${(props) => props.$active ? 'var(--rel-primary)' : 'var(--rel-muted)'};
  font-weight: ${(props) => props.$active ? 700 : 500};

  &:hover {
    background: var(--rel-surface-muted);
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem 0.75rem 0;
  margin-top: auto;
  display: grid;
  gap: 0.75rem;
`;

const ThemeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  width: 100%;
  padding: 0.82rem 1rem;
  border: 1px solid var(--rel-border);
  border-radius: 0.95rem;
  cursor: pointer;
  background: ${(props) => props.$dark ? 'rgba(10,24,44,.85)' : '#ffffff'};
  color: var(--rel-heading);
  box-shadow: var(--rel-soft-shadow);
`;

const ThemeMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  strong {
    display: block;
    font-size: 0.9rem;
  }

  span {
    display: block;
    font-size: 0.76rem;
    color: var(--rel-muted);
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 0.75rem;
  background: ${(props) => props.$dark ? 'rgba(127,29,29,0.28)' : '#fef2f2'};
  color: #ef4444;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Header = styled.header`
  min-height: 64px;
  background: var(--rel-shell);
  border-bottom: 1px solid var(--rel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  flex-shrink: 0;
  backdrop-filter: blur(18px);
  gap: 0.75rem;
  @media (max-width: 768px) { padding: 0.75rem 1rem; flex-wrap: wrap; }
`;
const HamburgerBtn = styled.button`
  display: none; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: 1px solid var(--rel-border);
  border-radius: 0.5rem; background: var(--rel-surface); color: var(--rel-heading);
  cursor: pointer; flex-shrink: 0; transition: background 0.15s;
  &:hover { background: var(--rel-surface-muted); }
  @media (max-width: 768px) { display: flex; }
`;

const HeaderTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--rel-heading);
`;

const HeaderMeta = styled.div`
  color: var(--rel-muted);
  font-size: 0.84rem;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
  @media (max-width: 768px) { padding: 1rem; }
`;

const ContentWrapper = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionCard = styled.section`
  padding: 1.5rem;
  border-radius: 1.2rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-shell);
  box-shadow: var(--rel-shadow);
`;

const SectionHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h1 {
    margin: 0 0 0.35rem;
    font-size: 1.4rem;
    color: var(--rel-heading);
  }

  p {
    margin: 0;
    color: var(--rel-muted);
    line-height: 1.6;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  gap: 1.25rem;
`;

const EmptyState = styled.div`
  padding: 2rem 1rem 1rem;
  text-align: center;
  color: var(--rel-muted);

  strong {
    display: block;
    color: var(--rel-heading);
    margin-bottom: 0.45rem;
  }
`;

const LoadingState = styled.div`
  padding: 2rem 1rem 1rem;
  text-align: center;
  color: var(--rel-muted);
`;

const normalizeDate = (raw) => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw).slice(0, 10);

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const normalizeTransaction = (transaction) => ({
  id: transaction?._id || transaction?.id || `${transaction?.descricao}-${transaction?.data}`,
  data: normalizeDate(transaction?.data || transaction?.data_hora || transaction?.createdAt || transaction?.date),
  descricao: String(transaction?.descricao || '').trim(),
  valor: Number(transaction?.valor || 0),
  tipo: transaction?.tipo === 'receita' ? 'receita' : 'despesa',
  categoria: transaction?.categoria || 'Outros',
});

export default function Relatorios() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periodo, setPeriodo] = useState(getDefaultReportRange);
  const [serverTransactions, setServerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarPeriodo = useCallback(async (inicio, fim) => {
    const meses = listMonthsBetween(inicio, fim);

    if (!meses.length) {
      setServerTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.allSettled(meses.map(async (mes) => {
        const { data } = await api.get(`/wallet/extrato/${mes}`);
        return Array.isArray(data?.transacoes) ? data.transacoes : [];
      }));

      const falhas = results.filter(r => r.status === 'rejected' && r.reason?.response?.status !== 404).length;
      const transacoes = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      const normalizadas = transacoes
        .map(normalizeTransaction)
        .filter((transaction) => transaction.data && transaction.descricao);

      setServerTransactions(normalizadas);

      if (falhas > 0) {
        console.warn(`[Relatórios] ${falhas} mês(es) não puderam ser carregados.`);
      }
    } catch {
      setServerTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPeriodo(periodo.inicio, periodo.fim);
  }, [carregarPeriodo, periodo.fim, periodo.inicio]);

  const handleChangeInicio = (value) => {
    setPeriodo((current) => ({
      inicio: value,
      fim: value > current.fim ? value : current.fim,
    }));
  };

  const handleChangeFim = (value) => {
    setPeriodo((current) => ({
      inicio: value < current.inicio ? value : current.inicio,
      fim: value,
    }));
  };

  const transacoesPeriodo = useMemo(
    () => serverTransactions,
    [serverTransactions],
  );

  const mesesProcessados = useMemo(
    () => processarMeses(transacoesPeriodo, periodo.inicio, periodo.fim),
    [periodo.fim, periodo.inicio, transacoesPeriodo],
  );

  const resumo = useMemo(() => {
    const totalReceitas = mesesProcessados.reduce((acc, item) => acc + item.receita, 0);
    const totalDespesas = mesesProcessados.reduce((acc, item) => acc + item.despesa, 0);
    const saldoPeriodo = totalReceitas - totalDespesas;
    const mediaMensalGastos = mesesProcessados.length ? totalDespesas / mesesProcessados.length : 0;

    return {
      totalReceitas,
      totalDespesas,
      saldoPeriodo,
      mediaMensalGastos,
    };
  }, [mesesProcessados]);

  const hasTransactions = transacoesPeriodo.length > 0;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppContainer $dark={isDark}>
      <MobileOverlay $visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      <Sidebar $open={sidebarOpen}>
        <LogoArea><Wallet size={22} /> Waltrix</LogoArea>
        <NavMenu>
          <NavItem onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}>
            <Home size={17} /> Dashboard
          </NavItem>
          <NavItem onClick={() => { navigate('/investimentos'); setSidebarOpen(false); }}>
            <TrendingUp size={17} /> Investimentos
          </NavItem>
          <NavItem $active onClick={() => { navigate('/relatorios'); setSidebarOpen(false); }}>
            <FileText size={17} /> Relatórios
          </NavItem>
          <NavItem onClick={() => { navigate('/configuracoes'); setSidebarOpen(false); }}>
            <Settings size={17} /> Configurações
          </NavItem>
        </NavMenu>
        <SidebarFooter>
          <ThemeButton onClick={toggleTheme} type="button" $dark={isDark}>
            <ThemeMeta>
              {isDark ? <Moon size={18} color="#60a5fa" /> : <SunMedium size={18} color="#378ADD" />}
              <div>
                <strong>Tema</strong>
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
            </ThemeMeta>
          </ThemeButton>
          <LogoutButton type="button" onClick={handleLogout} $dark={isDark}>
            <LogOut size={18} />
            Sair
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>

      <MainContent>
        <Header>
          <HamburgerBtn onClick={() => setSidebarOpen(prev => !prev)} aria-label="Abrir menu">
            <Menu size={18} />
          </HamburgerBtn>
          <HeaderTitle>Relatórios</HeaderTitle>
          <HeaderMeta>{formatCurrencyBRL(resumo.totalDespesas)} em gastos no período atual</HeaderMeta>
        </Header>

        <ContentArea>
          <ContentWrapper>
            <SectionCard>
              <SectionHead>
                <div>
                  <h1>Gastos por Mês</h1>
                  <p>Analise receitas, despesas, saldo e evolução acumulada dentro do intervalo escolhido.</p>
                </div>
              </SectionHead>

              <FiltroMes
                inicio={periodo.inicio}
                fim={periodo.fim}
                onChangeInicio={handleChangeInicio}
                onChangeFim={handleChangeFim}
              />
            </SectionCard>

            <CardsResumo resumo={resumo} />

            {loading ? (
              <SectionCard>
                <LoadingState>Carregando dados do período selecionado...</LoadingState>
              </SectionCard>
            ) : !hasTransactions ? (
              <SectionCard>
                <EmptyState>
                  <strong>Nenhuma transação encontrada neste período</strong>
                  Ajuste o filtro de datas para visualizar outros meses.
                </EmptyState>
              </SectionCard>
            ) : (
              <>
                <ChartsGrid>
                  <GraficoBarrasMensal data={mesesProcessados} mediaDespesas={resumo.mediaMensalGastos} />
                  <GraficoSaldoAcumulado data={mesesProcessados} />
                </ChartsGrid>

                <CardTaxaPoupanca data={mesesProcessados} />

                <TabelaComparativo data={mesesProcessados} resumo={resumo} />
              </>
            )}
          </ContentWrapper>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}
