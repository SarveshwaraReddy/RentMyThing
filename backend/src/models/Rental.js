import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    totalCost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: [true, "Security deposit is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["Requested", "Approved", "Active", "Completed", "Rejected"],
      default: "Requested",
    },
    handshakeOTP: {
      type: String,
      select: false,
    },
    tempRawOTP: {
      type: String,
      select: false,
    },
    otpExpiresAt: Date,
  },
  {
    timestamps: true,
  }
);

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
