import mongoose from 'mongoose';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
