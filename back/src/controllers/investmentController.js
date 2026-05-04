// Controller: investmentController
// Responsabilidade: CRUD de investimentos da carteira do usuário.
//   Cada item representa um ativo (CDB, LCI, Ações etc.) com valor aportado e rendimento.
// Depende de: Investment model, validators, connectDB

'use strict';

const Investment = require('../models/Investment');
const connectDB  = require('../config/database');
const {
    tipoInvestimentoEhValido,
    competenciaEhValida,
    valorNaoNegativo,
    valorPositivo,
    stringObrigatoria,
    sanitizarValor,
} = require('../utils/validators');

// ─────────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────────

/**
 * Garante que o investimento existe, está ativo e pertence ao usuário autenticado.
 * Lança um objeto { status, erro } se a verificação falhar.
 *
 * @param {string} id          - _id do documento
 * @param {string} usuario_id  - ID do usuário autenticado
 * @returns {Promise<import('../models/Investment')>}
 */
const obterInvestimentoDoUsuario = async (id, usuario_id) => {
    const inv = await Investment.findOne({ _id: id, usuario_id, ativo: true });
    if (!inv) throw { status: 404, erro: 'Investimento não encontrado.' };
    return inv;
};

/**
 * Serializa um documento Investment para a resposta da API.
 * @param {object} doc - documento Mongoose
 * @returns {object}
 */
const serializar = (doc) => {
    const obj = doc.toObject();
    return {
        id:         obj._id,
        tipo:       obj.tipo,
        nome:       obj.nome,
        taxa:       obj.taxa,
        valor:      obj.valor,
        rendimento: obj.rendimento,
        mesInicio:  obj.mesInicio,
        criadoEm:   obj.createdAt,
        atualizadoEm: obj.updatedAt,
    };
};

// ─────────────────────────────────────────────────────────────
// CONTROLLERS EXPORTADOS
// ─────────────────────────────────────────────────────────────

module.exports = {

    /**
     * GET /api/investments
     * Lista todos os investimentos ativos do usuário autenticado.
     * Retorna também um resumo (total aportado, rendimento total).
     */
    async listar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;

            const investimentos = await Investment.find({ usuario_id, ativo: true }).sort({ createdAt: -1 });

            const totalAportado   = investimentos.reduce((s, i) => s + i.valor, 0);
            const totalRendimento = investimentos.reduce((s, i) => s + i.rendimento, 0);

            return res.status(200).json({
                investimentos: investimentos.map(serializar),
                resumo: {
                    totalAportado:   sanitizarValor(totalAportado),
                    totalRendimento: sanitizarValor(totalRendimento),
                    patrimonio:      sanitizarValor(totalAportado + totalRendimento),
                    quantidade:      investimentos.length,
                },
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            return res.status(500).json({ erro: 'Erro ao listar investimentos.' });
        }
    },

    /**
     * POST /api/investments
     * Cria um novo investimento para o usuário autenticado.
     *
     * Body: { tipo, nome, taxa?, valor, rendimento?, mesInicio }
     */
    async criar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { tipo, nome, taxa = '', valor, rendimento = 0, mesInicio } = req.body;

            // ── Validações de negócio ─────────────────────────────
            if (!tipoInvestimentoEhValido(tipo))
                return res.status(400).json({ erro: 'Tipo de ativo inválido.' });

            if (!stringObrigatoria(nome, 120))
                return res.status(400).json({ erro: 'Nome é obrigatório (máx. 120 caracteres).' });

            if (!valorNaoNegativo(valor))
                return res.status(400).json({ erro: 'Valor deve ser um número maior ou igual a zero.' });

            if (!valorNaoNegativo(rendimento))
                return res.status(400).json({ erro: 'Rendimento não pode ser negativo.' });

            if (!competenciaEhValida(mesInicio))
                return res.status(400).json({ erro: 'Mês de início inválido. Use o formato YYYY-MM.' });
            // ─────────────────────────────────────────────────────

            const novo = await Investment.create({
                usuario_id,
                tipo,
                nome:       String(nome).trim(),
                taxa:       String(taxa).trim().slice(0, 60),
                valor:      sanitizarValor(valor),
                rendimento: sanitizarValor(rendimento),
                mesInicio,
            });

            return res.status(201).json({
                mensagem: 'Investimento registrado com sucesso.',
                investimento: serializar(novo),
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                const msgs = Object.values(err.errors).map((e) => e.message).join(' ');
                return res.status(400).json({ erro: msgs });
            }
            return res.status(500).json({ erro: 'Erro ao criar investimento.' });
        }
    },

    /**
     * PUT /api/investments/:id
     * Atualiza os campos editáveis de um investimento existente do usuário.
     *
     * Body: { tipo?, nome?, taxa?, valor?, rendimento?, mesInicio? }
     */
    async atualizar(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { id } = req.params;

            const inv = await obterInvestimentoDoUsuario(id, usuario_id);

            const { tipo, nome, taxa, valor, rendimento, mesInicio } = req.body;

            // Aplica somente os campos enviados — partial update
            if (tipo !== undefined) {
                if (!tipoInvestimentoEhValido(tipo))
                    return res.status(400).json({ erro: 'Tipo de ativo inválido.' });
                inv.tipo = tipo;
            }

            if (nome !== undefined) {
                if (!stringObrigatoria(nome, 120))
                    return res.status(400).json({ erro: 'Nome inválido.' });
                inv.nome = String(nome).trim();
            }

            if (taxa !== undefined) {
                inv.taxa = String(taxa).trim().slice(0, 60);
            }

            if (valor !== undefined) {
                if (!valorNaoNegativo(valor))
                    return res.status(400).json({ erro: 'Valor deve ser ≥ 0.' });
                inv.valor = sanitizarValor(valor);
            }

            if (rendimento !== undefined) {
                if (!valorNaoNegativo(rendimento))
                    return res.status(400).json({ erro: 'Rendimento deve ser ≥ 0.' });
                inv.rendimento = sanitizarValor(rendimento);
            }

            if (mesInicio !== undefined) {
                if (!competenciaEhValida(mesInicio))
                    return res.status(400).json({ erro: 'Mês de início inválido. Use YYYY-MM.' });
                inv.mesInicio = mesInicio;
            }

            await inv.save();

            return res.status(200).json({
                mensagem: 'Investimento atualizado com sucesso.',
                investimento: serializar(inv),
            });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            if (err.name === 'ValidationError') {
                const msgs = Object.values(err.errors).map((e) => e.message).join(' ');
                return res.status(400).json({ erro: msgs });
            }
            return res.status(500).json({ erro: 'Erro ao atualizar investimento.' });
        }
    },

    /**
     * DELETE /api/investments/:id
     * Soft-delete: marca o investimento como inativo em vez de apagar do banco,
     * preservando o histórico para fins de auditoria e relatórios futuros.
     */
    async remover(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { id } = req.params;

            const inv = await obterInvestimentoDoUsuario(id, usuario_id);

            inv.ativo = false;
            await inv.save();

            return res.status(200).json({ mensagem: 'Investimento removido com sucesso.' });
        } catch (err) {
            if (err.status) return res.status(err.status).json({ erro: err.erro });
            return res.status(500).json({ erro: 'Erro ao remover investimento.' });
        }
    },
};
