// 1. Fixed: Added explicit .js extensions for NodeNext complia





import express from 'express';
import cors from 'cors';
// Fixed: Explicit .js extension for your routes file
import tripRoutes from './routes/tripRoutes.js'; 

const app = express();

app.use(cors()); 
app.use(express.json()); 

// Mount your tourism API routes
app.use('/api', tripRoutes);

// FIXED: This line must be exactly 'export default app'
export default app; 


import { connectDB } from './config/db.js'; 

const PORT = 5000;

// 2. Logic: Attempt to connect to the database first
connectDB()
  .then(() => {
    // 3. Only start listening for traffic if the database connection succeeds
    app.listen(PORT, () => {
      console.log(`Server compiled and running on http://localhost:${PORT}`);
      console.log(` API Routes ready at http://localhost:${PORT}/api/trips`);
    });
  })
  .catch((error) => {
    console.error("Server failed to start due to database error:", error);
    process.exit(1);
  });
