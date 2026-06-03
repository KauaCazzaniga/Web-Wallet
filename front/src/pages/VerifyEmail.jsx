// Componente: VerifyEmail
// Responsabilidade: verificação de e-mail por código em duas etapas
//   (1) confirmar/digitar e-mail → recebe código; (2) digitar o código de 6 dígitos
//   Mesmo padrão da tela de redefinição de senha (ForgotPassword).
// Depende de: AuthContext (verifyEmail, resendVerification), ThemeContext, AuthForm styled-components
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Wallet, Mail, KeyRound, Loader2, Moon, SunMedium } from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Container, AuthBox, IconHeader, Title, Subtitle,
  Form, InputGroup, IconWrapper, Input, Button,
  ErrorMessage, Footer, ThemeButton, BackLink,
} from '@/components/ui/AuthForm/index.js';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  // Quando chega vindo do cadastro, o e-mail vem no state e o código já foi enviado.
  const emailFromState = location.state?.email || '';

  const [step, setStep] = useState(emailFromState ? 'code' : 'email');
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(
    emailFromState ? 'Enviamos um código de 6 dígitos para o seu e-mail. Verifique sua caixa de entrada.' : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Etapa 1 — solicita (ou reenvia) o código de verificação
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await resendVerification(email);
      setStep('code');
      setInfo('Se a conta existir e ainda não estiver verificada, enviamos um código de 6 dígitos.');
    } catch {
      setError('Ocorreu um erro no servidor. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2 — valida o código e ativa a conta
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError('O código deve ter 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(email, code.trim());
      navigate('/login', { replace: true, state: { message: 'E-mail verificado com sucesso! Faça login.' } });
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(msg || 'Código inválido ou expirado. Solicite um novo código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código (sem trocar de etapa)
  const handleResend = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await resendVerification(email);
      setInfo('Reenviamos o código para o seu e-mail.');
    } catch {
      setError('Não foi possível reenviar o código. Tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container $dark={isDark}>
      <BackLink to="/login" $dark={isDark}>
        <ArrowLeft size={16} />
        Login
      </BackLink>
      <ThemeButton type="button" onClick={toggleTheme} $dark={isDark}>
        {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
      </ThemeButton>
      <AuthBox $dark={isDark}>
        <IconHeader $dark={isDark}>
          <Wallet size={40} color="#a855f7" />
        </IconHeader>
        <Title>Waltrix</Title>
        <Subtitle $dark={isDark}>
          {step === 'email' ? 'Verificação de e-mail' : 'Digite o código enviado'}
        </Subtitle>

        {step === 'email' ? (
          <Form onSubmit={handleRequestCode}>
            <InputGroup>
              <IconWrapper><Mail size={20} /></IconWrapper>
              <Input
                $dark={isDark}
                type="email"
                placeholder="Seu e-mail cadastrado"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </InputGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={20} className="animate-spin" />Enviando...</>
                : 'Enviar código'}
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleVerify}>
            {info && (
              <Footer $dark={isDark} style={{ marginTop: 0, textAlign: 'center' }}>
                {info}
              </Footer>
            )}
            <InputGroup>
              <IconWrapper><KeyRound size={20} /></IconWrapper>
              <Input
                $dark={isDark}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Código de 6 dígitos"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                style={{ letterSpacing: '0.4em', textAlign: 'center' }}
                required
              />
            </InputGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={20} className="animate-spin" />Verificando...</>
                : 'Verificar e-mail'}
            </Button>
            <Footer $dark={isDark} style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              Não recebeu?
              <a href="#" onClick={(e) => { e.preventDefault(); if (!isLoading) handleResend(); }}>
                Reenviar código
              </a>
            </Footer>
          </Form>
        )}

        <Footer $dark={isDark}>
          Já verificou?
          <a href="/login">Voltar ao login</a>
        </Footer>
      </AuthBox>
    </Container>
  );
}
