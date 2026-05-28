import express from "express";
import {
  requestRental,
  getUserRentals,
  getRentalById,
  approveRental,
  verifyOTP,
  completeRental,
  rejectRental,
} from "../controllers/rentalController.js";
import { getChatHistory } from "../controllers/messageController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// Apply auth protection middleware globally to all rental routes
router.use(protect);

router.route("/")
  .post(requestRental)
  .get(getUserRentals);

router.route("/:id")
  .get(getRentalById);

router.route("/:id/messages")
  .get(getChatHistory);

router.route("/:id/approve")
  .post(approveRental);

router.route("/:id/reject")
  .post(rejectRental);

router.route("/:id/verify-otp")
  .post(verifyOTP);

router.route("/:id/complete")
  .post(completeRental);

export default router;
