import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/reportService.js';

export const daily = asyncHandler(async (req, res) => res.json({ success: true, data: await service.dailyReport(req.query) }));
export const monthly = asyncHandler(async (req, res) => res.json({ success: true, data: await service.monthlyReport(req.query) }));
export const yearly = asyncHandler(async (req, res) => res.json({ success: true, data: await service.yearlyReport(req.query) }));
export const custom = asyncHandler(async (req, res) => res.json({ success: true, data: await service.customReport(req.query) }));
