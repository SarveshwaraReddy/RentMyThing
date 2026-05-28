import express from "express";
import { getUserProfileById } from "../controllers/authController.js";
import { getUserReviews } from "../controllers/reviewController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// Allow authenticated users to view profiles and reviews
router.use(protect);

router.route("/:id").get(getUserProfileById);
router.route("/:id/reviews").get(getUserReviews);

export default router;
