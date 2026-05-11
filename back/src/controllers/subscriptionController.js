const Subscription = require('../models/Subscription');
const connectDB = require('../config/database');
const {
    obterOuCriarWallet,
    adicionarTransacaoNaWallet,
    atualizarResumo,
    sincronizarCarteirasEmCadeia,
    competenciaEhValida,
} = require('./walletController')._helpers;

// Avança a data pelo ciclo sem derivar datas (ex: 31/jan + 1 mês = 28/fev, não 3/mar)
function avancarData(data, billing_cycle) {
    const d = new Date(data);
    const diaOriginal = d.getDate();

    if (billing_cycle === 'anual') {
        d.setFullYear(d.getFullYear() + 1);
    } else {
        d.setMonth(d.getMonth() + 1);
    }

    // Corrige overflow de fim de mês (ex: 31/jan → 3/mar → 28/fev)
    if (d.getDate() !== diaOriginal) {
        d.setDate(0); // último dia do mês anterior
    }

    return d;
}

function competenciaDeData(data) {
    const d = new Date(data);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
    async listar(req, res) {
        try {
            await connectDB();
            const subs = await Subscription.find({ usuario_id: req.usuarioId, ativo: true })
                .sort({ next_charge_date: 1 })
                .lean();
            return res.status(200).json(subs);
        } catch {
            return res.status(500).json({ erro: 'Erro ao listar assinaturas.' });
        }
    },

    async criar(req, res) {
        try {
            await connectDB();
            const { nome, categoria, valor, billing_cycle, next_charge_date, status, payment_method } = req.body;

            if (!nome || !categoria || !valor || !billing_cycle || !next_charge_date) {
                return res.status(400).json({ erro: 'Campos obrigatórios: nome, categoria, valor, billing_cycle, next_charge_date.' });
            }
            if (!['mensal', 'anual'].includes(billing_cycle)) {
                return res.status(400).json({ erro: 'billing_cycle deve ser "mensal" ou "anual".' });
            }
            if (Number(valor) <= 0) {
                return res.status(400).json({ erro: 'Valor deve ser maior que zero.' });
            }

            const sub = await Subscription.create({
                usuario_id: req.usuarioId,
                nome,
                categoria,
                valor: Number(valor),
                billing_cycle,
                next_charge_date: new Date(next_charge_date),
                status: status || 'ativo',
                payment_method: payment_method || '',
            });

            return res.status(201).json(sub);
        } catch {
            return res.status(500).json({ erro: 'Erro ao criar assinatura.' });
        }
    },

    async editar(req, res) {
        try {
            await connectDB();
            const sub = await Subscription.findOne({ _id: req.params.id, usuario_id: req.usuarioId, ativo: true });
            if (!sub) return res.status(404).json({ erro: 'Assinatura não encontrada.' });

            const campos = ['nome', 'categoria', 'valor', 'billing_cycle', 'next_charge_date', 'status', 'payment_method'];
            campos.forEach((c) => {
                if (req.body[c] !== undefined) sub[c] = c === 'valor' ? Number(req.body[c]) : req.body[c];
            });

            await sub.save();
            return res.status(200).json(sub);
        } catch {
            return res.status(500).json({ erro: 'Erro ao editar assinatura.' });
        }
    },

    async deletar(req, res) {
        try {
            await connectDB();
            const sub = await Subscription.findOne({ _id: req.params.id, usuario_id: req.usuarioId });
            if (!sub) return res.status(404).json({ erro: 'Assinatura não encontrada.' });

            sub.ativo = false;
            await sub.save();
            return res.status(200).json({ mensagem: 'Assinatura removida.' });
        } catch {
            return res.status(500).json({ erro: 'Erro ao remover assinatura.' });
        }
    },

    // Cria transação na Wallet e avança next_charge_date
    // Ordem de operações (fix race condition): avança data → cria transação.
    // Se criação falhar: restaura data antiga e retorna erro.
    // Se atualização da data falhar sozinha: só a data ficou errada (estado recuperável).
    async lancar(req, res) {
        try {
            await connectDB();
            const sub = await Subscription.findOne({ _id: req.params.id, usuario_id: req.usuarioId, ativo: true });
            if (!sub) return res.status(404).json({ erro: 'Assinatura não encontrada.' });
            if (sub.status !== 'ativo') return res.status(400).json({ erro: 'Só é possível lançar cobranças de assinaturas ativas.' });

            const { data_hora, payment_method, descricao } = req.body;
            const dataCobranca = data_hora ? new Date(data_hora) : new Date();
            const competencia = competenciaDeData(dataCobranca);

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Data de cobrança inválida.' });
            }

            // Avança a data ANTES de criar a transação
            const dataAnterior = sub.next_charge_date;
            sub.next_charge_date = avancarData(sub.next_charge_date, sub.billing_cycle);
            await sub.save();

            // Cria a transação na wallet; em caso de falha, restaura a data
            try {
                const wallet = await obterOuCriarWallet(req.usuarioId, competencia);
                const transacao = adicionarTransacaoNaWallet(wallet, {
                    tipo: 'despesa',
                    categoria: sub.categoria,
                    valor: sub.valor,
                    descricao: descricao || sub.nome,
                    data_hora: dataCobranca,
                    tags: ['assinatura'],
                });
                atualizarResumo(wallet);
                await wallet.save();
                await sincronizarCarteirasEmCadeia(req.usuarioId);

                return res.status(200).json({
                    mensagem: 'Cobrança lançada com sucesso.',
                    transacao: transacao.toObject(),
                    subscription: sub,
                });
            } catch (errTransacao) {
                // Restaura data para permitir nova tentativa
                sub.next_charge_date = dataAnterior;
                await sub.save().catch(() => {});
                throw errTransacao;
            }
        } catch {
            return res.status(500).json({ erro: 'Erro ao lançar cobrança.' });
        }
    },
};
