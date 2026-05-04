// Controller: goalController
// Responsabilidade: CRUD de cofrinhos (metas financeiras) do usuário.
//   Um cofrinho acumula depósitos/saques em direção a um valorMeta (viagem, compra, reserva etc.).
// Depende de: Goal model, validators, connectDB

'use strict';

const Goal     = require('../models/Goal');
const connectDB = require('../config/database');
const {
    stringObrigatoria,
    valorPositivo,
    valorNaoNegativo,
    corHexEhValida,
    prazoEhValido,
    sanitizarValor,
} = require('../utils/validators');

// ─────────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────────

/**
 * Garante que o cofrinho existe, está ativo e pertence ao usuário autenticado.
 * Lança { status, erro } se a verificação falhar.
 *
 * @param {string} id
 * @param {string} usuario_id
 * @returns {Promise<import('../models/Goal')>}
 */
const obterCofrinhoDoUsuario = async (id, usuario_id) => {
    const goal = await Goal.findOne({ _id: id, usuario_id, ativo: true });
    if (!goal) throw { status: 404, erro: 'Cofrinho não encontrado.' };
    return goal;
};

/**
 * Serializa um documento Goal para a resposta da API.
 * @param {object} doc
 * @returns {object}
 */
const serializar = (doc) => {
    const obj = doc.toObject();
    const pct  = obj.valorMeta > 0 ? (obj.valorAtual / obj.valorMeta) * 100 : 0;
    return {
        id:          obj._id,
        nome:        obj.nome,
        icone:       obj.icone,
        cor:         obj.cor,
        valorMeta:   obj.valorMeta,
        valorAtual:  obj.valorAtual,
        prazo:       obj.prazo ?? null,
        progresso:   Math.round(pct * 10) / 10,   // % com 1 casa decimal
        concluido:   obj.valorAtual >= obj.valorMeta,
        criadoEm:    obj.createdAt,
        atualizadoEm: obj.updatedAt,
    };
};

// ─────────────────────────────────────────────────────────────
// CONTROLLERS EXPORTADOS
// ─────────────────────────────────────────────────────────────

