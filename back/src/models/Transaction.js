const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referência ao seu model de Usuário
        required: true
    },
    descricao: {
        type: String,
        required: true,
        trim: true
    },
    valor: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        enum: ['receita', 'despesa'], // Só aceita esses dois valores
        required: true
    },
    categoria: {
        type: String,
        default: 'Outros'
    },
    data: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);