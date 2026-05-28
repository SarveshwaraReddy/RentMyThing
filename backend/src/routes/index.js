import express from "express";
import authRoutes from "./auth.js";
import itemRoutes from "./itemRoutes.js";
import rentalRoutes from "./rentalRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/items", itemRoutes);
router.use("/rentals", rentalRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
