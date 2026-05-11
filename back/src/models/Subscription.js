const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        usuario_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        nome: { type: String, required: true, trim: true },
        categoria: { type: String, required: true },
        valor: { type: Number, required: true, min: 0.01 },
        billing_cycle: { type: String, enum: ['mensal', 'anual'], required: true },
        next_charge_date: { type: Date, required: true },
        status: { type: String, enum: ['ativo', 'pausado', 'cancelado'], default: 'ativo' },
        payment_method: { type: String, default: '' },
        ativo: { type: Boolean, default: true },
    },
    { timestamps: true },
);

subscriptionSchema.index({ usuario_id: 1, ativo: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
