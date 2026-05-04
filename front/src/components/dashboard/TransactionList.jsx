// Componente: TransactionList
// Responsabilidade: Tabela paginada de transações com busca por descrição e filtro por categoria
// Depende de: dashboardStyles (Panel, PanelHeader), dashboardUtils (fmt, parseDate, getTransactionRawDate, resolveCatDisplay, ITEMS_POR_PAGINA), lucide-react

import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Trash2, Search, X } from 'lucide-react';
import { Panel, PanelHeader } from './dashboardStyles';
import { fmt, parseDate, getTransactionRawDate, resolveCatDisplay, ITEMS_POR_PAGINA } from './dashboardUtils';
import { GASTOS_FIXOS } from '../../constants/gastosFixos';

// ── Skeleton ─────────────────────────────────────────────────────────────────
const shimmer = `
  background: linear-gradient(
    90deg,
    var(--dash-surface-muted) 25%,
    var(--dash-border) 50%,
    var(--dash-surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite;
  @keyframes skeletonShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
const SkeletonCell = styled.td`padding: 0.875rem 1rem !important;`;
const SkeletonBar = styled.div`
  height: ${p => p.$h || '0.85rem'}; border-radius: 0.35rem;
  width: ${p => p.$w || '80%'};
  ${shimmer}
