import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowforge_db';
    // Disable command buffering so operations fail fast if DB isn't connected instead of hanging 10 seconds
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2500 // 2.5 second timeout
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[MongoDB] CRITICAL ERROR: Connection failed: ${error.message}`);
      console.error(`[MongoDB] Refusing to start backend server without a healthy database connection in production.`);
      process.exit(1);
    } else {
      console.warn(`[MongoDB] Connection unavailable (${error.message}). Running in In-Memory Mode.`);
    }
  }
}

export function isDBConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}
