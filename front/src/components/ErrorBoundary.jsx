// Componente: ErrorBoundary
// Responsabilidade: capturar erros de renderização e exibir tela de fallback
// Depende de: React (Component)

import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(180deg, #000000 0%, #02030a 100%);
  color: #eff6ff;
  text-align: center;
  font-family: 'Outfit', 'Nunito', sans-serif;
`;

const Code = styled.pre`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(96,165,250,0.15);
  color: #93c5fd;
  font-size: 0.8rem;
  max-width: 600px;
  overflow: auto;
  text-align: left;
`;

const Btn = styled.button`
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(147,197,253,0.2);
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(59,130,246,0.35);
  transition: filter 0.2s, transform 0.2s;
  &:hover { filter: brightness(1.07); transform: translateY(-1px); }
`;

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Erro capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Wrap>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#4d8a6e', maxWidth: '420px', lineHeight: 1.6 }}>
            Ocorreu um erro inesperado. Recarregue a página — seus dados estão salvos.
          </p>
          {this.state.error?.message && (
            <Code>{this.state.error.message}</Code>
          )}
          <Btn onClick={() => window.location.reload()}>
            Recarregar página
          </Btn>
        </Wrap>
      );
    }
    return this.props.children;
  }
}
