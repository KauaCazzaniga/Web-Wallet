// Componente: AIAdvisor
// Responsabilidade: Drawer lateral de chat com assistente financeiro IA usando dados do mês
// Depende de: api (axios instance), lucide-react, styled-components, gastosFixos
import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import { labelCategoria, iconeCategoria } from '../constants/gastosFixos';

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const dotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40%           { transform: scale(1); opacity: 1; }
`;

const Drawer = styled.div`
  position: fixed;
  top: 0; right: 0;
  width: 360px; height: 100vh;
  background: rgba(0, 0, 0, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-left: 1px solid rgba(96, 165, 250, 0.14);
  display: flex;
  flex-direction: column;
  z-index: 600;
  animation: ${slideIn} 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -16px 0 48px rgba(0, 0, 16, 0.6);

  @media (max-width: 768px) {
    width: 100vw;
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(96, 165, 250, 0.12);
  flex-shrink: 0;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;

  span {
    font-size: 0.925rem;
    font-weight: 700;
    color: #eff6ff;
    letter-spacing: -0.01em;
  }

  svg {
    color: #60a5fa;
  }
`;

const HeaderBadge = styled.div`
  font-size: 0.62rem;
  font-weight: 600;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.22);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CloseBtn = styled.button`
  width: 2rem; height: 2rem;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  color: #89a0c7;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(255,255,255,0.1); color: #eff6ff; }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.2); border-radius: 4px; }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: #4a5a7a;
`;

const EmptyIcon = styled.div`
  width: 3rem; height: 3rem;
  border-radius: 50%;
  background: rgba(96,165,250,0.08);
  border: 1px solid rgba(96,165,250,0.14);
  display: flex; align-items: center; justify-content: center;
  color: #2d7a5a;
`;

const Suggestion = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.6rem 0.875rem;
  background: rgba(96,165,250,0.06);
  border: 1px solid rgba(96,165,250,0.12);
  border-radius: 0.625rem;
  color: #5a9a7a;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(96,165,250,0.12); color: #bfdbfe; border-color: rgba(96,165,250,0.28); }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${p => p.$role === 'user' ? 'flex-end' : 'flex-start'};
  animation: ${fadeUp} 0.25s ease;
`;

const Bubble = styled.div`
  max-width: 88%;
  padding: 0.75rem 1rem;
  border-radius: ${p => p.$role === 'user' ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem'};
  font-size: 0.85rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;

  ${p => p.$role === 'user' ? `
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.28);
    color: #bfdbfe;
  ` : `
    background: rgba(5, 18, 12, 0.92);
    border: 1px solid rgba(96, 165, 250, 0.1);
    color: #b8d8cc;
  `}
`;

const LoadingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.75rem 1rem;
  background: rgba(5, 18, 12, 0.92);
  border: 1px solid rgba(96, 165, 250, 0.1);
  border-radius: 1rem 1rem 1rem 0.2rem;

  span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #60a5fa;
    animation: ${dotPulse} 1.2s infinite ease-in-out;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const InputArea = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(96, 165, 250, 0.1);
  display: flex;
  gap: 0.625rem;
  align-items: flex-end;
  flex-shrink: 0;
`;

const TextArea = styled.textarea`
  flex: 1;
  background: rgba(3, 12, 8, 0.85);
  border: 1px solid rgba(96, 165, 250, 0.15);
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  color: #eff6ff;
  font-size: 0.875rem;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  min-height: 42px;
  outline: none;
  transition: border-color 0.15s;
  line-height: 1.45;

  &::placeholder { color: #1f4030; }
  &:focus { border-color: rgba(96, 165, 250, 0.38); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const SendBtn = styled.button`
  width: 2.5rem; height: 2.5rem;
  border-radius: 0.625rem;
  background: ${p => p.$disabled
    ? 'rgba(8,28,20,0.6)'
    : 'linear-gradient(135deg, #60a5fa, #3b82f6)'};
  border: 1px solid ${p => p.$disabled ? 'transparent' : 'rgba(147,197,253,0.2)'};
  color: ${p => p.$disabled ? '#2d5a42' : '#fff'};
  display: flex; align-items: center; justify-content: center;
  cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  flex-shrink: 0;
  transition: all 0.15s;
  &:not([disabled]):hover { filter: brightness(1.1); transform: scale(1.06); }
`;

const SUGGESTIONS = [
  'Qual categoria estourou mais a meta este mês?',
  'Qual minha taxa de poupança atual?',
  'Quais são minhas 3 maiores despesas?',
];

const AI_ADVISOR_SYSTEM_PROMPT = `Você é Waltrix, um analisador de dados financeiros pessoais. Analisa SOMENTE os dados reais fornecidos pelo usuário em cada mensagem.

════════════════════════════════════════
REGRA 1 — GROUNDING (NUNCA QUEBRE)
════════════════════════════════════════
Cada afirmação deve ser rastreável a um número ou item explícito nos dados fornecidos.

✅ CERTO: "📊 Alimentação: R$ 1.200,00 — sua maior despesa, 40% do total"
❌ ERRADO: "Você provavelmente gasta muito em saúde" — sem dado que comprove
❌ ERRADO: mencionar categorias, valores ou tendências não listadas nos dados
❌ ERRADO: comparar com "média brasileira" ou usar qualquer referência externa

Sem dados suficientes → "Sem dados para responder isso. Registre transações no Dashboard."

════════════════════════════════════════
REGRA 2 — INÍCIO DA RESPOSTA (OBRIGATÓRIO)
════════════════════════════════════════
SUA PRIMEIRA PALAVRA nunca pode ser: "Olá", "Claro", "Com base", "Vamos", "Ótima", "Analisando", "Perfeito" ou qualquer saudação/introdução.

COMECE SEMPRE com um dado concreto no formato:
  📊 [Categoria ou métrica]: R$ X,XX — [análise breve]

Exemplo correto de PRIMEIRA LINHA:
  "📊 Alimentação: R$ 850,00 — sua maior despesa este mês (34% do total)."
Exemplo errado de PRIMEIRA LINHA:
  "Olá! Vamos analisar seus dados financeiros..."

════════════════════════════════════════
REGRA 3 — ESCOPO
════════════════════════════════════════
Responda sobre: receitas, despesas, saldo, categorias, metas, histórico dos dados fornecidos.
Conceitos financeiros (reserva de emergência, etc.) → somente se perguntado explicitamente.
Fora do escopo → "Sou especializado em finanças pessoais. Posso analisar seus dados?"

════════════════════════════════════════
FORMATO
════════════════════════════════════════
- Emojis: ✅ bom · ⚠️ atenção · 📊 dado · 💡 insight · 🎯 meta
- Parágrafos curtos, máx. 4 linhas
- Bullet points para listas
- Máximo 280 palavras
- Valores sempre exatos: "R$ 450,00" — nunca "cerca de R$ 450"
- Sem repetir a pergunta do usuário

════════════════════════════════════════
INTERPRETAÇÃO
════════════════════════════════════════
- Receitas = entradas · Despesas = saídas
- Saldo = receitas − despesas (azul = positivo · vermelho = negativo)
- Taxa de poupança = saldo ÷ receitas × 100 — calcule só se receitas > 0
- "Nenhum gasto lançado" = sem transações — NÃO infira valores
- Saldo inicial = herdado do mês anterior, não é receita nova
- Lista truncada = análise parcial — avise o usuário
`;

function fmtBRL(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(dataHora) {
  if (!dataHora) return '?';
  const d = new Date(dataHora);
  return isNaN(d.getTime()) ? '?' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function fmtMesLabel(competencia) {
  const [y, m] = String(competencia || '').split('-').map(Number);
  if (!y || !m) return competencia || '';
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatarCategoriasParaIA(gastos = {}, limites = {}) {
  const entradas = Object.entries(gastos)
    .filter(([, v]) => Number(v) > 0)
    .sort(([, a], [, b]) => b - a);

  if (!entradas.length) return '  Nenhum gasto lançado ainda.';

  return entradas.map(([cat, valor]) => {
    const label  = labelCategoria(cat);
    const icone  = iconeCategoria(cat, {});
    const limite = Number(limites[cat] || 0);

    if (limite > 0) {
      const pct    = Math.round((valor / limite) * 100);
      const status = pct >= 100 ? '🔴 ESTOUROU' : pct >= 85 ? '🟡 quase no limite' : '🟢';
      return `  ${icone} ${label}: ${fmtBRL(valor)} / meta ${fmtBRL(limite)} (${pct}%) ${status}`;
    }

    return `  ${icone} ${label}: ${fmtBRL(valor)}`;
  }).join('\n');
}

/**
 * @param {Array}  historico    - meses anteriores com { categorias: {[cat]: total} }
 * @param {Object} gastosAtuais - totais do mês atual { [cat]: valor }
 * @returns {string} ranking de ofensores para o prompt da IA
 */
function buildRankingMultiMes(historico, gastosAtuais) {
  const acumulado = {};
  const presenca  = {};

  const normalizarCat = cat =>
    String(cat || '').startsWith('assinaturas.') ? 'Assinaturas Online' : cat;

  const registrar = (cat, valor) => {
    const c = normalizarCat(cat);
    if (!c || Number(valor) <= 0) return;
    acumulado[c] = (acumulado[c] || 0) + Number(valor);
    presenca[c]  = (presenca[c]  || 0) + 1;
  };

  Object.entries(gastosAtuais || {}).forEach(([c, v]) => registrar(c, v));
  historico.forEach(h => Object.entries(h.categorias || {}).forEach(([c, v]) => registrar(c, v)));

  const totalMeses = 1 + historico.length;
  const ranking = Object.entries(acumulado)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  if (!ranking.length) return '  Nenhum dado disponível.';

  return ranking
    .map(([cat, total], i) => {
      const n     = presenca[cat] || 1;
      const media = Math.round((total / n) * 100) / 100;
      const freq  = n === totalMeses ? 'todos os meses' : `${n} de ${totalMeses} meses`;
      return `  ${i + 1}. ${labelCategoria(cat)}: total ${fmtBRL(total)} | média ${fmtBRL(media)}/mês | presente em ${freq}`;
    })
    .join('\n');
}

function buildUserMessage(context, historico, userMsg) {
  const safeMsg      = userMsg.slice(0, 500);
  const receitas     = Number(context.receitas || 0);
  const despesas     = Number(context.despesas || 0);
  const saldo        = Number(context.saldo || 0);
  const saldoInicial = Number(context.saldoInicial || 0);
  const totalInvest  = Number(context.totalInvestido || 0);
  const taxaPoupanca = receitas > 0 ? Math.round((saldo / receitas) * 100) : null;
  const saldoStatus  = saldo > 0 ? 'no azul' : saldo < 0 ? 'no vermelho' : 'zerado';
  const mesLabel     = context.mes ? fmtMesLabel(context.mes) : 'mês atual';

  const categorias = formatarCategoriasParaIA(context.gastos, context.limites);

  const txs = Array.isArray(context.transacoes) ? context.transacoes : [];

  const despesasAll = txs.filter(t => t.tipo === 'despesa').sort((a, b) => Number(b.valor) - Number(a.valor));
  const MAX_TX = 20;
  const truncado = despesasAll.length > MAX_TX;
  const despesasLista = despesasAll
    .slice(0, MAX_TX)
    .map(t => `  ${fmtData(t.data_hora || t.data)} | ${t.descricao} | ${labelCategoria(t.categoria)} | ${fmtBRL(Number(t.valor))}`)
    .join('\n') || '  Nenhuma despesa lançada.';

  const receitasAll = txs.filter(t => t.tipo === 'receita').sort((a, b) => Number(b.valor) - Number(a.valor));
  const receitasLista = receitasAll
    .map(t => `  ${fmtData(t.data_hora || t.data)} | ${t.descricao} | ${fmtBRL(Number(t.valor))}`)
    .join('\n') || '  Nenhuma receita lançada.';

  const historicoTxt = historico.length > 0
    ? historico.map(h => {
        const r = h.resumo;
        const hReceitas  = Number(r.total_receitas || 0);
        const hDespesas  = Number(r.total_despesas || 0);
        const hSaldo     = Number(r.saldo_atual || 0);
        const hPoupanca  = hReceitas > 0 ? Math.round((hSaldo / hReceitas) * 100) : null;
        return `  ${fmtMesLabel(h.competencia)}: Receitas ${fmtBRL(hReceitas)} | Despesas ${fmtBRL(hDespesas)} | Saldo ${fmtBRL(hSaldo)}${hPoupanca !== null ? ` | Poupança ${hPoupanca}%` : ''}`;
      }).join('\n')
    : '  Nenhum histórico anterior disponível.';

  const semDados = receitas === 0 && despesas === 0 && txs.length === 0;
  const rankingMultiMes = buildRankingMultiMes(historico, context.gastos);

  return `=== CARTEIRA — ${mesLabel.toUpperCase()} ===
${semDados ? '⚠️ SEM TRANSAÇÕES NESTE MÊS: oriente o usuário a registrar transações antes de analisar.' : ''}
RESUMO DO MÊS ATUAL:
  Receitas:  ${fmtBRL(receitas)}
  Despesas:  ${fmtBRL(despesas)}
  Saldo:     ${fmtBRL(saldo)} (${saldoStatus})${taxaPoupanca !== null ? `\n  Taxa de poupança: ${taxaPoupanca}%` : ''}${saldoInicial !== 0 ? `\n  Saldo inicial herdado do mês anterior: ${fmtBRL(saldoInicial)}` : ''}${totalInvest > 0 ? `\n  Total investido acumulado até este mês: ${fmtBRL(totalInvest)}` : ''}

GASTOS POR CATEGORIA — MÊS ATUAL (apenas gasto > R$ 0,00):
${categorias}

DESPESAS INDIVIDUAIS — MÊS ATUAL${truncado ? ` (parcial: ${MAX_TX} de ${despesasAll.length})` : ` (${despesasAll.length} no total)`}:
${despesasLista}

RECEITAS INDIVIDUAIS — MÊS ATUAL (${receitasAll.length} no total):
${receitasLista}

RANKING DE OFENSORES — TODOS OS ${1 + historico.length} MESES DISPONÍVEIS (acumulado real):
${rankingMultiMes}

HISTÓRICO MENSAL (totais reais por mês):
${historicoTxt}

=== FIM DOS DADOS ===

PERGUNTA: ${safeMsg}

LEMBRETE: comece com um dado concreto (ex: "📊 [Categoria]: R$ X,XX"). Sem saudações ou introduções.`;
}

/**
 * @param {Function} onClose  - Fecha o drawer
 * @param {Object}   context  - { mes, receitas, despesas, saldo, saldoInicial, gastos, limites, transacoes, totalInvestido, mesesDisponiveis }
 */
export default function AIAdvisor({ onClose, context }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [historico, setHistorico] = useState([]);
  const bottomRef  = useRef(null);
  const textRef    = useRef(null);
  const contextRef = useRef(context);

  // Busca até 12 meses anteriores com totais por categoria para análise de ofensores
  useEffect(() => {
    const { mes, mesesDisponiveis = [] } = contextRef.current;
    const anteriores = mesesDisponiveis
      .filter(m => m < (mes || '9999'))
      .slice(0, 12); // limita a 1 ano para evitar sobrecarga
    if (!anteriores.length) return;
    let active = true;

    const normalizarCat = cat =>
      String(cat || '').startsWith('assinaturas.') ? 'Assinaturas Online' : cat;

    // Busca em lotes de 4 para não sobrecarregar o servidor
    const buscarEmLotes = async (meses) => {
      const resultado = [];
      for (let i = 0; i < meses.length; i += 4) {
        const lote = meses.slice(i, i + 4);
        const respostas = await Promise.all(
          lote.map(m =>
            api.get(`/wallet/extrato/${m}`)
              .then(r => {
                const txs = (r.data?.transacoes || []).filter(t => !t.deletadoEm);
                const categorias = {};
                txs.forEach(t => {
                  if (t.tipo === 'despesa' && t.categoria) {
                    const cat = normalizarCat(t.categoria);
                    categorias[cat] = (categorias[cat] || 0) + Number(t.valor || 0);
                  }
                });
                return { competencia: m, resumo: r.data?.resumo || {}, categorias };
              })
              .catch(() => null),
          ),
        );
        resultado.push(...respostas);
      }
      return resultado;
    };

    buscarEmLotes(anteriores).then(res => {
      if (active) setHistorico(res.filter(Boolean));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;

    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Histórico das últimas 10 trocas para manter contexto entre turnos
    const history = updatedMessages.slice(-10).slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    try {
      const { data } = await api.post('/ai/gemini', {
        model: 'gemini-2.5-flash',
        payload: {
          system_instruction: { parts: [{ text: AI_ADVISOR_SYSTEM_PROMPT }] },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: buildUserMessage(context, historico, userMsg) }] },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 0 },
          },
        },
      });
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Não foi possível gerar uma resposta.';
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Erro ao consultar a IA. Verifique sua conexão e tente novamente.',
      }]);
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Drawer role="dialog" aria-label="Assistente Financeiro IA">
      <DrawerHeader>
        <HeaderTitle>
          <Sparkles size={16} />
          <span>Assistente IA</span>
          <HeaderBadge>Gemini</HeaderBadge>
        </HeaderTitle>
        <CloseBtn onClick={onClose} aria-label="Fechar assistente">
          <X size={15} />
        </CloseBtn>
      </DrawerHeader>

      <MessagesArea>
        {!hasMessages ? (
          <EmptyState>
            <EmptyIcon><Sparkles size={20} /></EmptyIcon>
            <p style={{ fontSize: '0.82rem', color: '#6a7a9a', lineHeight: 1.5 }}>
              Pergunte sobre suas finanças do mês. Tenho acesso aos seus dados de receitas, despesas e metas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
              {SUGGESTIONS.map((s, i) => (
                <Suggestion key={i} onClick={() => send(s)}>{s}</Suggestion>
              ))}
            </div>
          </EmptyState>
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message key={i} $role={msg.role}>
                <Bubble $role={msg.role}>{msg.text}</Bubble>
              </Message>
            ))}
            {loading && (
              <Message $role="ai">
                <LoadingDots>
                  <span /><span /><span />
                </LoadingDots>
              </Message>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </MessagesArea>

      <InputArea>
        <TextArea
          ref={textRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pergunte sobre suas finanças..."
          rows={1}
          maxLength={600}
          aria-label="Mensagem para o assistente"
        />
        <SendBtn
          onClick={() => send()}
          $disabled={!input.trim() || loading}
          disabled={!input.trim() || loading}
          aria-label="Enviar mensagem"
        >
          {loading ? <SpinningLoader size={15} /> : <Send size={15} />}
        </SendBtn>
      </InputArea>
    </Drawer>
  );
}
