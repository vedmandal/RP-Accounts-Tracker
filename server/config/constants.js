export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

export const ACCOUNTS = ['cash', 'upi', 'bank'];

// Which payment methods feed which balance account ("Other" is treated as bank).
export const ACCOUNT_METHODS = {
  cash: ['Cash'],
  upi: ['UPI'],
  bank: ['Bank Transfer', 'Other'],
}; 

export const CREDIT_COLLECTION_CATEGORY = 'Credit Collection';

export const DEFAULT_CATEGORIES = [
  ...['Stationery Sales', 'Paper Sales', 'Office Supplies', 'Wedding Card Materials', CREDIT_COLLECTION_CATEGORY, 'Other'].map(
    (name) => ({ name, type: 'income' })
  ),
  ...[
    'Shop Rent',
    'Staff Salary',
    'Electricity Bill',
    'Internet Bill',
    'Transportation',
    'Stationery Purchase',
    'Inventory Purchase',
    'Maintenance',
    'Other Shop Expenses',
  ].map((name) => ({ name, type: 'expense', expenseType: 'shop' })),
  ...['Home Rent', 'Household Expenses', 'Personal Expenses', 'Other Home Expenses'].map((name) => ({
    name,
    type: 'expense',
    expenseType: 'home',
  })),
];
