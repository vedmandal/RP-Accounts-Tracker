import { validationResult } from 'express-validator';

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, msg: e.msg }));
  return res.status(400).json({ success: false, message: errors[0].msg, errors });
};

export default validate;