`;

// ── Styled ────────────────────────────────────────────────────────────────────
const TxPanel = styled(Panel)`overflow: hidden; padding: 0;`;
const TableScroll = styled.div`overflow-x: auto; -webkit-overflow-scrolling: touch;`;
const TxHeader = styled(PanelHeader)`
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--dash-border); margin-bottom: 0;
`;
const TextLink = styled.button`
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.82rem; color: #ffffff; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
  border: none; cursor: pointer; padding: 0.7rem 0.95rem; border-radius: 999px;
  background: linear-gradient(135deg, #06b6d4 0%, var(--dash-primary) 52%, #4f46e5 100%);
  box-shadow: 0 14px 28px rgba(37,99,235,0.24);
  transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
  &:hover { transform: translateY(-4px) scale(1.03); filter: brightness(1.06); }
`;
const Table = styled.table`
  width: 100%; text-align: left; border-collapse: collapse;
  thead {
    background: var(--dash-table-head);
    th { padding: 0.75rem 1rem; font-size: 0.7rem; font-weight: 600; color: var(--dash-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  }
  tbody {
    tr { border-bottom: 1px solid var(--dash-border); transition: background 0.1s;
      &:last-child { border: none; }
      &:hover { background: var(--dash-surface-muted); }
    }
    td { padding: 0.875rem 1rem; font-size: 0.875rem; color: var(--dash-heading); }
  }
`;
const TdMuted   = styled.td`color: var(--dash-muted) !important; font-size: 0.8rem !important;`;
const DelBtn    = styled.button`
  padding: 0.35rem; border: none; background: none; cursor: pointer;
  border-radius: 0.375rem; color: var(--dash-muted); transition: all 0.15s;
  &:hover { color: #ef4444; background: var(--dash-danger-soft); }
  svg { transition: transform 0.2s ease, filter 0.2s ease; }
  &:hover svg { transform: translateY(-2px) scale(1.08); filter: brightness(1.15); }
`;
const EmptyRow  = styled.td`text-align: center; padding: 3rem 1rem !important; color: var(--dash-muted); font-size: 0.875rem;`;
const EmptyBtn  = styled.button`
  margin-top: 0.75rem; color: var(--dash-primary); background: none; border: none;
  cursor: pointer; font-weight: 500; font-size: 0.875rem; display: block; margin-inline: auto;
  &:hover { text-decoration: underline; }
`;
const PaginacaoBar  = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem; border-top: 1px solid var(--dash-border);
  background: var(--dash-table-head); gap: 0.5rem; flex-wrap: wrap;
`;
const PaginacaoInfo = styled.span`font-size: 0.78rem; color: var(--dash-muted);`;
const PaginacaoBtns = styled.div`display: flex; align-items: center; gap: 0.35rem;`;
const PagBtn = styled.button`
  padding: 0.3rem 0.65rem; border: 1px solid var(--dash-border); border-radius: 0.45rem;
  background: ${p => p.$active ? 'var(--dash-primary)' : 'var(--dash-surface)'};
  color: ${p => p.$active ? '#fff' : 'var(--dash-heading)'};
  font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  &:disabled { opacity: 0.35; cursor: default; }
  &:not(:disabled):hover { border-color: var(--dash-primary); color: ${p => p.$active ? '#fff' : 'var(--dash-primary)'}; }
`;

// ── Filtros ───────────────────────────────────────────────────────────────────
const FilterBar = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1.5rem 0.75rem;
  border-bottom: 1px solid var(--dash-border);
  flex-wrap: wrap;
`;
const SearchWrapper = styled.div`
  position: relative; flex: 1; min-width: 180px;
`;
const SearchIcon = styled(Search)`
  position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%);
  color: var(--dash-muted); pointer-events: none;
`;
const ClearBtn = styled.button`
  position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--dash-muted);
  display: flex; align-items: center; padding: 0.1rem;
  &:hover { color: var(--dash-heading); }
`;
const SearchInput = styled.input`
  width: 100%; padding: 0.5rem 2rem 0.5rem 2.1rem;
  background: var(--dash-input-bg); border: 1px solid var(--dash-border);
  border-radius: 0.5rem; color: var(--dash-heading); font-size: 0.85rem;
  outline: none; transition: border-color 0.15s;
  &::placeholder { color: var(--dash-muted); }
  &:focus { border-color: var(--dash-primary); }
`;
const CatSelect = styled.select`
  padding: 0.5rem 0.75rem; background: var(--dash-input-bg);
  border: 1px solid var(--dash-border); border-radius: 0.5rem;
  color: var(--dash-heading); font-size: 0.85rem; cursor: pointer; outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: var(--dash-primary); }
`;

// Todas as categorias disponíveis no sistema (regulares + gastos fixos)
const ALL_CAT_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'Alimentação',  label: '🍔 Alimentação' },
  { value: 'Transporte',   label: '🚗 Transporte' },
  { value: 'Lazer',        label: '🎉 Lazer' },
  { value: 'Saúde',        label: '💊 Saúde' },
  { value: 'Salário',      label: '💰 Salário' },
  { value: 'Investimentos',label: '📈 Investimentos' },
  { value: 'Outros',       label: '📦 Outros' },
  ...GASTOS_FIXOS.map(gf => ({ value: `gastos_fixos.${gf.key}`, label: `${gf.icon} ${gf.label}` })),
];

// ── Componente ────────────────────────────────────────────────────────────────

/**
 * @param {Array}    transacoesMes  - Todas as transações do mês (ordenadas)
 * @param {boolean}  loadingMes     - Carregando dados do mês
 * @param {string}   labelMes       - Label formatado do mês (ex: "Abril 2025")
 * @param {string[]} highlightedIds - IDs das transações recém-importadas
 * @param {Function} onDelete       - Callback ao clicar em excluir (recebe a transação)
 * @param {Function} onDeleteAll    - Callback ao clicar em "Excluir tudo"
 * @param {Function} onAddFirst     - Abre o modal de nova transação (estado vazio)
 */
export default function TransactionList({
  transacoesMes,
  loadingMes,
  labelMes,
  highlightedIds,
  onDelete,
  onDeleteAll,
  onAddFirst,
}) {
  const [searchRaw, setSearchRaw]     = useState('');
  const [searchText, setSearchText]   = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const debounceRef = useRef(null);

  // Debounce da busca (300 ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchText(searchRaw.trim()), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchRaw]);

  // paginaSegura clipa automaticamente quando filtros reduzem o total de páginas
  const filteredTransacoes = useMemo(() => {
    let list = transacoesMes;
    if (selectedCat) list = list.filter(tx => tx.categoria === selectedCat);
    if (searchText) {
      const lower = searchText.toLowerCase();
      list = list.filter(tx => String(tx.descricao || '').toLowerCase().includes(lower));
    }
    return list;
  }, [transacoesMes, searchText, selectedCat]);

  const totalPaginas = Math.max(1, Math.ceil(filteredTransacoes.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const transacoesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
    return filteredTransacoes.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [filteredTransacoes, paginaSegura]);

  const hasFilter = searchRaw || selectedCat;

  return (
    <TxPanel>
      <TxHeader><h3>Transações — {labelMes}</h3></TxHeader>

      <FilterBar>
        <SearchWrapper>
          <SearchIcon size={15} />
          <SearchInput
            type="text"
            placeholder="Buscar por descrição..."
            value={searchRaw}
            onChange={e => setSearchRaw(e.target.value)}
            aria-label="Buscar transação por descrição"
          />
          {searchRaw && (
            <ClearBtn type="button" onClick={() => setSearchRaw('')} aria-label="Limpar busca">
              <X size={14} />
            </ClearBtn>
          )}
        </SearchWrapper>

        <CatSelect
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          {ALL_CAT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </CatSelect>
      </FilterBar>

      {transacoesMes.length > 0 && !hasFilter && (
        <div style={{ padding: '0 1.5rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <TextLink type="button" onClick={onDeleteAll}>
            <Trash2 size={14} /> Excluir tudo
          </TextLink>
        </div>
      )}

      <TableScroll>
      <Table>
        <thead>
          <tr>
            <th>Descrição</th><th>Categoria</th>
            <th>Data</th><th>Valor</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {loadingMes ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                <SkeletonCell><SkeletonBar $w={`${55 + (i * 7) % 30}%`} /></SkeletonCell>
                <SkeletonCell><SkeletonBar $w="50%" /></SkeletonCell>
                <SkeletonCell><SkeletonBar $w="45%" /></SkeletonCell>
                <SkeletonCell><SkeletonBar $w="35%" /></SkeletonCell>
                <SkeletonCell><SkeletonBar $w="1.5rem" $h="1.5rem" /></SkeletonCell>
              </tr>
            ))
          ) : filteredTransacoes.length === 0 ? (
            <tr>
              <EmptyRow colSpan={5}>
                {hasFilter
                  ? 'Nenhuma transação encontrada para este filtro.'
                  : `Nenhuma transação em ${labelMes}.`}
                {!hasFilter && (
                  <EmptyBtn onClick={onAddFirst}>
                    + Adicionar primeira transação
                  </EmptyBtn>
                )}
              </EmptyRow>
            </tr>
          ) : transacoesPaginadas.map(tx => {
            const raw  = getTransactionRawDate(tx);
            const dt   = parseDate(raw);
            const dStr = dt ? dt.toLocaleDateString('pt-BR') : '—';
            const isIn = tx.tipo === 'receita';
            const highlighted = highlightedIds.includes(tx._id);
            const { label: catLabel, icon: catIcon } = resolveCatDisplay(tx.categoria);
            return (
              <tr
                key={tx._id}
                style={highlighted ? {
                  background: 'rgba(59,130,246,0.10)',
                  boxShadow: 'inset 0 0 0 1px var(--dash-primary)',
                } : undefined}
              >
                <td style={{ fontWeight: 500 }}>
                  {tx.descricao}
                  {tx.importadoViaPdf && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--dash-primary)', marginTop: '0.2rem', fontWeight: 700 }}>
                      Importada via PDF
                    </div>
                  )}
                </td>
                <TdMuted>{catIcon} {catLabel}</TdMuted>
                <TdMuted>{dStr}</TdMuted>
                <td style={{ color: isIn ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  {isIn ? '+' : '-'} R$ {fmt(tx.valor)}
                </td>
                <td>
                  <DelBtn onClick={() => onDelete(tx)} title="Excluir">
                    <Trash2 size={14} />
                  </DelBtn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      </TableScroll>

      {filteredTransacoes.length > ITEMS_POR_PAGINA && (
        <PaginacaoBar>
          <PaginacaoInfo>
            {(paginaSegura - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(paginaSegura * ITEMS_POR_PAGINA, filteredTransacoes.length)} de {filteredTransacoes.length} transações
            {hasFilter && transacoesMes.length !== filteredTransacoes.length && (
              <> (filtradas de {transacoesMes.length})</>
            )}
          </PaginacaoInfo>
          <PaginacaoBtns>
            <PagBtn
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
            >
              ‹ Anterior
            </PagBtn>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaSegura) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== n - 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '…'
                  ? <PagBtn key={`ellipsis-${idx}`} disabled>…</PagBtn>
                  : <PagBtn key={item} $active={item === paginaSegura} onClick={() => setPaginaAtual(item)}>{item}</PagBtn>
              )
            }
            <PagBtn
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura === totalPaginas}
            >
              Próxima ›
            </PagBtn>
          </PaginacaoBtns>
        </PaginacaoBar>
      )}
    </TxPanel>
  );
}
