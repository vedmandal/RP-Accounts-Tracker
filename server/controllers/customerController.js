import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/customerService.js';

export const list = asyncHandler(async (req, res) => res.json({ success: true, ...(await service.listCustomers(req.query)) }));
export const getOne = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getCustomer(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.createCustomer(req.body) }));
export const update = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.updateCustomer(req.params.id, req.body) })
);
export const remove = asyncHandler(async (req, res) => {
  await service.deleteCustomer(req.params.id);
  res.json({ success: true, message: 'Customer deleted' });
});
