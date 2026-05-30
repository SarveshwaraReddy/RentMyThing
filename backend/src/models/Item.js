import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: [true, "Deposit amount is required"],
      min: 0,
    },
    availability: {
      type: [
        {
          startDate: Date,
          endDate: Date,
        },
      ],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      formattedAddress: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ location: "2dsphere" });
itemSchema.index({ owner: 1 });

const Item = mongoose.model("Item", itemSchema);
export default Item;
