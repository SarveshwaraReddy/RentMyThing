import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    revieweeRole: {
      type: String,
      enum: ["lender", "tenant"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews: One reviewer can submit only one review per rental transaction
reviewSchema.index({ rental: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
