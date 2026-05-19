import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import styled, { keyframes, css } from 'styled-components';

import { AuthContext } from '../contexts/AuthContext';

// ── Animações ─────────────────────────────────────────────────────────────────
const gridPulse = keyframes`
  0%, 100% { opacity: 0.04; }
  50%       { opacity: 0.09; }
`;

const orb1Anim = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.06); }
  66%       { transform: translate(-15px, 15px) scale(0.96); }
`;

const orb2Anim = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(-25px, 20px) scale(1.08); }
`;

const slideRight = keyframes`
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const slideLeft = keyframes`
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: "Inter", "Segoe UI", sans-serif;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// ── Painel visual esquerdo ────────────────────────────────────────────────────
const VisualPanel = styled.div`
  background:
    radial-gradient(ellipse at 25% 35%, rgba(6, 182, 212, 0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 70%, rgba(37, 99, 235, 0.22) 0%, transparent 50%),
    linear-gradient(160deg, #020b18 0%, #030e1f 55%, #020b18 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  position: relative;
  overflow: hidden;
  padding: 3rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(14, 165, 233, 1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 1) 1px, transparent 1px);
  background-size: 56px 56px;
  animation: ${gridPulse} 4s ease-in-out infinite;
`;

const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;

  ${p => p.$a && css`
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.22), transparent 70%);
    top: 10%; left: -10%;
    animation: ${orb1Anim} 12s ease-in-out infinite;
  `}

  ${p => p.$b && css`
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.25), transparent 70%);
    bottom: 15%; right: -5%;
    animation: ${orb2Anim} 10s ease-in-out infinite;
  `}
`;

const VisualContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  animation: ${slideRight} 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
`;

const LogoMark = styled.div`
  width: 5rem; height: 5rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(37, 99, 235, 0.25));
  border: 1px solid rgba(96, 165, 250, 0.2);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.75rem;
  box-shadow: 0 0 40px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.06);
`;

const BrandName = styled.h1`
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #eff6ff;
  line-height: 1;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #bfdbfe 0%, #eff6ff 50%, #bae6fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Tagline = styled.p`
  font-size: 1rem;
  color: #5a7ea8;
  font-weight: 400;
  line-height: 1.6;
  max-width: 280px;
  margin: 0 auto 2.5rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
  text-align: left;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8rem;
  color: #4a6888;

  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #2563eb);
    flex-shrink: 0;
  }
`;

// ── Painel de formulário ──────────────────────────────────────────────────────
const FormPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #030c1a;
  padding: 2.5rem 2rem;

  @media (max-width: 400px) {
    padding: 2rem 1.25rem;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${slideLeft} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
`;

const FormHeading = styled.h2`
  font-size: 1.625rem;
  font-weight: 700;
  color: #eff6ff;
  letter-spacing: -0.025em;
  margin-bottom: 0.4rem;
`;

const FormSubheading = styled.p`
  font-size: 0.875rem;
  color: #4a6888;
  margin-bottom: 2.25rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5a7ea8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
`;

const FieldWrap = styled.div`
  position: relative;
`;

const FieldIcon = styled.div`
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #2a4060;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  ${FieldWrap}:focus-within & {
    color: #60a5fa;
  }
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: rgba(9, 20, 42, 0.9);
  border: 1px solid rgba(30, 55, 90, 0.8);
  border-radius: 0.625rem;
  color: #eff6ff;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &::placeholder { color: #2a3a55; }

  &:focus {
    border-color: rgba(96, 165, 250, 0.4);
    background: rgba(9, 22, 46, 0.95);
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.06), 0 2px 8px rgba(2, 12, 27, 0.3);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #2a4060;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.2rem;
  transition: color 0.15s;
  &:hover { color: #60a5fa; }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem 1rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 60%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(37, 99, 235, 0.45);
    filter: brightness(1.08);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorBox = styled.div`
  padding: 0.75rem 1rem;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 0.5rem;
  font-size: 0.82rem;
  color: #f87171;
  line-height: 1.5;
`;

const SuccessBox = styled.div`
  padding: 0.75rem 1rem;
  background: rgba(22, 163, 74, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: 0.5rem;
  font-size: 0.82rem;
  color: #4ade80;
  line-height: 1.5;
`;

const FooterLinks = styled.div`
  margin-top: 1.75rem;
  text-align: center;
  font-size: 0.82rem;
  color: #2a4060;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  a {
    color: #60a5fa;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.15s;
    &:hover { color: #93c5fd; }
  }
`;

// ── Componente ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const successMessage = location.state?.message || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'E-mail ou senha incorretos. Verifique seus dados.');
      }
    } catch {
      setError('Ocorreu um erro no servidor. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      {/* Painel visual esquerdo */}
      <VisualPanel>
        <GridOverlay />
        <Orb $a />
        <Orb $b />
        <VisualContent>
          <LogoMark>
            <Wallet size={32} color="#60a5fa" />
          </LogoMark>
          <BrandName>Waltrix</BrandName>
          <Tagline>
            Inteligência financeira para quem leva o dinheiro a sério.
          </Tagline>
          <FeatureList>
            <Feature>Controle de receitas e despesas por categoria</Feature>
            <Feature>Importação automática de extratos PDF com IA</Feature>
            <Feature>Relatórios e metas mensais em tempo real</Feature>
            <Feature>Acompanhamento de investimentos e cofrinhos</Feature>
          </FeatureList>
        </VisualContent>
      </VisualPanel>

      {/* Painel de formulário */}
      <FormPanel>
        <FormCard>
          <FormHeading>Bem-vindo de volta</FormHeading>
          <FormSubheading>
            Entre na sua conta para acessar o painel financeiro.
          </FormSubheading>

          <Form onSubmit={handleLogin} noValidate>
            <div>
              <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
              <FieldWrap>
                <FieldIcon><Mail size={16} /></FieldIcon>
                <FieldInput
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </FieldWrap>
            </div>

            <div>
              <FieldLabel htmlFor="login-password">Senha</FieldLabel>
              <FieldWrap>
                <FieldIcon><Lock size={16} /></FieldIcon>
                <FieldInput
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </PasswordToggle>
              </FieldWrap>
            </div>

            {successMessage && <SuccessBox>{successMessage}</SuccessBox>}
            {error && <ErrorBox>{error}</ErrorBox>}

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Autenticando...</>
                : 'Entrar no sistema'
              }
            </SubmitButton>
          </Form>

          <FooterLinks>
            <Link to="/forgot-password">Esqueceu sua senha?</Link>
            <span>
              Não tem uma conta?{' '}
              <Link to="/register">Cadastre-se gratuitamente</Link>
            </span>
          </FooterLinks>
        </FormCard>
      </FormPanel>
    </Page>
  );
}
