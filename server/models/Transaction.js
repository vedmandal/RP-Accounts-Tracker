import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../config/constants.js';
import { paiseTransform } from '../utils/money.js';

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 1 }, // paise
    category: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    customerName: { type: String, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    expenseName: { type: String, trim: true },
    paidTo: { type: String, trim: true },
    description: { type: String, trim: true },
    transactionDate: { type: Date, required: true },
    dateKey: { type: String, required: true }, // "YYYY-MM-DD" local shop date
    expenseType: { type: String, enum: ['shop', 'home'] },
    source: { type: String, enum: ['manual', 'credit_payment'], default: 'manual' },
    creditPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditPayment' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String },
  },
  { timestamps: true, toJSON: { transform: paiseTransform('amount') } }
);

transactionSchema.index({ dateKey: 1, type: 1 });
transactionSchema.index({ paymentMethod: 1, dateKey: 1 });
transactionSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

export default mongoose.model('Transaction', transactionSchema);
