const mongoose = require('mongoose');

const transacaoSchema = new mongoose.Schema({
    data_hora: { type: Date, default: Date.now },
    tipo: { type: String, enum: ['receita', 'despesa'], required: true },
    categoria: { type: String, required: true },
    valor: { type: Number, required: true },
    descricao: { type: String, required: true },
    tags: [{ type: String }],
    deletadoEm: { type: Date, default: null }
});

const walletSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Conecta diretamente com o modelo de Usuário que acabamos de criar
    },
    competencia: {
        type: String,
        required: true
    },
    resumo: {
        saldo_inicial: { type: Number, default: 0 },
        total_receitas: { type: Number, default: 0 },
        total_despesas: { type: Number, default: 0 },
        saldo_atual: { type: Number, default: 0 }
    },
    transacoes: [transacaoSchema],
    limites_gastos: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);
