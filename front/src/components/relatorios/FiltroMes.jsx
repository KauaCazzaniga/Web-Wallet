import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--rel-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input {
    width: 100%;
    padding: 0.8rem 0.9rem;
    border-radius: 0.9rem;
    border: 1px solid var(--rel-border-strong);
    background: var(--rel-input-bg);
    color: var(--rel-heading);
    outline: none;
    font-size: 0.92rem;

    &:focus {
      border-color: var(--rel-primary);
      box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.14);
    }
  }
`;

export default function FiltroMes({ inicio, fim, onChangeInicio, onChangeFim }) {
  return (
    <Wrap>
      <Field>
        <label>De:</label>
        <input type="month" value={inicio} onChange={(event) => onChangeInicio(event.target.value)} />
      </Field>
      <Field>
        <label>Até:</label>
        <input type="month" value={fim} onChange={(event) => onChangeFim(event.target.value)} />
      </Field>
    </Wrap>
  );
}
