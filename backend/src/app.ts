import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import transactionRoutes from "./modules/transactions/transaction.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import budgetRoutes from './modules/budgets/budget.routes.js'

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://budget-bee-frontend-ten.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);

export default app;