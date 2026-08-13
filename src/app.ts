import express from 'express'
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';


dotenv.config();

const app = express();
const port = process.env.PORT || 5001

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true
}

app.use(express.json());
app.use(cors(corsOptions));

app.use('/api/v1', userRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
