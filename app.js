import "dotenv/config";
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { fileURLToPath } from "url";
import cors from "cors";
import './services/redis.service.js';

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import provinceRoutes from "./routes/provinceRoutes.js";
import hotspotRoutes from "./routes/hostpotRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import badgeRoutes from "./routes/badgeRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import profile from "./routes/profileRoutes.js";

// swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cors configuration

app.use(cors({
  origin: true, // Reflect request origin (biar aman di Vercel)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));


// Handle Preflight Options
app.options('*', cors());


app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const swaggerOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
  ],
};

// RUTE DOKUMENTASI SWAGGER
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API REKALOKA" });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/provinces", provinceRoutes);
app.use("/api/hotspots", hotspotRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/profile", profile);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  // Kirim error sebagai JSON
  res.json({
    error: {
      message: err.message,
      status: err.status,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server Rekaloka jalan di http://localhost:${PORT}`);
  console.log(`📄 Dokumentasi Swagger: http://localhost:${PORT}/api-docs`);
});

export default app; // Ganti ke export default
