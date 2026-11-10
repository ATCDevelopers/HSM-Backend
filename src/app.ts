import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import appointmentRoutes from './routes/appointment.route.js';
import { initTokenCleanupCron } from './services/token.service.js';
import vitalsRouter from "./routes/vital.route.js"
import consultationRouter from "./routes/consultation.route.js"; 
import departmentRouter from "./routes/department.route.js";
import testResultRouter from './routes/labTestResults.route.js';
import medicineRouter from "./routes/medicine.route.js"; 
import prescriptionItemRouter from "./routes/prescriptionItem.route.js";
import morgan from 'morgan'
import loginRoutes from './routes/login.route.js';
import patientRoutes from "./routes/patient.route.js";
import labTestConfigRoutes from "./routes/labTestConfig.route.js";
import prescriptionRouter from "./routes/prescription.route.js";
import invoiceRouter from "./routes/invoice.routes.js";
import invoiceItemRouter from "./routes/invoiceItem.route.js";
import statusRouter from "./routes/status.route.js";
import billingRouter from "./routes/billing.route.js";
dotenv.config();

const app = express();
const port = process.env.PORT;

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true
};

// Throttle credential guessing per IP. Limited to login so staff sharing one hospital IP aren't blocked from normal use.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));




app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1', userRoutes);
app.use('/api/v1', loginRoutes);
app.use('/api/v1', appointmentRoutes);
app.use("/api/v1", patientRoutes);
app.use("/api/v1", vitalsRouter);
app.use("/api/v1", consultationRouter);
app.use("/api/v1", departmentRouter)

app.use("/api/v1", medicineRouter);  
app.use("/api/v1", prescriptionItemRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/invoice-items", invoiceItemRouter);
app.use("/api/v1", statusRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/labtest", labTestConfigRoutes);
app.use('/api/v1/test-results', testResultRouter);

// Controllers that call next(error) (department, medicine, invoice, ...) land here; without it Express answers with an HTML page.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 400;
  res.status(status).json({ success: false, error: err.message || 'Request failed' });
});

// Initialize node-cron token cleanup job
initTokenCleanupCron();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

