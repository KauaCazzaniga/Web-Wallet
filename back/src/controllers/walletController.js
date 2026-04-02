const Wallet = require('../models/Wallet');

// 💡 FUNÇÃO AUXILIAR: Recalcula o saldo garantindo que transações deletadas não entrem na conta
const atualizarResumo = (wallet) => {
    // Pega apenas as transações que NÃO foram deletadas
    const transacoesAtivas = wallet.transacoes.filter(t => !t.deletadoEm);

    wallet.resumo.total_receitas = transacoesAtivas
        .filter(t => t.tipo === 'receita')
        .reduce((acc, t) => acc + t.valor, 0);

    wallet.resumo.total_despesas = transacoesAtivas
        .filter(t => t.tipo === 'despesa')
        .reduce((acc, t) => acc + t.valor, 0);

    wallet.resumo.saldo_atual = wallet.resumo.saldo_inicial + wallet.resumo.total_receitas - wallet.resumo.total_despesas;
};

module.exports = {
    // 1. INICIAR UM NOVO MÊS (Criar o Balde) - Mantido igualzinho!
    async iniciarMes(req, res) {
        try {
            const { competencia } = req.body; // Ex: "2026-05"
            const usuario_id = req.usuarioId;

            const existe = await Wallet.findOne({ usuario_id, competencia });
            if (existe) {
                return res.status(400).json({ erro: 'O balde para este mês já foi iniciado.' });
            }

            // 🔍 BUSCA O MÊS ANTERIOR (Lógica Simples)
            // Divide "2026-05" para calcular o mês anterior "2026-04"
            const [ano, mes] = competencia.split('-').map(Number);
            const dataAnterior = new Date(ano, mes - 2); // mes-2 porque Date usa 0-11 e queremos o anterior
            const competenciaAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;

            const walletAnterior = await Wallet.findOne({ usuario_id, competencia: competenciaAnterior });

            // Se achou o mês anterior, o saldo inicial de agora é o saldo atual de lá
            const saldoTransferido = walletAnterior ? walletAnterior.resumo.saldo_atual : 0;

            const novaWallet = await Wallet.create({
                usuario_id,
                competencia,
                resumo: {
                    saldo_inicial: saldoTransferido,
                    saldo_atual: saldoTransferido // Começa o mês com o que sobrou
                }
            });

            res.status(201).json({
                mensagem: `Mês ${competencia} iniciado com saldo de R$ ${saldoTransferido}`,
                resumo: novaWallet.resumo
            });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao iniciar o mês.', detalhes: erro.message });
        }
    },

    // 2. ADICIONAR UMA NOVA TRANSAÇÃO
    async adicionarTransacao(req, res) {
        try {
            const { competencia, tipo, categoria, valor, descricao, tags } = req.body;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });

            if (!wallet) {
                return res.status(404).json({ erro: 'Mês não iniciado. Crie o mês primeiro antes de adicionar transações.' });
            }

            const novaTransacao = { tipo, categoria, valor, descricao, tags };
            wallet.transacoes.push(novaTransacao);

            // 🔄 Em vez de somar manualmente, chamamos o recálculo para garantir precisão absoluta
            atualizarResumo(wallet);

            await wallet.save();

            res.status(200).json({
                mensagem: 'Transação registrada com sucesso!',
                resumo_atualizado: wallet.resumo
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao registrar transação.', detalhes: erro.message });
        }
    },

    // 3. OBTER EXTRATO DO MÊS (Filtrando os Soft Deletes)
    // 3. OBTER EXTRATO DO MÊS (Agora com análise de gastos)
    async obterExtrato(req, res) {
        try {
            const { competencia } = req.params;
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });

            if (!wallet) {
                return res.status(404).json({ erro: 'Nenhum dado encontrado para este mês.' });
            }

            const transacoesVisiveis = wallet.transacoes.filter(t => !t.deletadoEm);

            // 📊 NOVO: Agrupa os gastos por categoria para facilitar a Tabela no Front-end
            const gastosPorCategoria = {};
            transacoesVisiveis.forEach(t => {
                if (t.tipo === 'despesa') {
                    if (!gastosPorCategoria[t.categoria]) gastosPorCategoria[t.categoria] = 0;
                    gastosPorCategoria[t.categoria] += t.valor;
                }
            });

            res.status(200).json({
                _id: wallet._id,
                competencia: wallet.competencia,
                resumo: wallet.resumo,
                limites_gastos: wallet.limites_gastos, // Manda a tabela de limites pro Front
                gastos_por_categoria: gastosPorCategoria, // Manda o quanto já gastou em cada uma
                transacoes: transacoesVisiveis
            });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar extrato.', detalhes: erro.message });
        }
    },
    // 4. DELETAR TRANSAÇÃO (NOVO: Soft Delete)
    async deletarTransacao(req, res) {
        try {
            const { competencia, transacaoId } = req.params; // Precisamos saber o mês e o ID da transação
            const usuario_id = req.usuarioId;

            const wallet = await Wallet.findOne({ usuario_id, competencia });
            if (!wallet) {
                return res.status(404).json({ erro: 'Mês não encontrado.' });
            }

            // O Mongoose permite buscar um subdocumento (transação) direto pelo ID dentro do array
            const transacao = wallet.transacoes.id(transacaoId);

            if (!transacao) {
                return res.status(404).json({ erro: 'Transação não encontrada neste mês.' });
            }

            if (transacao.deletadoEm) {
                return res.status(400).json({ erro: 'Esta transação já foi deletada.' });
            }

            // 💥 A MÁGICA DO SOFT DELETE ACONTECE AQUI
            transacao.deletadoEm = new Date();

            // Recalcula o resumo, o que automaticamente vai remover o valor dessa transação do saldo final
            atualizarResumo(wallet);

            await wallet.save();

            res.status(200).json({
                mensagem: 'Transação removida com sucesso!',
                resumo_atualizado: wallet.resumo
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao deletar transação.', detalhes: erro.message });
        }
    },
    // 5. DEFINIR TABELA DE GASTOS (Limites por Categoria)
    async definirLimites(req, res) {
        try {
            const { competencia } = req.params;
            const { limites } = req.body;
            const usuario_id = req.usuarioId;

            // Busca o mês do usuário
            const wallet = await Wallet.findOne({ usuario_id, competencia });

            if (!wallet) {
                return res.status(404).json({ erro: 'Mês não encontrado. Inicie o mês primeiro.' });
            }

            // Se o usuário mandou os limites, nós substituímos no banco
            // O Map do Mongoose aceita um objeto direto, ex: { "Delivery": 300, "Aluguel": 1500 }
            wallet.limites_gastos = limites;

            await wallet.save();

            res.status(200).json({
                mensagem: 'Tabela de gastos (Limites) atualizada com sucesso!',
                limites_gastos: wallet.limites_gastos
            });

        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao definir limites de gastos.', detalhes: erro.message });
        }
    }
};