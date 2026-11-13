import Customer from '../models/Customer.js';
import CreditSale from '../models/CreditSale.js';
import ApiError from '../utils/ApiError.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listCustomers = async (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 10, 1), 1000);
  const filter = {};
  if (q.search && q.search.trim()) {
    const re = new RegExp(escapeRegex(q.search.trim()), 'i');
    filter.$or = [{ name: re }, { phone: re }];
  }
  if (q.hasDues === 'true') filter.$expr = { $gt: ['$totalCredit', '$totalPaid'] };

  const [data, total] = await Promise.all([
    Customer.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Customer.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

export const getCustomer = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  return customer;
};

export const createCustomer = (data) => Customer.create({ name: data.name, phone: data.phone, address: data.address });

export const updateCustomer = async (id, data) => {
  const customer = await getCustomer(id);
  customer.name = data.name ?? customer.name;
  customer.phone = data.phone ?? customer.phone;
  customer.address = data.address ?? customer.address;
  await customer.save();
  return customer;
};

export const deleteCustomer = async (id) => {
  const customer = await getCustomer(id);
  const hasSales = await CreditSale.exists({ customer: id });
  if (hasSales) throw new ApiError(409, 'This customer has credit history and cannot be deleted');
  await customer.deleteOne();
};
