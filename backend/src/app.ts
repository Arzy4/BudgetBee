import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // Add your deployed frontend URL here later
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

export default app;