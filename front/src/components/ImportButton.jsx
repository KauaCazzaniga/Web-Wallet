import React, { useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FileUp, Loader2 } from 'lucide-react';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--dash-border-strong);
  background: var(--dash-surface);
  color: var(--dash-heading);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  box-shadow: var(--dash-soft-shadow);

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.04);
  }

  svg {
    flex: 0 0 auto;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const Spinner = styled(Loader2)`
  animation: ${spin} 0.9s linear infinite;
`;

export default function ImportButton({ loading = false, disabled = false, onSelectFile, onError }) {
  const inputRef = useRef(null);

  const handleOpenPicker = () => {
    if (!loading && !disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onError?.('Selecione um arquivo PDF válido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError?.('O arquivo deve ter no máximo 10MB');
      return;
    }

    onSelectFile?.(file);
  };

  return (
    <>
      <TriggerButton type="button" onClick={handleOpenPicker} disabled={loading || disabled}>
        {loading ? <Spinner size={16} /> : <FileUp size={16} />}
        {loading ? 'Processando...' : 'Importar Extrato'}
      </TriggerButton>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
      />
    </>
  );
}
