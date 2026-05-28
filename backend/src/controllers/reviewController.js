import Review from "../models/Review.js";
import Rental from "../models/Rental.js";
import User from "../models/User.js";

/**
 * @desc    Submit a review for a completed rental
 * @route   POST /api/rentals/:id/rate
 * @access  Private
 */
export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const rentalId = req.params.id;
    const reviewerId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please provide a rating between 1 and 5" });
    }

    // Find the rental transaction
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: "Rental transaction not found" });
    }

    // 1. Verify status is Completed
    if (rental.status !== "Completed") {
      return res.status(400).json({ message: "You can only rate a completed rental transaction" });
    }

    // Convert ObjectIds to string for clean comparison
    const tenantIdStr = rental.tenant.toString();
    const ownerIdStr = rental.owner.toString();
    const reviewerIdStr = reviewerId.toString();

    // 2. Verify that reviewer is authorized (is either the tenant or owner)
    if (reviewerIdStr !== tenantIdStr && reviewerIdStr !== ownerIdStr) {
      return res.status(403).json({ message: "You are not authorized to rate this rental transaction" });
    }

    let revieweeId;
    let revieweeRole;

    // Determine roles and check duplicate submissions
    if (reviewerIdStr === tenantIdStr) {
      if (rental.ratedByTenant) {
        return res.status(400).json({ message: "You have already rated this transaction" });
      }
      revieweeId = rental.owner;
      revieweeRole = "lender";
    } else {
      if (rental.ratedByOwner) {
        return res.status(400).json({ message: "You have already rated this transaction" });
      }
      revieweeId = rental.tenant;
      revieweeRole = "tenant";
    }

    // 3. Create Review
    const review = await Review.create({
      rental: rentalId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      item: rental.item,
      rating,
      comment,
      revieweeRole,
    });

    // 4. Update corresponding flag on Rental
    if (reviewerIdStr === tenantIdStr) {
      rental.ratedByTenant = true;
    } else {
      rental.ratedByOwner = true;
    }
    await rental.save();

    // 5. Recalculate average rating for reviewee
    const reviews = await Review.find({ reviewee: revieweeId });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await User.findByIdAndUpdate(revieweeId, { rating: averageRating });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for a user
 * @route   GET /api/users/:id/reviews
 * @access  Public
 */
export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const reviews = await Review.find({ reviewee: userId })
      .populate("reviewer", "name profileImage")
      .populate("item", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
