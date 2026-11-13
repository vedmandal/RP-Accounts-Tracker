import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    expenseType: { type: String, enum: ['shop', 'home'] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, type: 1 }, { unique: true });

categorySchema.pre('validate', function () {
  if (this.type === 'expense' && !this.expenseType) this.invalidate('expenseType', 'Expense categories need an expense type (shop/home)');
  if (this.type === 'income') this.expenseType = undefined;
});

export default mongoose.model('Category', categorySchema);
