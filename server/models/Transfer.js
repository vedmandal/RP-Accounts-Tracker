import mongoose from 'mongoose';
import { ACCOUNTS } from '../config/constants.js';
import { paiseTransform } from '../utils/money.js';

// Transfers move money between accounts. They are NOT income or expenses.
const transferSchema = new mongoose.Schema(
  {
    fromAccount: { type: String, enum: ACCOUNTS, required: true },
    toAccount: { type: String, enum: ACCOUNTS, required: true },
    amount: { type: Number, required: true, min: 1 }, // paise
    transferDate: { type: Date, required: true },
    dateKey: { type: String, required: true },
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    idempotencyKey: { type: String },
  },
  { timestamps: true, toJSON: { transform: paiseTransform('amount') } }
);

transferSchema.index({ fromAccount: 1, dateKey: 1 });
transferSchema.index({ toAccount: 1, dateKey: 1 });
transferSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

export default mongoose.model('Transfer', transferSchema);
