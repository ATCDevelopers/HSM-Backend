import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import userRoutes from './routes/user.route.js';
import appointmentRoutes from './routes/appointment.route.js';
import { initTokenCleanupCron } from './services/token.service.js';
import vitalsRouter from "./routes/vital.route.js"
import consultationRouter from "./routes/consultation.route.js"; 
import departmentRouter from "./routes/department.route.js";
import labTestRouter from "./routes/labTest.route.js";
import medicineRouter from "./routes/medicine.route.js"; 
import prescriptionItemRouter from "./routes/prescriptionItem.route.js";
import authRouter from "./routes/auth.route.js"; 
import superAdminRouter from "./routes/superAdmin.route.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = fs.existsSync(path.resolve(__dirname, './.env'))
  ? path.resolve(__dirname, './.env')
  : path.resolve(process.cwd(), '.env');
import patientRoutes from "./routes/patient.route.js";
import { departmentAppointment } from './drizzle/schema.js';

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



app.use("/api/v1/", superAdminRouter);
app.use("/api/v1/auth", authRouter); 
app.use('/api/v1', userRoutes);
app.use('/api/v1', appointmentRoutes);
app.use("/api/v1", patientRoutes);
app.use("/api/v1", vitalsRouter);
app.use("/api/v1", consultationRouter);
app.use("/api/v1", departmentRouter)
app.use("/api/v1", labTestRouter);
app.use("/api/v1", medicineRouter);  
app.use("/api/v1", prescriptionItemRouter);


// Initialize node-cron token cleanup job
initTokenCleanupCron();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

