import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not authorized, token missing');
  const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  req.user = user;
  next();
});

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Admin access required'));
  next();
};

// The very first account can be created freely. After that only a logged-in admin can add users.
export const registerGuard = asyncHandler(async (req, res, next) => {
  const count = await User.countDocuments();
  if (count === 0) return next();
  protect(req, res, (err) => {
    if (err) return next(err);
    adminOnly(req, res, next);
  });
});
