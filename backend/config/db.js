import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.log('⚠️ MONGO_URI is not defined in environment variables.');
    console.log('🔌 Activating Dual-Mode Database: persistent File-based Mock DB Enabled.');
    process.env.USE_MOCK_DB = 'true';
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log('✅ Connected to MongoDB server.');
    process.env.USE_MOCK_DB = 'false';
  } catch (err) {
    console.warn(`❌ MongoDB connection failed: ${err.message}`);
    console.log('🔌 Activating Dual-Mode Database: persistent File-based Mock DB Enabled.');
    process.env.USE_MOCK_DB = 'true';
  }
};
