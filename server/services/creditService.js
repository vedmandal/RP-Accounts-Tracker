import Customer from '../models/Customer.js';
import CreditSale from '../models/CreditSale.js';
import CreditPayment from '../models/CreditPayment.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import { toPaise, toRupees } from '../utils/money.js';
import { keyToDate, todayKey } from '../utils/dates.js';
import { withTransaction, sessionOpts } from '../utils/withTransaction.js';
import { CREDIT_COLLECTION_CATEGORY } from '../config/constants.js';

/*
 * Rules that prevent double counting:
 *  - A credit sale creates NO income. It only raises the customer's outstanding balance.
 *  - Every rupee actually received (even the part paid at sale time) is a CreditPayment, and each
 *    CreditPayment creates exactly ONE income transaction (source "credit_payment").
 *  - pendingAmount = totalAmount - paidAmount (derived, never stored separately).
 */
const recordPayment = async ({ sale, customer, amount, method, dateKey, note, isInitial, userId, idempotencyKey }, session) => {
  const o = sessionOpts(session);

  // Atomic guard: never allow paid > total, even with two simultaneous requests.
  const updated = await CreditSale.findOneAndUpdate(
    { _id: sale._id, $expr: { $lte: [{ $add: ['$paidAmount', amount] }, '$totalAmount'] } },
    { $inc: { paidAmount: amount } },
    { new: true, ...o }
  );
  if (!updated) throw new ApiError(400, 'Payment exceeds the pending amount for this sale');

  const [txn] = await Transaction.create(
    [
      {
        type: 'income',
        amount,
        category: CREDIT_COLLECTION_CATEGORY,
        paymentMethod: method,
        customerName: customer.name,
        customer: customer._id,
        description: isInitial ? 'Paid at time of credit sale' : 'Credit payment received',
        dateKey,
        transactionDate: keyToDate(dateKey),
        source: 'credit_payment',
        createdBy: userId,
      },
    ],
    o
  );

  const [payment] = await CreditPayment.create(
    [
      {
        customer: customer._id,
        creditSale: sale._id,
        amount,
        paymentMethod: method,
        paymentDate: keyToDate(dateKey),
        dateKey,
        transaction: txn._id,
        isInitial: Boolean(isInitial),
        note: note || undefined,
        createdBy: userId,
        idempotencyKey: idempotencyKey || undefined,
      },
    ],
    o
  );

  await Transaction.updateOne({ _id: txn._id }, { creditPayment: payment._id }, o);
  await Customer.updateOne({ _id: customer._id }, { $inc: { totalPaid: amount } }, o);
  return payment;
};

export const createSale = async (data, userId) => {
  if (data.idempotencyKey) {
    const existing = await CreditSale.findOne({ idempotencyKey: data.idempotencyKey });
    if (existing) return existing.populate('customer', 'name phone');
  }
  const customer = await Customer.findById(data.customer);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const total = toPaise(data.totalAmount);
  const paid = toPaise(data.paidAmount || 0);
  if (paid > total) throw new ApiError(400, 'Paid amount cannot be more than the sale total');
  const dateKey = data.saleDate || todayKey();

  const saleId = await withTransaction(async (session) => {
    const o = sessionOpts(session);
    const [sale] = await CreditSale.create(
      [
        {
          customer: customer._id,
          totalAmount: total,
          paidAmount: 0,
          saleDate: keyToDate(dateKey),
          dateKey,
          description: data.description || undefined,
          createdBy: userId,
          idempotencyKey: data.idempotencyKey || undefined,
        },
      ],
      o
    );
    await Customer.updateOne({ _id: customer._id }, { $inc: { totalCredit: total } }, o);
    if (paid > 0) {
      await recordPayment(
        { sale, customer, amount: paid, method: data.paymentMethod, dateKey, isInitial: true, userId },
        session
      );
    }
    return sale._id;
  });

  return CreditSale.findById(saleId).populate('customer', 'name phone');
};

export const addPayment = async (data, userId) => {
  if (data.idempotencyKey) {
    const existing = await CreditPayment.findOne({ idempotencyKey: data.idempotencyKey });
    if (existing) return { payment: existing, sale: await CreditSale.findById(existing.creditSale), duplicate: true };
  }
  const sale = await CreditSale.findById(data.creditSale);
  if (!sale) throw new ApiError(404, 'Credit sale not found');
  const customer = await Customer.findById(sale.customer);
  const amount = toPaise(data.amount);
  if (amount > sale.totalAmount - sale.paidAmount) throw new ApiError(400, 'Payment exceeds the pending amount for this sale');

  const dateKey = data.paymentDate || todayKey();
  try {
    const payment = await withTransaction((session) =>
      recordPayment(
        { sale, customer, amount, method: data.paymentMethod, dateKey, note: data.note, isInitial: false, userId, idempotencyKey: data.idempotencyKey },
        session
      )
    );
    return { payment, sale: await CreditSale.findById(sale._id).populate('customer', 'name phone'), duplicate: false };
  } catch (err) {
    if (err.code === 11000 && data.idempotencyKey) {
      const existing = await CreditPayment.findOne({ idempotencyKey: data.idempotencyKey });
      if (existing) return { payment: existing, sale: await CreditSale.findById(existing.creditSale), duplicate: true };
    }
    throw err;
  }
};

export const deletePayment = async (id) => {
  const payment = await CreditPayment.findById(id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  await withTransaction(async (session) => {
    const o = sessionOpts(session);
    await Transaction.deleteOne({ _id: payment.transaction }, o);
    await CreditSale.updateOne({ _id: payment.creditSale }, { $inc: { paidAmount: -payment.amount } }, o);
    await Customer.updateOne({ _id: payment.customer }, { $inc: { totalPaid: -payment.amount } }, o);
    await CreditPayment.deleteOne({ _id: payment._id }, o);
  });
};

export const listSales = async (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const filter = {};
  if (query.customer) filter.customer = query.customer;
  if (query.status === 'pending') filter.$expr = { $gt: ['$totalAmount', '$paidAmount'] };
  if (query.status === 'paid') filter.$expr = { $lte: ['$totalAmount', '$paidAmount'] };

  const [data, total] = await Promise.all([
    CreditSale.find(filter)
      .sort({ dateKey: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'name phone'),
    CreditSale.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

export const customerCredit = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  const [sales, payments] = await Promise.all([
    CreditSale.find({ customer: id }).sort({ dateKey: -1, createdAt: -1 }),
    CreditPayment.find({ customer: id }).sort({ dateKey: -1, createdAt: -1 }).populate('creditSale', 'description dateKey'),
  ]);
  return { customer, sales, payments };
};

export const creditSummary = async () => {
  const [agg] = await Customer.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $subtract: ['$totalCredit', '$totalPaid'] } },
        customers: { $sum: { $cond: [{ $gt: [{ $subtract: ['$totalCredit', '$totalPaid'] }, 0] }, 1, 0] } },
      },
    },
  ]);
  return { totalPending: toRupees(agg?.total || 0), customersWithDues: agg?.customers || 0 };
};
