import Message from "../models/Message.js";
import Rental from "../models/Rental.js";

// @desc    Get chat message history for a rental contract
// @route   GET /api/rentals/:id/messages
// @access  Private
export const getChatHistory = async (req, res, next) => {
  try {
    const rentalId = req.params.id;

    // Retrieve rental to verify membership
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: "Rental contract not found" });
    }

    // Verify membership: owner or tenant only
    if (
      rental.owner.toString() !== req.user.id.toString() &&
      rental.tenant.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to access this chat history" });
    }

    // Fetch chronological messages
    const messages = await Message.find({ rentalId })
      .populate("sender", "name profileImage")
      .sort({ createdAt: 1 }); // Ascending order (oldest first)

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
