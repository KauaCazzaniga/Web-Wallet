const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/auth'); // O segurança que criamos

// 🛡️ Protege todas as rotas de carteira abaixo desta linha
router.use(authMiddleware);

// 1. INICIAR UM NOVO MÊS (Criar o Balde)
router.post('/iniciar', walletController.iniciarMes);

// 2. ADICIONAR UMA NOVA TRANSAÇÃO
router.post('/transacao', walletController.adicionarTransacao);

// 3. OBTER EXTRATO DO MÊS
// Note que adicionamos o /:competencia na URL para o controller conseguir buscar (ex: /api/wallet/extrato/2026-03)
router.get('/extrato/:competencia', walletController.obterExtrato);

// 4. DELETAR TRANSAÇÃO (Soft Delete)
// A URL agora pede a competencia e o ID da transação para o controller achar o dado exato
router.delete('/:competencia/transacao/:transacaoId', walletController.deletarTransacao);

// 5. DEFINIR LIMITES DE GASTOS (Tabela de Gastos)
router.put('/:competencia/limites', walletController.definirLimites);

module.exports = router;