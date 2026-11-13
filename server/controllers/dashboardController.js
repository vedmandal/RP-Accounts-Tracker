import asyncHandler from '../utils/asyncHandler.js';
import * as service from '../services/dashboardService.js';

export const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getSummary() });
});

export const recent = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
  res.json({ success: true, data: await service.getRecent(limit) });
});
