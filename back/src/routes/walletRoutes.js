const express = require('express');

const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/auth');
const { verifyTransactionOwnership } = require('../middlewares/resourceOwnership');

const router = express.Router();

router.use(authMiddleware);

router.get('/meses', walletController.listarMeses);
router.get('/total-investido', walletController.totalInvestido);
router.get('/dashboard', walletController.obterDashboard);
router.post('/iniciar', walletController.iniciarMes);
router.post('/transacao', walletController.adicionarTransacao);
router.post('/transacoes/importar', walletController.importarTransacoes);
router.get('/extrato/:competencia', walletController.obterExtrato);
router.delete('/transacao/:transacaoId', verifyTransactionOwnership, walletController.deletarTransacao);
router.delete('/:competencia/transacao/:transacaoId', verifyTransactionOwnership, walletController.deletarTransacao);
router.delete('/:competencia/transacoes', walletController.deletarTodasTransacoes);
router.put('/:competencia/limites', walletController.definirLimites);

module.exports = router;
