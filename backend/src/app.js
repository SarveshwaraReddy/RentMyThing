import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import xssClean from "xss-clean";
import path from "path";
import routes from "./routes/index.js";

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(xssClean());
app.use(authLimiter);

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "RentMyThing backend is running" });
});

export default app;
