import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/creditService.js';

export const createSale = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.createSale(req.body, req.user._id) })
);
export const listSales = asyncHandler(async (req, res) => res.json({ success: true, ...(await service.listSales(req.query)) }));
export const addPayment = asyncHandler(async (req, res) => {
  const result = await service.addPayment(req.body, req.user._id);
  res.status(result.duplicate ? 200 : 201).json({ success: true, data: result });
});
export const removePayment = asyncHandler(async (req, res) => {
  await service.deletePayment(req.params.id);
  res.json({ success: true, message: 'Payment reversed' });
});
export const customerCredit = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.customerCredit(req.params.id) })
);
export const summary = asyncHandler(async (req, res) => res.json({ success: true, data: await service.creditSummary() }));
