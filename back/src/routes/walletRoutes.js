const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/auth');

// 🛡️ Protege todas as rotas de carteira abaixo desta linha
router.use(authMiddleware);

// --- 🚀 ROTA DO DASHBOARD (Resumo para o Front) ---
// Esta rota é a que o Dashboard do React vai chamar no useEffect
router.get('/dashboard', walletController.obterDashboard);

// 1. INICIAR UM NOVO MÊS (Criar o Balde)
router.post('/iniciar', walletController.iniciarMes);

// 2. ADICIONAR UMA NOVA TRANSAÇÃO
router.post('/transacao', walletController.adicionarTransacao);

// 3. OBTER EXTRATO DO MÊS
router.get('/extrato/:competencia', walletController.obterExtrato);

// 4. DELETAR TRANSAÇÃO (Soft Delete)
router.delete('/:competencia/transacao/:transacaoId', walletController.deletarTransacao);

// 5. DEFINIR LIMITES DE GASTOS (Tabela de Gastos)
router.put('/:competencia/limites', walletController.definirLimites);

module.exports = router;