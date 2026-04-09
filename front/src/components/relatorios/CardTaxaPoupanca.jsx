// Componente: CardTaxaPoupanca
// Responsabilidade: exibe % da receita que sobrou a cada mês, com evolução e alerta para meses abaixo de 10%
// Depende de: mesesProcessados (processarMeses), relatorioCalc

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

const ALERTA_ABAIXO = 10;

const corDaTaxa = (taxa) => {
  if (taxa === null) return 'var(--rel-muted)';
  if (taxa < 0)       return '#E24B4A';
  if (taxa < ALERTA_ABAIXO) return '#EF9F27';
  if (taxa < 30)      return '#378ADD';
  return '#1D9E75';
};

const Card = styled.section`
  padding: 1.4rem 1.5rem;
  border-radius: 1.2rem;
  border: 1px solid var(--rel-border);
  background: var(--rel-shell);
  box-shadow: var(--rel-shadow);
`;

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;

  h2 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 700;
    color: var(--rel-heading);
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--rel-muted);
  }
`;

const MediaBadge = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;

  span {
    font-size: 0.72rem;
    color: var(--rel-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  strong {
    font-size: 1.5rem;
    letter-spacing: -0.04em;
    color: ${(props) => props.$cor};
  }
`;

const Lista = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: 80px 1fr 52px 20px;
  align-items: center;
  gap: 0.75rem;
`;

const MesLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--rel-muted);
  white-space: nowrap;
`;

const BarTrack = styled.div`
  height: 8px;
  border-radius: 99px;
  background: var(--rel-surface-muted);
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: 99px;
  width: ${(props) => props.$pct}%;
  background: ${(props) => props.$cor};
  transition: width 0.4s ease;
`;

const TaxaValor = styled.span`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${(props) => props.$cor};
  text-align: right;
  white-space: nowrap;
`;

const Icone = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$cor || 'transparent'};
`;

const AlertaBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.25rem;
  padding: 0.7rem 0.95rem;
  border-radius: 0.7rem;
  background: rgba(239,159,39,0.12);
  border: 1px solid rgba(239,159,39,0.3);
  font-size: 0.8rem;
  color: #EF9F27;
  font-weight: 600;
`;

const Rodape = styled.p`
  margin: 1rem 0 0;
  font-size: 0.75rem;
  color: var(--rel-muted);
  line-height: 1.5;
`;

/**
 * @param {{ data: Array<{mes: string, label: string, receita: number, despesa: number}> }} props
 */
export default function CardTaxaPoupanca({ data = [] }) {
  const mesesComTaxa = useMemo(() =>
    data.map((item) => {
      const taxa = item.receita > 0
        ? ((item.receita - item.despesa) / item.receita) * 100
        : null;
      return { ...item, taxa };
    }),
    [data],
  );

  const mediaGeral = useMemo(() => {
    const validos = mesesComTaxa.filter((m) => m.taxa !== null);
    if (!validos.length) return null;
    return validos.reduce((acc, m) => acc + m.taxa, 0) / validos.length;
  }, [mesesComTaxa]);

  const mesesEmAlerta = useMemo(
    () => mesesComTaxa.filter((m) => m.taxa !== null && m.taxa < ALERTA_ABAIXO),
    [mesesComTaxa],
  );

  const tendencia = useMemo(() => {
    const validos = mesesComTaxa.filter((m) => m.taxa !== null);
    if (validos.length < 2) return null;
    const ultimo = validos[validos.length - 1].taxa;
    const penultimo = validos[validos.length - 2].taxa;
    return ultimo - penultimo;
  }, [mesesComTaxa]);

  if (!data.length) return null;

  return (
    <Card>
      <Head>
        <div>
          <h2>Taxa de Poupança Mensal</h2>
          <p>% da receita que sobrou após as despesas de cada mês</p>
        </div>

        {mediaGeral !== null && (
          <MediaBadge $cor={corDaTaxa(mediaGeral)}>
            <span>Média</span>
            <strong>
              {mediaGeral.toFixed(1)}%
            </strong>
            {tendencia !== null && (
              <Icone $cor={tendencia >= 0 ? '#1D9E75' : '#E24B4A'}>
                {tendencia >= 0
                  ? <TrendingUp size={14} />
                  : <TrendingDown size={14} />}
              </Icone>
            )}
          </MediaBadge>
        )}
      </Head>

      <Lista>
        {mesesComTaxa.map((item) => {
          const taxa = item.taxa;
          const cor = corDaTaxa(taxa);
          const pct = taxa === null ? 0 : Math.min(Math.max(taxa, 0), 100);
          const emAlerta = taxa !== null && taxa < ALERTA_ABAIXO;

          return (
            <Item key={item.mes}>
              <MesLabel>{item.label}</MesLabel>

              <BarTrack>
                <BarFill $pct={pct} $cor={cor} />
              </BarTrack>

              <TaxaValor $cor={cor}>
                {taxa === null ? '—' : `${taxa.toFixed(1)}%`}
              </TaxaValor>

              <Icone $cor={emAlerta ? '#EF9F27' : undefined}>
                {emAlerta && <AlertTriangle size={14} />}
              </Icone>
            </Item>
          );
        })}
      </Lista>

      {mesesEmAlerta.length > 0 && (
        <AlertaBanner>
          <AlertTriangle size={15} />
          {mesesEmAlerta.length === 1
            ? `${mesesEmAlerta[0].label} ficou abaixo de ${ALERTA_ABAIXO}% de poupança.`
            : `${mesesEmAlerta.length} meses ficaram abaixo de ${ALERTA_ABAIXO}% de poupança.`}
        </AlertaBanner>
      )}

      <Rodape>
        Meta saudável: poupar ao menos {ALERTA_ABAIXO}% da receita por mês.
        Valores negativos indicam despesas maiores que a receita.
      </Rodape>
    </Card>
  );
}
