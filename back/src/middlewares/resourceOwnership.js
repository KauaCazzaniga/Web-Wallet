// Middleware: resourceOwnership
// Responsabilidade: verificar que o recurso identificado por :transacaoId pertence ao usuário autenticado
// Depende de: authMiddleware (req.usuarioId deve estar preenchido antes)

const Wallet = require('../models/Wallet');

/**
 * Verifica que a transação referenciada em req.params.transacaoId existe e pertence ao
 * usuário autenticado (req.usuarioId). Em caso positivo, anexa req.wallet para que o
 * controller reutilize o documento sem uma segunda consulta ao banco.
 *
 * @returns {void} chama next() ou responde 403/404
 */
const verifyTransactionOwnership = async (req, res, next) => {
    try {
        const { transacaoId } = req.params;
        const usuario_id = req.usuarioId;

        const wallet = await Wallet.findOne({
            usuario_id,
            'transacoes._id': transacaoId,
        });

        if (!wallet) {
            return res.status(403).json({ erro: 'Acesso negado.' });
        }

        req.wallet = wallet;
        return next();
    } catch {
        return res.status(500).json({ erro: 'Erro ao verificar propriedade do recurso.' });
    }
};

module.exports = { verifyTransactionOwnership };
