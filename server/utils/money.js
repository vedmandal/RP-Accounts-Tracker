// All money is stored as integer paise (₹1 = 100 paise) to avoid floating point errors.
export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
export const toRupees = (paise) => Math.round(Number(paise) || 0) / 100;

// Mongoose toJSON transform: converts the given paise fields back to rupees for API output.
export const paiseTransform =
  (...fields) =>
  (doc, ret) => {
    for (const f of fields) {
      if (typeof ret[f] === 'number') ret[f] = ret[f] / 100;
    }
    delete ret.__v;
    delete ret.id;
    return ret;
  };
