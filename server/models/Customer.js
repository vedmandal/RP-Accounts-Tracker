import mongoose from 'mongoose';
import { paiseTransform } from '../utils/money.js';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    totalCredit: { type: Number, default: 0 }, // paise
    totalPaid: { type: Number, default: 0 }, // paise
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: paiseTransform('totalCredit', 'totalPaid', 'outstandingBalance') },
  }
);

customerSchema.virtual('outstandingBalance').get(function () {
  if (typeof this.totalCredit !== 'number' || typeof this.totalPaid !== 'number') return undefined;
  return this.totalCredit - this.totalPaid;
});

customerSchema.index({ name: 1 });

export default mongoose.model('Customer', customerSchema);
