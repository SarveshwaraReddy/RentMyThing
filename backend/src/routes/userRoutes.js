import express from "express";
import {
  getUserProfileById,
  updateUserProfile,
} from "../controllers/authController.js";
import { getUserReviews } from "../controllers/reviewController.js";
import protect from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

// Allow authenticated users to view profiles and reviews
router.use(protect);

router.put("/profile", uploadImages("profileImage", 1), updateUserProfile);
router.route("/:id").get(getUserProfileById);
router.route("/:id/reviews").get(getUserReviews);

export default router;
