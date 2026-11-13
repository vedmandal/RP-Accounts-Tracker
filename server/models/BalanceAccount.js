import mongoose from 'mongoose';
import { ACCOUNTS } from '../config/constants.js';
import { paiseTransform } from '../utils/money.js';

// Only the opening balance is stored. Current balance is always derived from transactions and
// transfers, so editing or deleting a transaction can never leave a balance inconsistent.
const balanceAccountSchema = new mongoose.Schema(
  {
    accountType: { type: String, enum: ACCOUNTS, required: true, unique: true },
    openingBalance: { type: Number, default: 0 }, // paise
    openingDate: { type: String, default: '1970-01-01' }, // transactions from this dateKey onwards count
    history: [
      {
        openingBalance: Number,
        openingDate: String,
        setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        setAt: Date,
      },
    ],
  },
  { timestamps: true, toJSON: { transform: paiseTransform('openingBalance') } }
);

export default mongoose.model('BalanceAccount', balanceAccountSchema);
