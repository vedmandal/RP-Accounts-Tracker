import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

export const setupStatus = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.json({ success: true, data: { needsSetup: count === 0 } });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'Email is already registered');
  const isFirst = (await User.countDocuments()) === 0;
  const user = await User.create({ name, email, password, role: isFirst ? 'admin' : role || 'staff' });
  res.status(201).json({ success: true, data: { token: sign(user._id), user: publicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ success: true, data: { token: sign(user._id), user: publicUser(user) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});