module.exports = {

    /**
     * GET /api/goals
     * Lista todos os cofrinhos ativos do usuário, ordenados por data de criação desc.
     */
    async listar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;

            const cofrinhos = await Goal.find({ usuario_id, ativo: true }).sort({ createdAt: -1 });

            const totalAcumulado = cofrinhos.reduce((s, g) => s + g.valorAtual, 0);
            const totalMetas     = cofrinhos.reduce((s, g) => s + g.valorMeta, 0);

            return res.status(200).json({
                cofrinhos: cofrinhos.map(serializar),
                resumo: {
                    totalAcumulado: sanitizarValor(totalAcumulado),
                    totalMetas:     sanitizarValor(totalMetas),
                    quantidade:     cofrinhos.length,
                    concluidos:     cofrinhos.filter((g) => g.valorAtual >= g.valorMeta).length,
                },
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            return res.status(500).json({ erro: 'Erro ao listar cofrinhos.' });
        }
    },

    /**
     * POST /api/goals
     * Cria um novo cofrinho para o usuário.
     *
     * Body: { nome, icone?, cor?, valorMeta, prazo? }
     */
    async criar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { nome, icone = '🐷', cor = '#3b82f6', valorMeta, prazo = null } = req.body;

            // ── Validações de negócio ─────────────────────────────
            if (!stringObrigatoria(nome, 100))
                return res.status(400).json({ erro: 'Nome é obrigatório (máx. 100 caracteres).' });

            if (!valorPositivo(valorMeta))
                return res.status(400).json({ erro: 'Valor da meta deve ser maior que zero.' });

            if (!corHexEhValida(cor))
                return res.status(400).json({ erro: 'Cor inválida. Use o formato #rrggbb.' });

            if (!prazoEhValido(prazo))
                return res.status(400).json({ erro: 'Prazo inválido. Use o formato YYYY-MM.' });
            // ─────────────────────────────────────────────────────

            const novo = await Goal.create({
                usuario_id,
                nome:       String(nome).trim(),
                icone:      String(icone).slice(0, 10),
                cor,
                valorMeta:  sanitizarValor(valorMeta),
                valorAtual: 0,
                prazo:      prazo || null,
            });

            return res.status(201).json({
                mensagem:  'Cofrinho criado com sucesso.',
                cofrinho:  serializar(novo),
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                const msgs = Object.values(err.errors).map((e) => e.message).join(' ');
                return res.status(400).json({ erro: msgs });
            }
            return res.status(500).json({ erro: 'Erro ao criar cofrinho.' });
        }
    },

    /**
     * PUT /api/goals/:id
     * Atualiza os metadados do cofrinho (nome, ícone, cor, meta, prazo).
     * Não altera valorAtual — use PATCH /depositar para movimentações.
     *
     * Body: { nome?, icone?, cor?, valorMeta?, prazo? }
     */
    async atualizar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { id } = req.params;

            const goal = await obterCofrinhoDoUsuario(id, usuario_id);

            const { nome, icone, cor, valorMeta, prazo } = req.body;

            if (nome !== undefined) {
                if (!stringObrigatoria(nome, 100))
                    return res.status(400).json({ erro: 'Nome inválido.' });
                goal.nome = String(nome).trim();
            }

            if (icone !== undefined) {
                goal.icone = String(icone).slice(0, 10);
            }

            if (cor !== undefined) {
                if (!corHexEhValida(cor))
                    return res.status(400).json({ erro: 'Cor inválida. Use o formato #rrggbb.' });
                goal.cor = cor;
            }

            if (valorMeta !== undefined) {
                if (!valorPositivo(valorMeta))
                    return res.status(400).json({ erro: 'Valor da meta deve ser maior que zero.' });
                goal.valorMeta = sanitizarValor(valorMeta);
            }

            if (prazo !== undefined) {
                if (!prazoEhValido(prazo))
                    return res.status(400).json({ erro: 'Prazo inválido. Use o formato YYYY-MM.' });
                goal.prazo = prazo || null;
            }

            await goal.save();

            return res.status(200).json({
                mensagem: 'Cofrinho atualizado com sucesso.',
                cofrinho: serializar(goal),
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            if (err.name === 'ValidationError') {
                const msgs = Object.values(err.errors).map((e) => e.message).join(' ');
                return res.status(400).json({ erro: msgs });
            }
            return res.status(500).json({ erro: 'Erro ao atualizar cofrinho.' });
        }
    },

    /**
     * PATCH /api/goals/:id/depositar
     * Deposita ou retira valor do cofrinho.
     *   - Valor positivo = depósito
     *   - Valor negativo = saque (não permite ficar abaixo de 0)
     *
     * Body: { valor: number }  — pode ser negativo para saque
     */
    async depositar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { id } = req.params;
            const { valor } = req.body;

            // Valor pode ser negativo (saque), mas não pode ser zero nem não-numérico
            const n = Number(valor);
            if (!Number.isFinite(n) || n === 0)
                return res.status(400).json({ erro: 'Informe um valor diferente de zero.' });

            const goal = await obterCofrinhoDoUsuario(id, usuario_id);

            const novoValor = Math.round((goal.valorAtual + n) * 100) / 100;

            // Regra de negócio: saldo do cofrinho nunca fica negativo
            if (novoValor < 0)
                return res.status(400).json({
                    erro: `Saldo insuficiente. Máximo para retirada: R$ ${goal.valorAtual.toFixed(2)}.`,
                });

            goal.valorAtual = novoValor;
            await goal.save();

            const operacao = n > 0 ? 'Depósito' : 'Retirada';
            return res.status(200).json({
                mensagem: `${operacao} realizado com sucesso.`,
                cofrinho: serializar(goal),
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            return res.status(500).json({ erro: 'Erro ao movimentar cofrinho.' });
        }
    },

    /**
     * DELETE /api/goals/:id
     * Soft-delete: arquiva o cofrinho (ativo = false) sem apagar do banco.
     */
    async remover(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { id } = req.params;

            const goal = await obterCofrinhoDoUsuario(id, usuario_id);

            goal.ativo = false;
            await goal.save();

            return res.status(200).json({ mensagem: 'Cofrinho removido com sucesso.' });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            return res.status(500).json({ erro: 'Erro ao remover cofrinho.' });
        }
    },
};
