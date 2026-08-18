import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import userRoutes from './routes/user.route.js';
import { initTokenCleanupCron } from './services/token.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = fs.existsSync(path.resolve(__dirname, './.env'))
  ? path.resolve(__dirname, './.env')
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/v1', userRoutes);

// Initialize node-cron token cleanup job
initTokenCleanupCron();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

