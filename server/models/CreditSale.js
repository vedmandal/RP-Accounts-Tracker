import mongoose from 'mongoose';
import { paiseTransform } from '../utils/money.js';

const creditSaleSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    totalAmount: { type: Number, required: true, min: 1 }, // paise
    paidAmount: { type: Number, default: 0 }, // paise, always changed with $inc together with a CreditPayment
    saleDate: { type: Date, required: true },
    dateKey: { type: String, required: true },
    description: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: paiseTransform('totalAmount', 'paidAmount', 'pendingAmount') },
  }
);

creditSaleSchema.virtual('pendingAmount').get(function () {
  if (typeof this.totalAmount !== 'number' || typeof this.paidAmount !== 'number') return undefined;
  return this.totalAmount - this.paidAmount;
});

creditSaleSchema.virtual('status').get(function () {
  if (typeof this.totalAmount !== 'number') return undefined;
  if (this.paidAmount <= 0) return 'unpaid';
  return this.paidAmount >= this.totalAmount ? 'paid' : 'partial';
});

creditSaleSchema.index({ customer: 1, dateKey: -1 });
creditSaleSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

export default mongoose.model('CreditSale', creditSaleSchema);
