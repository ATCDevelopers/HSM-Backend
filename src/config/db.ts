// 1. Fixed: Change 'require' to 'import' for TypeScript
// 2. Fixed: Spelled 'mongoose' correctly
import mongoose from 'mongoose'; 

export const connectDB = async (): Promise<void> => {
  try {
    // Replace this string later with a secure .env variable
    const mongoURI = "mongodb+srv://danieltillya1_db_user:MjpBkxSov8YBXhDD@cluster0.jw7ab8p.mongodb.net";
    
    await mongoose.connect(mongoURI);
    console.log(" MongoDB Connected Successfully!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // Stop the server if database fails
  }
};
