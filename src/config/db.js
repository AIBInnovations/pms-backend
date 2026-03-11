import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(env.mongoUri);
      logger.info('MongoDB connected successfully');
      return;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries === MAX_RETRIES) {
        logger.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

export default connectDB;
