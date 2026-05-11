const express = require('express');
const authMiddleware = require('../middlewares/auth');
const ctrl = require('../controllers/subscriptionController');

const router = express.Router();
router.use(authMiddleware);

router.get('/',           ctrl.listar);
router.post('/',          ctrl.criar);
router.put('/:id',        ctrl.editar);
router.delete('/:id',     ctrl.deletar);
router.post('/:id/lancar', ctrl.lancar);

module.exports = router;
