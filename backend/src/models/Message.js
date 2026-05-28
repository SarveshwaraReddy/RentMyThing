import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
