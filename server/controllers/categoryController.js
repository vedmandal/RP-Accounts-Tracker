import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  const data = await Category.find(filter).sort({ type: 1, expenseType: 1, name: 1 });
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const { name, type, expenseType } = req.body;
  const category = await Category.create({ name, type, expenseType });
  res.status(201).json({ success: true, data: category });
});

export const update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (category.isDefault) throw new ApiError(400, 'Default categories cannot be edited');

  const oldName = category.name;
  const oldExpenseType = category.expenseType;
  if (req.body.name) category.name = req.body.name;
  if (category.type === 'expense' && req.body.expenseType) category.expenseType = req.body.expenseType;
  await category.save();

  // Keep existing transactions consistent with the renamed / re-typed category.
  const set = {};
  if (category.name !== oldName) set.category = category.name;
  if (category.type === 'expense' && category.expenseType !== oldExpenseType) set.expenseType = category.expenseType;
  if (Object.keys(set).length) await Transaction.updateMany({ type: category.type, category: oldName }, { $set: set });

  res.json({ success: true, data: category });
});

export const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (category.isDefault) throw new ApiError(400, 'Default categories cannot be deleted');
  if (await Transaction.exists({ type: category.type, category: category.name })) {
    throw new ApiError(409, 'This category is used by existing transactions');
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});
