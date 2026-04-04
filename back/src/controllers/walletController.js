const Wallet = require('../models/Wallet');

// 💡 FUNÇÃO AUXILIAR: Recalcula o resumo
const atualizarResumo = (wallet) => {
    const transacoesAtivas = wallet.transacoes.filter(t => !t.deletadoEm);

    wallet.resumo.total_receitas = transacoesAtivas
        .filter(t => t.tipo === 'receita')
        .reduce((acc, t) => acc + t.valor, 0);

    wallet.resumo.total_despesas = transacoesAtivas
        .filter(t => t.tipo === 'despesa')
        .reduce((acc, t) => acc + t.valor, 0);

    wallet.resumo.saldo_atual = wallet.resumo.saldo_inicial + wallet.resumo.total_receitas - wallet.resumo.total_despesas;
};

const normalizarLimites = (limites) => {
    if (!limites) return {};
    if (typeof limites.toJSON === 'function') return limites.toJSON();
    if (limites instanceof Map) return Object.fromEntries(limites.entries());
    return { ...limites };
};

module.exports = {
    // 1. DASHBOARD (Resumo rápido para a tela principal)
    async obterDashboard(req, res) {
        try {
            const usuario_id = req.usuarioId;
            const wallet = await Wallet.findOne({ usuario_id }).sort({ competencia: -1 });

            if (!wallet) {
                return res.status(200).json({
                    competencia: "Nenhum mês iniciado",
                    resumo: { saldo_atual: 0, total_receitas: 0, total_despesas: 0 },
                    recentTransactions: [],
                    gastosPorCategoria: {}, // Vazio se não tem wallet
                    limites: {}
                });
            }

            const transacoesVisiveis = wallet.transacoes.filter(t => !t.deletadoEm);

            // --- CÁLCULO DE GASTOS POR CATEGORIA (Agregação Real) ---
            const gastosPorCategoria = {};
            transacoesVisiveis.forEach(t => {
                if (t.tipo === 'despesa') {
                    const cat = t.categoria || 'Outros';
                    gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + t.valor;
                }
            });

            res.status(200).json({
                competencia: wallet.competencia,
                resumo: wallet.resumo,
                recentTransactions: transacoesVisiveis.slice(-5).reverse(),
                gastosPorCategoria, // O Front vai usar isso para as barras de progresso
                limites: normalizarLimites(wallet.limites_gastos) // Puxa as metas do banco
            });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao processar dashboard.' });
        }
    },

    // 2. INICIAR MÊS
    async iniciarMes(req, res) {
        try {
            const { competencia } = req.body;
            const usuario_id = req.usuarioId;

            const existe = await Wallet.findOne({ usuario_id, competencia });
            if (existe) return res.status(400).json({ erro: 'Este mês já foi iniciado.' });

            const [ano, mes] = competencia.split('-').map(Number);
            const dataAnterior = new Date(ano, mes - 2);
            const competenciaAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;
            const walletAnterior = await Wallet.findOne({ usuario_id, competencia: competenciaAnterior });

            const saldoTransferido = walletAnterior ? walletAnterior.resumo.saldo_atual : 0;

            const novaWallet = await Wallet.create({
                usuario_id,
                competencia,
                resumo: {
                    saldo_inicial: saldoTransferido,
                    saldo_atual: saldoTransferido
                }
            });

            res.status(201).json(novaWallet);
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao iniciar o mês.' });
        }
    },

    // 3. ADICIONAR TRANSAÇÃO
    async adicionarTransacao(req, res) {
        try {
            const { competencia, tipo, categoria, valor, descricao, tags } = req.body;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });
            if (!wallet) return res.status(404).json({ erro: 'Mês não iniciado.' });

            wallet.transacoes.push({ tipo, categoria, valor, descricao, tags });
            atualizarResumo(wallet);
            await wallet.save();

            res.status(200).json({ mensagem: 'Sucesso!', resumo: wallet.resumo });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao registrar.' });
        }
    },

    // 4. OBTER EXTRATO DETALHADO
    async obterExtrato(req, res) {
        try {
            const { competencia } = req.params;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });
            if (!wallet) return res.status(404).json({ erro: 'Mês não encontrado.' });

            const transacoesVisiveis = wallet.transacoes.filter(t => !t.deletadoEm);
            res.status(200).json({ ...wallet._doc, transacoes: transacoesVisiveis });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar extrato.' });
        }
    },

    // 5. DELETAR TRANSAÇÃO (Soft Delete)
    async deletarTransacao(req, res) {
        try {
            const { competencia, transacaoId } = req.params;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });
            const transacao = wallet?.transacoes.id(transacaoId);

            if (!transacao) return res.status(404).json({ erro: 'Não encontrado.' });

            transacao.deletadoEm = new Date();
            atualizarResumo(wallet);
            await wallet.save();

            res.status(200).json({ mensagem: 'Removido!', resumo: wallet.resumo });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao deletar.' });
        }
    },

    // 6. DEFINIR LIMITES
    async definirLimites(req, res) {
        try {
            const { competencia } = req.params;
            const { limites } = req.body;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOneAndUpdate(
                { usuario_id, competencia },
                { limites_gastos: limites },
                { new: true }
            );

            if (!wallet) return res.status(404).json({ erro: 'Mês não encontrado.' });
            res.status(200).json(normalizarLimites(wallet.limites_gastos));
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao definir limites.' });
        }
    }
};
