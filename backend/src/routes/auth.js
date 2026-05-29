import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateRegister, validateLogin } from "../validators/inputValidator.js";

const router = express.Router();

router.post("/register", authLimiter, validateRegister, registerUser);
router.post("/login", authLimiter, validateLogin, loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);

export default router;
