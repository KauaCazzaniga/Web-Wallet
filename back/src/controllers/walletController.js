const Wallet = require('../models/Wallet');
const connectDB = require('../config/database');

const atualizarResumo = (wallet) => {
    const transacoesAtivas = wallet.transacoes.filter((transacao) => !transacao.deletadoEm);

    wallet.resumo.total_receitas = transacoesAtivas
        .filter((transacao) => transacao.tipo === 'receita')
        .reduce((acc, transacao) => acc + transacao.valor, 0);

    wallet.resumo.total_despesas = transacoesAtivas
        .filter((transacao) => transacao.tipo === 'despesa')
        .reduce((acc, transacao) => acc + transacao.valor, 0);

    wallet.resumo.saldo_atual =
        wallet.resumo.saldo_inicial + wallet.resumo.total_receitas - wallet.resumo.total_despesas;
};

const normalizarLimites = (limites) => {
    if (!limites) return {};
    if (typeof limites.toJSON === 'function') return limites.toJSON();
    if (limites instanceof Map) return Object.fromEntries(limites.entries());
    return { ...limites };
};

const competenciaEhValida = (competencia) => /^\d{4}-\d{2}$/.test(String(competencia || ''));

const obterSnapshotResumo = (wallet) => ({
    saldo_inicial: Number(wallet?.resumo?.saldo_inicial || 0),
    total_receitas: Number(wallet?.resumo?.total_receitas || 0),
    total_despesas: Number(wallet?.resumo?.total_despesas || 0),
    saldo_atual: Number(wallet?.resumo?.saldo_atual || 0),
});

const resumoMudou = (antes, depois) =>
    antes.saldo_inicial !== depois.saldo_inicial ||
    antes.total_receitas !== depois.total_receitas ||
    antes.total_despesas !== depois.total_despesas ||
    antes.saldo_atual !== depois.saldo_atual;

const serializarWallet = (wallet) => {
    const walletObj = wallet.toObject({ flattenMaps: true });
    const transacoesVisiveis = wallet.transacoes
        .filter((transacao) => !transacao.deletadoEm)
        .map((transacao) => transacao.toObject());

    return {
        ...walletObj,
        transacoes: transacoesVisiveis,
        limites: normalizarLimites(wallet.limites_gastos),
        limites_gastos: normalizarLimites(wallet.limites_gastos),
    };
};

