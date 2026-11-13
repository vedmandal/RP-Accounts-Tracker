import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/transactionService.js';

export const create = asyncHandler(async (req, res) => {
  const { transaction, duplicate } = await service.createTransaction(req.body, req.user._id);
  res.status(duplicate ? 200 : 201).json({ success: true, data: transaction, duplicate });
});

export const list = asyncHandler(async (req, res) => {
  const result = await service.listTransactions(req.query);
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getTransaction(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateTransaction(req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteTransaction(req.params.id);
  res.json({ success: true, message: 'Transaction deleted' });
});

export const day = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getDay(req.params.dateKey) });
});

export const calendar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getCalendarMonth(Number(req.query.year), Number(req.query.month)) });
});
