import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../config/constants.js';
import { paiseTransform } from '../utils/money.js';

const creditPaymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    creditSale: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditSale', required: true },
    amount: { type: Number, required: true, min: 1 }, // paise
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentDate: { type: Date, required: true },
    dateKey: { type: String, required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    isInitial: { type: Boolean, default: false }, // amount paid at the time of the sale
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String },
  },
  { timestamps: true, toJSON: { transform: paiseTransform('amount') } }
);

creditPaymentSchema.index({ customer: 1, dateKey: -1 });
creditPaymentSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

export default mongoose.model('CreditPayment', creditPaymentSchema);
