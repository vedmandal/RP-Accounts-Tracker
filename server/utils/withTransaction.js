import mongoose from 'mongoose';

// Runs `work(session)` inside a MongoDB transaction (atomic). MongoDB Atlas supports this.
// A standalone local MongoDB has no transaction support, so we fall back to running without one.
const unsupported = (err) =>
  err?.code === 20 || /Transaction numbers are only allowed|replica set/i.test(err?.message || '');

export const sessionOpts = (session) => (session ? { session } : {});

export const withTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (unsupported(err)) return work(null);
    throw err;
  } finally {
    session.endSession();
  }
};
