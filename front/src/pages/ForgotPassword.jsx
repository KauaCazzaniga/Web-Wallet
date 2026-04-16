// Componente: ForgotPassword
// Responsabilidade: formulário de solicitação de link de redefinição de senha
// Depende de: AuthContext (forgotPassword), ThemeContext, AuthForm styled-components
import React, { useState, useContext } from 'react';
import { ArrowLeft, Wallet, Mail, Loader2, Moon, SunMedium } from 'lucide-react';

import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Container, AuthBox, IconHeader, Title, Subtitle,
  Form, InputGroup, IconWrapper, Input, Button,
  ErrorMessage, Footer, ThemeButton, BackLink,
} from '../components/ui/AuthForm/index.js';

export default function ForgotPassword() {
  const { forgotPassword } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch {
      setError('Ocorreu um erro no servidor. Tente mais tarde.');
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
        <Title>Web-Wallet</Title>
        <Subtitle $dark={isDark}>Redefinição de senha</Subtitle>

        {success ? (
          <Footer $dark={isDark} style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            Se o e-mail estiver cadastrado, você receberá um link em breve.
            Verifique sua caixa de entrada.
          </Footer>
        ) : (
          <Form onSubmit={handleSubmit}>
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
                : 'Enviar link de redefinição'}
            </Button>
          </Form>
        )}

        <Footer $dark={isDark}>
          Lembrou a senha?
          <a href="/login">Voltar ao login</a>
        </Footer>
      </AuthBox>
    </Container>
  );
}
