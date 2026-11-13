import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/balanceService.js';

export const getBalances = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getBalances() }));
export const setOpening = asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.setOpeningBalance(req.body, req.user._id) })
);
export const transfer = asyncHandler(async (req, res) =>
  res.status(201).json({ success: true, data: await service.createTransfer(req.body, req.user._id) })
);
export const history = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getHistory() }));
