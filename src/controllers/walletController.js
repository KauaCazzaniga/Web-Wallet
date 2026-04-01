const Wallet = require('../models/Wallet');

module.exports = {
    // 1. INICIAR UM NOVO MÊS (Criar o Balde)
    async iniciarMes(req, res) {
        try {
            const { competencia } = req.body;
            const usuario_id = req.usuarioId; // Pegamos o ID que o nosso middleware de segurança liberou!

            // Verifica se o mês já foi criado para este usuário
            const existe = await Wallet.findOne({ usuario_id, competencia });
            if (existe) {
                return res.status(400).json({ erro: 'O balde para este mês já foi iniciado.' });
            }

            const novaWallet = await Wallet.create({ usuario_id, competencia });

            res.status(201).json({ mensagem: 'Mês iniciado com sucesso!', resumo: novaWallet.resumo });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao iniciar o mês.', detalhes: erro.message });
        }
    },

    // 2. ADICIONAR UMA NOVA TRANSAÇÃO
    async adicionarTransacao(req, res) {
        try {
            const { competencia, tipo, categoria, valor, descricao, tags } = req.body;
            const usuario_id = req.usuarioId;

            // Busca a carteira do mês específico deste usuário
            const wallet = await Wallet.findOne({ usuario_id, competencia });

            if (!wallet) {
                return res.status(404).json({ erro: 'Mês não iniciado. Crie o mês primeiro antes de adicionar transações.' });
            }

            // Monta o objeto da transação
            const novaTransacao = { tipo, categoria, valor, descricao, tags };

            // Adiciona na lista
            wallet.transacoes.push(novaTransacao);

            // A MÁGICA DA MATEMÁTICA: Atualiza o resumo automaticamente
            if (tipo === 'receita') {
                wallet.resumo.total_receitas += valor;
                wallet.resumo.saldo_atual += valor;
            } else if (tipo === 'despesa') {
                wallet.resumo.total_despesas += valor;
                wallet.resumo.saldo_atual -= valor;
            }

            // Salva no banco de dados
            await wallet.save();

            res.status(200).json({
                mensagem: 'Transação registrada com sucesso!',
                resumo_atualizado: wallet.resumo
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao registrar transação.', detalhes: erro.message });
        }
    },

    // 3. OBTER EXTRATO DO MÊS
    async obterExtrato(req, res) {
        try {
            const { competencia } = req.params; // Vai vir da URL (ex: /api/wallet/2026-03)
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });

            if (!wallet) {
                return res.status(404).json({ erro: 'Nenhum dado encontrado para este mês.' });
            }

            res.status(200).json(wallet);
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar extrato.', detalhes: erro.message });
        }
    }
};