const obterCompetenciaAnterior = (competencia) => {
    const [ano, mes] = String(competencia).split('-').map(Number);
    const dataAnterior = new Date(ano, mes - 2, 1);
    return `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;
};

const obterWalletAnteriorMaisRecente = (usuario_id, competencia) =>
    Wallet.findOne({ usuario_id, competencia: { $lt: competencia } }).sort({ competencia: -1 });

const montarWalletInicial = async (usuario_id, competencia) => {
    const walletAnterior = await obterWalletAnteriorMaisRecente(usuario_id, competencia);
    const saldoTransferido = walletAnterior ? Number(walletAnterior.resumo?.saldo_atual || 0) : 0;

    return {
        usuario_id,
        competencia,
        resumo: {
            saldo_inicial: saldoTransferido,
            saldo_atual: saldoTransferido,
        },
        limites_gastos: normalizarLimites(walletAnterior?.limites_gastos),
    };
};

const montarExtratoVirtual = async (usuario_id, competencia) => {
    const walletInicial = await montarWalletInicial(usuario_id, competencia);
    const limites = normalizarLimites(walletInicial?.limites_gastos);
    const saldoInicial = Number(walletInicial?.resumo?.saldo_inicial || 0);

    return {
        competencia,
        resumo: {
            saldo_inicial: saldoInicial,
            total_receitas: 0,
            total_despesas: 0,
            saldo_atual: saldoInicial,
        },
        transacoes: [],
        limites,
        limites_gastos: limites,
    };
};

const sincronizarCarteirasEmCadeia = async (usuario_id) => {
    const wallets = await Wallet.find({ usuario_id }).sort({ competencia: 1 });
    let saldoAnterior = 0;

    for (const wallet of wallets) {
        const resumoAnterior = obterSnapshotResumo(wallet);

        wallet.resumo.saldo_inicial = saldoAnterior;
        atualizarResumo(wallet);

        const resumoAtual = obterSnapshotResumo(wallet);
        if (resumoMudou(resumoAnterior, resumoAtual)) {
            await wallet.save();
        }

        saldoAnterior = resumoAtual.saldo_atual;
    }
};

const obterOuCriarWallet = async (usuario_id, competencia) => {
    if (!competenciaEhValida(competencia)) {
        throw new Error('Competencia invalida.');
    }

    const existente = await Wallet.findOne({ usuario_id, competencia });
    if (existente) return existente;

    return Wallet.create(await montarWalletInicial(usuario_id, competencia));
};

const adicionarTransacaoNaWallet = (wallet, payload = {}) => {
    wallet.transacoes.push({
        data_hora: payload.data_hora || undefined,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor: Number(payload.valor),
        descricao: payload.descricao,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        importadoViaPdf: Boolean(payload.importadoViaPdf),
    });

    return wallet.transacoes[wallet.transacoes.length - 1];
};

module.exports = {
    async obterDashboard(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            await sincronizarCarteirasEmCadeia(usuario_id);
            const wallet = await Wallet.findOne({ usuario_id }).sort({ competencia: -1 });

            if (!wallet) {
                return res.status(200).json({
                    competencia: 'Nenhum mes iniciado',
                    resumo: { saldo_atual: 0, total_receitas: 0, total_despesas: 0 },
                    recentTransactions: [],
                    gastosPorCategoria: {},
                    limites: {},
                });
            }

            const transacoesVisiveis = wallet.transacoes.filter((transacao) => !transacao.deletadoEm);
            const gastosPorCategoria = {};

            transacoesVisiveis.forEach((transacao) => {
                if (transacao.tipo === 'despesa') {
                    const categoria = transacao.categoria || 'Outros';
                    gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + transacao.valor;
                }
            });

            return res.status(200).json({
                competencia: wallet.competencia,
                resumo: wallet.resumo,
                recentTransactions: transacoesVisiveis.slice(-5).reverse(),
                gastosPorCategoria,
                limites: normalizarLimites(wallet.limites_gastos),
            });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao processar dashboard.' });
        }
    },

    async iniciarMes(req, res) {
        try {
            await connectDB();
            const { competencia } = req.body;
            const usuario_id = req.usuarioId;

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Competencia invalida.' });
            }

            const novaWallet = await Wallet.create(await montarWalletInicial(usuario_id, competencia));
            await sincronizarCarteirasEmCadeia(usuario_id);
            return res.status(201).json(serializarWallet(novaWallet));
        } catch (error) {
            // Código 11000: violação do índice único (usuario_id + competencia)
            if (error.code === 11000) {
                return res.status(400).json({ erro: 'Este mes ja foi iniciado.' });
            }
            return res.status(500).json({ erro: 'Erro ao iniciar o mes.' });
        }
    },

    async adicionarTransacao(req, res) {
        try {
            await connectDB();
            const { competencia, tipo, categoria, valor, descricao, tags, data_hora, importadoViaPdf } = req.body;
            const usuario_id = req.usuarioId;

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Competencia invalida.' });
            }

            const wallet = await obterOuCriarWallet(usuario_id, competencia);
            const transacao = adicionarTransacaoNaWallet(wallet, {
                tipo,
                categoria,
                valor,
                descricao,
                tags,
                data_hora,
                importadoViaPdf,
            });

            atualizarResumo(wallet);
            await wallet.save();
            await sincronizarCarteirasEmCadeia(usuario_id);

            return res.status(200).json({
                mensagem: 'Sucesso!',
                resumo: wallet.resumo,
                transacao: transacao.toObject(),
            });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao registrar.' });
        }
    },

    async importarTransacoes(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const transacoes = Array.isArray(req.body?.transacoes) ? req.body.transacoes : [];

            if (!transacoes.length) {
                return res.status(400).json({ erro: 'Nenhuma transacao informada para importacao.' });
            }

            const walletsCache = new Map();
            const transacoesCriadas = [];

            for (const transacao of transacoes) {
                const competencia = String(transacao?.competencia || '').slice(0, 7);
                if (!/^\d{4}-\d{2}$/.test(competencia)) {
                    return res.status(400).json({ erro: 'Competencia invalida na importacao.' });
                }

                let wallet = walletsCache.get(competencia);
                if (!wallet) {
                    wallet = await obterOuCriarWallet(usuario_id, competencia);
                    walletsCache.set(competencia, wallet);
                }

                const criada = adicionarTransacaoNaWallet(wallet, {
                    ...transacao,
                    importadoViaPdf: true,
                });

                transacoesCriadas.push({
                    ...criada.toObject(),
                    competencia,
                });
            }

            for (const wallet of walletsCache.values()) {
                atualizarResumo(wallet);
                await wallet.save();
            }

            await sincronizarCarteirasEmCadeia(usuario_id);

            return res.status(201).json({
                mensagem: 'Transacoes importadas com sucesso.',
                transacoes: transacoesCriadas,
            });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao importar transacoes.' });
        }
    },

    async obterExtrato(req, res) {
        try {
            await connectDB();
            const { competencia } = req.params;
            const usuario_id = req.usuarioId;

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Competencia invalida.' });
            }

            await sincronizarCarteirasEmCadeia(usuario_id);
            const wallet = await Wallet.findOne({ usuario_id, competencia });
            if (!wallet) {
                return res.status(200).json(await montarExtratoVirtual(usuario_id, competencia));
            }

            return res.status(200).json(serializarWallet(wallet));
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao buscar extrato.' });
        }
    },

    async deletarTransacao(req, res) {
        try {
            await connectDB();
            const { transacaoId } = req.params;
            const usuario_id = req.usuarioId;

            // req.wallet é injetado pelo middleware verifyTransactionOwnership
            const wallet = req.wallet;
            const transacao = wallet.transacoes.id(transacaoId);

            if (transacao.deletadoEm) {
                return res.status(200).json({ mensagem: 'Transacao ja removida.', resumo: wallet.resumo });
            }

            transacao.deletadoEm = new Date();
            atualizarResumo(wallet);
            await wallet.save();
            await sincronizarCarteirasEmCadeia(usuario_id);

            return res.status(200).json({ mensagem: 'Removido!', resumo: wallet.resumo });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao deletar.' });
        }
    },

    async deletarTodasTransacoes(req, res) {
        try {
            await connectDB();
            const { competencia } = req.params;
            const usuario_id = req.usuarioId;

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Competencia invalida.' });
            }

            const wallet = await Wallet.findOne({ usuario_id, competencia });
            if (!wallet) {
                return res.status(404).json({ erro: 'Nenhuma carteira encontrada para esta competencia.' });
            }

            const transacoesAtivas = wallet.transacoes.filter((transacao) => !transacao.deletadoEm);
            if (!transacoesAtivas.length) {
                return res.status(200).json({ mensagem: 'Nao havia transacoes para remover.', removidas: 0, resumo: wallet.resumo });
            }

            const agora = new Date();
            wallet.transacoes.forEach((transacao) => {
                if (!transacao.deletadoEm) {
                    transacao.deletadoEm = agora;
                }
            });

            atualizarResumo(wallet);
            await wallet.save();
            await sincronizarCarteirasEmCadeia(usuario_id);

            return res.status(200).json({
                mensagem: 'Todas as transacoes foram removidas.',
                removidas: transacoesAtivas.length,
                resumo: wallet.resumo,
            });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao deletar transacoes.' });
        }
    },

    async totalInvestido(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const { ate } = req.query; // "YYYY-MM" — soma apenas até este mês (inclusive)
            const query = { usuario_id };
            if (ate && competenciaEhValida(ate)) {
                query.competencia = { $lte: ate };
            }
            const wallets = await Wallet.find(query);
            let total = 0;
            for (const wallet of wallets) {
                wallet.transacoes
                    .filter((t) => !t.deletadoEm && t.tipo === 'despesa' && t.categoria === 'Investimentos')
                    .forEach((t) => { total += Number(t.valor || 0); });
            }
            return res.status(200).json({ total });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao calcular total investido.' });
        }
    },

    async listarMeses(req, res) {
        try {
            await connectDB();
            const usuario_id = req.usuarioId;
            const wallets = await Wallet.find({ usuario_id }).sort({ competencia: -1 });
            const meses = wallets
                .filter((w) => w.transacoes.some((t) => !t.deletadoEm))
                .map((w) => w.competencia);
            return res.status(200).json({ meses });
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao listar meses.' });
        }
    },

    async definirLimites(req, res) {
        try {
            await connectDB();
            const { competencia } = req.params;
            const { limites } = req.body;
            const usuario_id = req.usuarioId;

            if (!competenciaEhValida(competencia)) {
                return res.status(400).json({ erro: 'Competencia invalida.' });
            }

            const wallet = await obterOuCriarWallet(usuario_id, competencia);
            wallet.limites_gastos = limites;
            await wallet.save();

            return res.status(200).json(normalizarLimites(wallet.limites_gastos));
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao definir limites.' });
        }
    },
};
