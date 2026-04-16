import React, { useContext, useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BarChart3, CreditCard, Landmark,
  Moon, ShieldCheck, Sparkles, SunMedium, Wallet, Zap
} from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

const sweep = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(140%); }
`;

const hoverLift = css`
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, filter .22s ease;
  &:hover {
    transform: translateY(-4px) scale(1.03);
    filter: brightness(1.06);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  overflow: hidden;
  background: ${p => p.$dark
    ? 'radial-gradient(circle at top, rgba(14,165,233,.18), transparent 26%), linear-gradient(180deg, #030814 0%, #071122 48%, #040b17 100%)'
    : 'radial-gradient(circle at top, rgba(37,99,235,.16), transparent 26%), linear-gradient(180deg, #eef5ff 0%, #f8fbff 48%, #edf4ff 100%)'};
  color: ${p => p.$dark ? '#eff6ff' : '#0f172a'};
`;

const Wrap = styled.div`
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.2rem 0 5rem;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  margin-bottom: 3rem;
  border-radius: 1.25rem;
  backdrop-filter: blur(18px);
  background: ${p => p.$dark ? 'rgba(6,14,28,.72)' : 'rgba(255,255,255,.74)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.18)' : '#d8e3f3'};
  box-shadow: ${p => p.$dark ? '0 20px 45px rgba(2,12,27,.38)' : '0 18px 40px rgba(15,23,42,.08)'};

  @media (max-width: 920px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  color: inherit;
  text-decoration: none;
  font-weight: 800;

  .logo {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 1rem;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #4f46e5 100%);
    box-shadow: 0 12px 28px rgba(37,99,235,.3);
  }

  span {
    display: block;
    font-size: 0.78rem;
    color: ${p => p.$dark ? '#8fb1db' : '#607798'};
    font-weight: 600;
  }

  .logo { ${hoverLift} }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;

  a {
    color: ${p => p.$dark ? '#d8e6ff' : '#1e293b'};
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: 700;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const ThemeButton = styled.button`
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 999px;
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.18)' : '#d8e3f3'};
  background: ${p => p.$dark ? 'rgba(10,24,44,.88)' : '#fff'};
  color: ${p => p.$dark ? '#eff6ff' : '#0f172a'};
  display: grid;
  place-items: center;
  cursor: pointer;
  ${hoverLift}
`;

const HeaderLink = styled(Link)`
  text-decoration: none;
  padding: .82rem 1rem;
  border-radius: 0.95rem;
  font-weight: 800;
  color: ${p => p.$ghost ? (p.$dark ? '#d9e6ff' : '#173155') : '#fff'};
  background: ${p => p.$ghost
    ? (p.$dark ? 'rgba(10,24,44,.85)' : '#fff')
    : 'linear-gradient(135deg, #06b6d4 0%, #2563eb 52%, #4f46e5 100%)'};
  border: 1px solid ${p => p.$ghost ? (p.$dark ? 'rgba(96,165,250,.16)' : '#d8e3f3') : 'transparent'};
  box-shadow: ${p => p.$ghost
    ? (p.$dark ? '0 14px 30px rgba(2,12,27,.28)' : '0 16px 28px rgba(15,23,42,.07)')
    : '0 18px 36px rgba(37,99,235,.28)'};
  ${hoverLift}
`;

const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(360px, .98fr);
  gap: 2rem;
  align-items: center;
  margin-bottom: 4.6rem;

  @media (max-width: 1020px) {
    grid-template-columns: 1fr;
  }
`;

const HeroCopy = styled.div`
  animation: ${fadeUp} .75s ease both;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .58rem .9rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
  font-size: .84rem;
  font-weight: 800;
  color: ${p => p.$dark ? '#d7e8ff' : '#153456'};
  background: ${p => p.$dark ? 'rgba(8,25,49,.88)' : 'rgba(255,255,255,.86)'};
  border: 1px solid ${p => p.$dark ? 'rgba(56,189,248,.2)' : 'rgba(37,99,235,.15)'};
`;

const HeroTitle = styled.h1`
  margin: 0 0 1rem;
  max-width: 11ch;
  font-size: clamp(3rem, 5vw, 5.5rem);
  line-height: .94;
  letter-spacing: -.07em;

  span {
    display: block;
    background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 38%, #4f46e5 72%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const HeroText = styled.p`
  max-width: 58ch;
  margin: 0 0 1.5rem;
  font-size: 1.04rem;
  line-height: 1.8;
  color: ${p => p.$dark ? '#aabedc' : '#4d6488'};
`;

const CTAGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .9rem;
  margin-bottom: 1.4rem;
`;

const CTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  text-decoration: none;
  padding: 1rem 1.3rem;
  border-radius: 1rem;
  font-weight: 800;
  color: ${p => p.$secondary ? (p.$dark ? '#d9e6ff' : '#173155') : '#fff'};
  background: ${p => p.$secondary
    ? (p.$dark ? 'rgba(10,24,44,.85)' : '#fff')
    : 'linear-gradient(135deg, #06b6d4 0%, #2563eb 48%, #4f46e5 100%)'};
  border: 1px solid ${p => p.$secondary ? (p.$dark ? 'rgba(96,165,250,.16)' : '#d8e3f3') : 'transparent'};
  box-shadow: ${p => p.$secondary
    ? (p.$dark ? '0 14px 30px rgba(2,12,27,.28)' : '0 16px 28px rgba(15,23,42,.07)')
    : '0 18px 36px rgba(37,99,235,.28)'};
  ${hoverLift}
  ${p => p.$float && css`
    animation: ${float} 6.4s ease-in-out infinite;
  `}
`;

const SignalRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .85rem;
`;

const Signal = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .74rem .95rem;
  border-radius: 999px;
  background: ${p => p.$dark ? 'rgba(9,22,40,.78)' : 'rgba(255,255,255,.86)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.14)' : 'rgba(148,163,184,.14)'};
  color: ${p => p.$dark ? '#d3e1fb' : '#244267'};
  font-size: .84rem;
  font-weight: 800;
  ${hoverLift}
`;

const Preview = styled.div`
  position: relative;
  padding-top: 2.35rem;
  padding-right: 1.35rem;
  animation: ${fadeUp} .8s ease .12s both;

  @media (max-width: 1020px) {
    padding-top: 0;
    padding-right: 0;
  }
`;

const LiveChip = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
  width: min(15rem, calc(100% - 1rem));
  padding: 1rem 1.1rem;
  border-radius: 1.2rem;
  background: ${p => p.$dark ? 'rgba(8,24,44,.92)' : '#fff'};
  border: 1px solid ${p => p.$dark ? 'rgba(34,211,238,.2)' : '#dbe7f6'};
  box-shadow: ${p => p.$dark ? '0 16px 36px rgba(2,12,27,.38)' : '0 16px 36px rgba(15,23,42,.1)'};
  animation: ${float} 7s ease-in-out infinite;
  ${hoverLift}

  @media (max-width: 1020px) {
    position: relative;
    right: 0;
    top: auto;
    margin-bottom: 1rem;
  }
`;

const LiveChipLabel = styled.div`
  display: flex;
  align-items: center;
  gap: .55rem;
  color: ${p => p.$dark ? '#d8e6ff' : '#1e293b'};
  font-size: .94rem;
  font-weight: 800;
  line-height: 1.2;

  &::before {
    content: '';
    width: .72rem;
    height: .72rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #22d3ee 0%, #2563eb 68%, #4f46e5 100%);
    box-shadow: 0 0 0 6px rgba(59,130,246,.14);
    flex: 0 0 auto;
  }
`;

const LiveChipValue = styled.div`
  margin-top: .45rem;
  font-size: clamp(1.24rem, 2.2vw, 1.65rem);
  font-weight: 900;
  letter-spacing: -.04em;
  line-height: 1.05;
  color: ${p => p.$dark ? '#f8fbff' : '#0f172a'};
`;

const LiveChipDelta = styled.small`
  display: block;
  margin-top: .35rem;
  color: ${p => p.$dark ? '#7dd3fc' : '#2563eb'};
  font-weight: 800;
  line-height: 1.3;
`;

const Mock = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 1.8rem;
  padding: 1.4rem;
  background: ${p => p.$dark ? 'rgba(4,13,26,.86)' : 'rgba(255,255,255,.9)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.18)' : 'rgba(148,163,184,.16)'};
  box-shadow: ${p => p.$dark ? '0 30px 70px rgba(2,12,27,.48)' : '0 30px 70px rgba(15,23,42,.12)'};
  backdrop-filter: blur(18px);

  &::before {
    content: '';
    position: absolute;
    inset: -40%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
    animation: ${sweep} 5.6s linear infinite;
  }

  @media (min-width: 1021px) {
    padding-top: 4.9rem;
  }
`;

const MockInner = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
`;

const TopMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .8rem;
  align-items: stretch;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Metric = styled.div`
  min-height: 5.9rem;
  padding: 1.1rem 1.15rem;
  border-radius: 1.1rem;
  background: ${p => p.$highlight
    ? 'linear-gradient(135deg, rgba(14,165,233,.26), rgba(37,99,235,.34), rgba(79,70,229,.28))'
    : (p.$dark ? 'rgba(9,22,40,.88)' : '#f8fbff')};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.14)' : '#dbe7f6'};
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: ${p => p.$highlight
    ? '0 18px 34px rgba(37,99,235,.2)'
    : 'none'};

  small {
    display: block;
    margin-bottom: .55rem;
    color: ${p => p.$dark ? '#8fb1db' : '#6881a6'};
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  strong {
    font-size: ${p => p.$highlight ? '1.62rem' : '1.42rem'};
    letter-spacing: -.04em;
    color: ${p => p.$highlight ? (p.$dark ? '#f8fbff' : '#102038') : 'inherit'};
  }
  ${hoverLift}
`;

const MockGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: stretch;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Widget = styled.div`
  border-radius: 1.3rem;
  padding: 1.1rem;
  background: ${p => p.$dark ? 'rgba(8,19,37,.92)' : 'rgba(244,248,255,.95)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.14)' : '#dbe7f6'};
  min-height: 23rem;
  ${hoverLift}
`;

const WidgetTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-weight: 800;
`;

const Ring = styled.div`
  width: 160px;
  height: 160px;
  margin: 1rem auto 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle, ${p => p.$dark ? '#07111f' : '#fff'} 0 57%, transparent 58%),
    conic-gradient(#22d3ee 0 26%, #2563eb 26% 68%, rgba(148,163,184,.18) 68% 100%);
`;

const Flow = styled.div`
  display: grid;
  gap: .8rem;
`;

const FlowRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: .7rem;
  align-items: center;
  padding: .85rem .9rem;
  border-radius: 1rem;
  background: ${p => p.$dark ? 'rgba(13,29,54,.8)' : '#fff'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.12)' : '#e0e9f7'};

  strong { font-size: .94rem; }
  > strong {
    white-space: nowrap;
    text-align: right;
    align-self: start;
    font-size: .82rem;
    line-height: 1.15;
  }
  span { color: ${p => p.$dark ? '#89a0c7' : '#64748b'}; font-size: .82rem; }
  ${hoverLift}
`;

const FlowCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: .18rem;
  min-width: 0;

  strong,
  span {
    display: block;
  }
`;

const Dot = styled.div`
  width: .72rem;
  height: .72rem;
  border-radius: 999px;
  background: ${p => p.$bg};
  box-shadow: 0 0 0 6px ${p => p.$ring};
  transition: transform .22s ease, box-shadow .22s ease;
`;

const Section = styled.section`
  margin-bottom: 4.6rem;
  animation: ${fadeUp} .72s ease both;
`;

const SectionHead = styled.div`
  max-width: 740px;
  margin-bottom: 1.7rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    margin-bottom: .75rem;
    color: ${p => p.$dark ? '#7dd3fc' : '#0f5dc5'};
    font-size: .78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  h2 {
    margin: 0 0 .8rem;
    font-size: clamp(2rem, 3vw, 3.1rem);
    letter-spacing: -.05em;
  }

  p {
    margin: 0;
    line-height: 1.8;
    color: ${p => p.$dark ? '#9cb4d8' : '#5e7498'};
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.article`
  padding: 1.2rem;
  border-radius: 1.35rem;
  background: ${p => p.$dark ? 'rgba(6,17,33,.88)' : 'rgba(255,255,255,.92)'};
  border: 1px solid ${p => p.$active ? 'rgba(59,130,246,.38)' : (p.$dark ? 'rgba(96,165,250,.12)' : '#dde7f5')};
  box-shadow: ${p => p.$dark ? '0 18px 48px rgba(2,12,27,.32)' : '0 18px 40px rgba(15,23,42,.08)'};
  transform: translateY(${p => p.$active ? '-6px' : '0'});
  transition: transform .25s ease, border-color .25s ease;

  h3 {
    margin: 1rem 0 .55rem;
    font-size: 1.03rem;
  }

  p {
    margin: 0;
    line-height: 1.72;
    color: ${p => p.$dark ? '#97add0' : '#62789d'};
    font-size: .93rem;
  }
  ${hoverLift}
`;

const IconTile = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: grid;
  place-items: center;
  background: ${p => p.$dark ? 'rgba(14,165,233,.12)' : 'rgba(37,99,235,.08)'};
  color: ${p => p.$dark ? '#7dd3fc' : '#1d4ed8'};
  ${hoverLift}
`;

const DoubleGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 1rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  padding: 1.35rem;
  border-radius: 1.45rem;
  background: ${p => p.$dark ? 'rgba(6,18,34,.88)' : 'rgba(255,255,255,.92)'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.14)' : '#dbe7f6'};
  box-shadow: ${p => p.$dark ? '0 20px 48px rgba(2,12,27,.3)' : '0 20px 42px rgba(15,23,42,.08)'};
  ${hoverLift}
`;

const Bars = styled.div`
  display: grid;
  gap: .88rem;
  margin-top: 1.25rem;
`;

const BarRow = styled.div`
  display: grid;
  gap: .42rem;

  .bar-label {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: .9rem;
    font-weight: 700;
    color: ${p => p.$dark ? '#dce8ff' : '#173155'};
  }

  .bar-track {
    height: .6rem;
    width: 100%;
    border-radius: 999px;
    background: ${p => p.$dark ? 'rgba(15,31,58,.88)' : '#e6eef9'};
    overflow: hidden;
  }

  .bar-fill {
    display: block;
    height: 100%;
    width: ${p => p.$width}%;
    border-radius: inherit;
    background: linear-gradient(90deg, #22d3ee 0%, #3b82f6 45%, #4f46e5 100%);
  }
  ${hoverLift}
`;

const SignalBoard = styled.div`
  display: grid;
  gap: .9rem;
  margin-top: 1.2rem;
`;

const SignalCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .8rem;
  padding: .95rem 1rem;
  border-radius: 1rem;
  background: ${p => p.$dark ? 'rgba(11,25,46,.88)' : '#f8fbff'};
  border: 1px solid ${p => p.$dark ? 'rgba(96,165,250,.12)' : '#dbe7f6'};

  strong {
    display: block;
    margin-bottom: .15rem;
  }

  small {
    color: ${p => p.$dark ? '#90a7cb' : '#7086aa'};
  }
  ${hoverLift}
`;

const FinalCTA = styled(Panel)`
  padding: 1.8rem;

  h3 {
    margin: 0 0 .75rem;
    font-size: clamp(1.8rem, 2.6vw, 2.6rem);
    letter-spacing: -.05em;
  }

  p {
    margin: 0 0 1.25rem;
    max-width: 64ch;
    line-height: 1.8;
    color: ${p => p.$dark ? '#9cb4d8' : '#5c7295'};
  }
`;

const features = [
  { icon: Wallet, title: 'Dashboard operacional', text: 'Receitas, despesas, saldo e visão consolidada em uma leitura só.' },
  { icon: BarChart3, title: 'Metas por categoria', text: 'Acompanhamento visual do orçamento com progresso e alertas.' },
  { icon: CreditCard, title: 'Lançamentos rápidos', text: 'Cadastro ágil de entradas e saídas com atualização imediata.' },
  { icon: ShieldCheck, title: 'Fluxo protegido', text: 'Seus dados protegidos com login seguro e acesso autenticado.' },
];

const rotating = [
  { label: 'Saldo consolidado', value: 'R$ 18.420,90', delta: '+12,8% no mês' },
  { label: 'Categorias ativas', value: '07 metas', delta: 'acompanhamento em tempo real' },
  { label: 'Transações processadas', value: '134 lançamentos', delta: 'sincronização operacional' },
];

export default function Index() {
  const { authenticated } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % rotating.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <Page $dark={isDark}>
      <Wrap>
        <Header $dark={isDark}>
          <Brand to="/" $dark={isDark}>
            <div className="logo"><Wallet size={22} color="#fff" /></div>
            <div>
              <strong>Web-Wallet</strong>
              <span>Finanças com leitura de produto</span>
            </div>
          </Brand>

          <Nav $dark={isDark}>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#monitoramento">Monitoramento</a>
            <a href="#seguranca">Segurança</a>
          </Nav>

          <Actions>
            <ThemeButton type="button" onClick={toggleTheme} $dark={isDark} title="Alternar tema">
              {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
            </ThemeButton>
            <HeaderLink to="/login" $ghost $dark={isDark}>Login</HeaderLink>
            <HeaderLink to="/register">Cadastro</HeaderLink>
          </Actions>
        </Header>

        <Hero>
          <HeroCopy>
            <Badge $dark={isDark}>
              <Sparkles size={16} />
              Controle financeiro pessoal com visual de produto profissional
            </Badge>
            <HeroTitle>
              Seu dinheiro organizado com
              <span>com controle de verdade</span>
            </HeroTitle>
            <HeroText $dark={isDark}>
              Veja receitas, despesas e metas em um painel direto sem enrolação, sem planilha.
            </HeroText>

            <CTAGroup>
              <CTA to="/login" $float>
                Entrar na plataforma
                <ArrowRight size={18} />
              </CTA>
              <CTA to="/register" $secondary $dark={isDark}>Criar minha conta</CTA>
            </CTAGroup>

            <SignalRow>
              <Signal $dark={isDark}><BadgeCheck size={16} /> ✅ Login seguro</Signal>
              <Signal $dark={isDark}><Landmark size={16} /> 📅 Resumo mensal automático</Signal>
              <Signal $dark={isDark}><Zap size={16} /> ⚡ Atualizações em tempo real</Signal>
            </SignalRow>
          </HeroCopy>

          <Preview>
            <LiveChip $dark={isDark}>
              <LiveChipLabel $dark={isDark}>{rotating[active].label}</LiveChipLabel>
              <LiveChipValue $dark={isDark}>{rotating[active].value}</LiveChipValue>
              <LiveChipDelta $dark={isDark}>{rotating[active].delta}</LiveChipDelta>
            </LiveChip>

            <Mock $dark={isDark}>
              <MockInner>
                <TopMetrics>
                  <Metric $dark={isDark}><small>Receitas</small><strong>R$ 12.850</strong></Metric>
                  <Metric $dark={isDark}><small>Despesas</small><strong>R$ 7.312</strong></Metric>
                  <Metric $dark={isDark} $highlight><small>Saldo atual</small><strong>R$ 5.538</strong></Metric>
                </TopMetrics>

                <MockGrid>
                  <Widget $dark={isDark}>
                    <WidgetTitle><span>Como estão suas metas</span><BarChart3 size={16} color={isDark ? '#7dd3fc' : '#2563eb'} /></WidgetTitle>
                    <Ring $dark={isDark}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.55rem', fontWeight: 800 }}>68%</div>
                        <small style={{ color: isDark ? '#8fb1db' : '#7184a0', fontWeight: 800 }}>meta consumida</small>
                      </div>
                    </Ring>
                  </Widget>

                  <Widget $dark={isDark}>
                    <WidgetTitle><span>Entradas e saídas recentes</span><Wallet size={16} color={isDark ? '#7dd3fc' : '#2563eb'} /></WidgetTitle>
                    <Flow>
                      <FlowRow $dark={isDark}>
                        <Dot $bg="#22c55e" $ring="rgba(34,197,94,.18)" />
                        <FlowCopy><strong>Salário confirmado</strong><span>entrada conciliada</span></FlowCopy>
                        <strong>+R$ 8.500</strong>
                      </FlowRow>
                      <FlowRow $dark={isDark}>
                        <Dot $bg="#38bdf8" $ring="rgba(56,189,248,.16)" />
                        <FlowCopy><strong>Meta alimentação</strong><span>42% utilizada</span></FlowCopy>
                        <strong>R$ 630</strong>
                      </FlowRow>
                      <FlowRow $dark={isDark}>
                        <Dot $bg="#f59e0b" $ring="rgba(245,158,11,.16)" />
                        <FlowCopy><strong>Lazer em atenção</strong><span>alerta preventivo</span></FlowCopy>
                        <strong>82%</strong>
                      </FlowRow>
                    </Flow>
                  </Widget>
                </MockGrid>
              </MockInner>
            </Mock>
          </Preview>
        </Hero>

        <Section id="funcionalidades">
          <SectionHead $dark={isDark}>
            <span><Sparkles size={14} /> O que você vai usar todo dia</span>
            <h2>Tudo que você precisa ver, na primeira tela que abrir.</h2>
            <p>O Saldo, metas e gastos organizados para você entender de relance  sem precisar clicar em nada.</p>
          </SectionHead>

          <FeatureGrid>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <FeatureCard key={feature.title} $dark={isDark} $active={index === active}>
                  <IconTile $dark={isDark}><Icon size={20} /></IconTile>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </FeatureCard>
              );
            })}
          </FeatureGrid>
        </Section>

        <Section id="monitoramento">
          <SectionHead $dark={isDark}>
            <span><BarChart3 size={14} /> Monitoramento contínuo</span>
            <h2>Metas e orçamento que se atualizam sozinhos conforme você gasta.</h2>
            <p>As telas do projeto priorizam feedback imediato, barras de progresso, cards de resumo e sinais visuais de atenção.</p>
          </SectionHead>

          <DoubleGrid>
            <Panel $dark={isDark}>
              <WidgetTitle><span>Distribuição por categoria</span><Zap size={16} color={isDark ? '#7dd3fc' : '#2563eb'} /></WidgetTitle>
              <Bars>
                <BarRow $dark={isDark} $width={78}>
                  <div className="bar-label"><span>Moradia</span><span>78%</span></div>
                  <div className="bar-track"><i className="bar-fill" /></div>
                </BarRow>
                <BarRow $dark={isDark} $width={61}>
                  <div className="bar-label"><span>Alimentação</span><span>61%</span></div>
                  <div className="bar-track"><i className="bar-fill" /></div>
                </BarRow>
                <BarRow $dark={isDark} $width={44}>
                  <div className="bar-label"><span>Transporte</span><span>44%</span></div>
                  <div className="bar-track"><i className="bar-fill" /></div>
                </BarRow>
                <BarRow $dark={isDark} $width={86}>
                  <div className="bar-label"><span>Lazer</span><span>86%</span></div>
                  <div className="bar-track"><i className="bar-fill" /></div>
                </BarRow>
              </Bars>
            </Panel>

            <Panel $dark={isDark}>
              <WidgetTitle><span>Painel de sinais</span><ShieldCheck size={16} color={isDark ? '#7dd3fc' : '#2563eb'} /></WidgetTitle>
              <SignalBoard>
                <SignalCard $dark={isDark}>
                  <div><strong>Dashboard sincronizado</strong><small>Metas, resumo e recentes atualizados</small></div>
                  <BadgeCheck size={18} color="#22c55e" />
                </SignalCard>
                <SignalCard $dark={isDark}>
                  <div><strong>Alertas de orçamento</strong><small>Barras mostram aproximação do limite</small></div>
                  <Sparkles size={18} color="#38bdf8" />
                </SignalCard>
                <SignalCard $dark={isDark}>
                  <div><strong>Histórico completo</strong><small>odas as transações registradas e filtráveis.</small></div>
                  <ShieldCheck size={18} color="#6366f1" />
                </SignalCard>
              </SignalBoard>
            </Panel>
          </DoubleGrid>
        </Section>

        <Section id="seguranca">
          <SectionHead $dark={isDark}>
            <span><ShieldCheck size={14} /> Como funciona na prática</span>
            <h2>Entre, configure e comece a usar em menos de 2 minutos</h2>
            <p>Escolha o tema que preferir  o sistema lembra sua escolha em todas as telas.</p>
          </SectionHead>

          <FinalCTA $dark={isDark}>
            <h3>Comece a organizar suas finanças agora. É grátis.</h3>
            <p>Crie sua conta em segundos e veja seu painel financeiro pronto para uso..</p>
            <CTAGroup>
              <CTA to={authenticated ? '/dashboard' : '/register'}>
                {authenticated ? 'Entrar no dashboard' : 'Cadastrar usuário'}
                <ArrowRight size={18} />
              </CTA>
              <CTA to="/login" $secondary $dark={isDark}>Criar conta grátis</CTA>
            </CTAGroup>
          </FinalCTA>
        </Section>
      </Wrap>
    </Page>
  );
}
