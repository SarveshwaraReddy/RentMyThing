import crypto from "crypto";
import bcrypt from "bcryptjs";
import Rental from "../models/Rental.js";
import Item from "../models/Item.js";

// @desc    Request a new booking
// @route   POST /api/rentals
// @access  Private
export const requestRental = async (req, res, next) => {
  try {
    const { itemId, startDate, endDate } = req.body;

    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({ message: "Item ID, start date, and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date correctness
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    if (end < start) {
      return res.status(400).json({ message: "End date must be on or after start date" });
    }

    // Retrieve Item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item listing not found" });
    }

    if (!item.isAvailable) {
      return res.status(400).json({ message: "This item is currently not available for rent" });
    }

    // Owner cannot rent their own item
    if (item.owner.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: "You cannot rent your own item listing" });
    }

    // Double-booking check: verify no overlapping approved or active bookings
    const overlappingRental = await Rental.findOne({
      item: itemId,
      status: { $in: ["Approved", "Active"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlappingRental) {
      return res.status(409).json({
        message: "This item is already booked by another user for the selected dates",
      });
    }

    // Calculate billing
    const timeDifference = end.getTime() - start.getTime();
    const billingDays = Math.ceil(timeDifference / (1000 * 3600 * 24)) || 1;
    const totalCost = billingDays * item.dailyRate;
    const securityDeposit = item.depositAmount;

    // Create contract
    const rental = await Rental.create({
      item: itemId,
      owner: item.owner,
      tenant: req.user.id,
      startDate: start,
      endDate: end,
      totalCost,
      securityDeposit,
      status: "Requested",
    });

    res.status(201).json({
      success: true,
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lender approves rental booking request & generates OTP
// @route   POST /api/rentals/:id/approve
// @access  Private
export const approveRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ message: "Rental request not found" });
    }

    // Verify ownership
    if (rental.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to approve this rental request" });
    }

    if (rental.status !== "Requested") {
      return res.status(400).json({ message: `Cannot approve a rental that is in '${rental.status}' status` });
    }

    // Check for other approved or active rentals that overlap
    const overlapping = await Rental.findOne({
      item: rental.item,
      status: { $in: ["Approved", "Active"] },
      _id: { $ne: rental._id },
      startDate: { $lte: rental.endDate },
      endDate: { $gte: rental.startDate },
    });

    if (overlapping) {
      return res.status(409).json({
        message: "Cannot approve this request. The item has already been booked by another user for overlapping dates."
      });
    }

    // Auto-reject other requested bookings that overlap
    await Rental.updateMany(
      {
        item: rental.item,
        status: "Requested",
        _id: { $ne: rental._id },
        startDate: { $lte: rental.endDate },
        endDate: { $gte: rental.startDate },
      },
      { $set: { status: "Rejected" } }
    );

    // Generate secure 6-digit OTP
    const rawOTP = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(rawOTP, salt);

    // Save fields
    rental.status = "Approved";
    rental.handshakeOTP = hashedOTP;
    rental.tempRawOTP = rawOTP;
    rental.otpExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours expiry
    rental.otpAttempts = 0; // reset attempts

    await rental.save();

    res.status(200).json({
      success: true,
      message: "Rental approved. Handshake OTP generated successfully.",
      data: {
        id: rental._id,
        status: rental.status,
        otp: rawOTP, // Return once so the lender can write it down / show it
        otpExpiresAt: rental.otpExpiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Renter submits handshake OTP to confirm handover (Approved -> Active)
// @route   POST /api/rentals/:id/verify-otp
// @access  Private
export const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP code is required for verification" });
    }

    // Explicitly select handshakeOTP since it is hidden by default in schema
    const rental = await Rental.findById(req.params.id).select("+handshakeOTP");

    if (!rental) {
      return res.status(404).json({ message: "Rental contract not found" });
    }

    // Verify user is the tenant
    if (rental.tenant.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the tenant can verify the handshake OTP" });
    }

    if (rental.status !== "Approved") {
      return res.status(400).json({ message: `Handshake verification is not applicable for '${rental.status}' status` });
    }

    // Expiry check
    if (new Date() > rental.otpExpiresAt) {
      return res.status(400).json({ message: "Handshake OTP has expired. Please ask the owner to approve/regenerate." });
    }

    // OTP match
    const isMatch = await bcrypt.compare(otp.toString(), rental.handshakeOTP);
    if (!isMatch) {
      rental.otpAttempts = (rental.otpAttempts || 0) + 1;
      if (rental.otpAttempts >= 5) {
        // Reset state back to Requested so OTP can be regenerated
        rental.status = "Requested";
        rental.handshakeOTP = undefined;
        rental.tempRawOTP = undefined;
        rental.otpExpiresAt = undefined;
        rental.otpAttempts = 0;
        await rental.save();
        return res.status(400).json({
          message: "Too many failed OTP attempts. Handshake reset. Please ask the owner to regenerate OTP.",
        });
      }
      await rental.save();
      return res.status(400).json({
        message: `Invalid OTP handshake code. Attempts remaining: ${5 - rental.otpAttempts}`,
      });
    }

    // Success: Handover complete. Transition Active & purge temp OTP credentials
    rental.status = "Active";
    rental.handshakeOTP = undefined;
    rental.tempRawOTP = undefined;
    rental.otpExpiresAt = undefined;
    rental.otpAttempts = 0;

    await rental.save();

    res.status(200).json({
      success: true,
      message: "OTP verified. Renter confirmed possession. Rental is now ACTIVE.",
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm return of the item (Active -> Completed)
// @route   POST /api/rentals/:id/complete
// @access  Private
export const completeRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ message: "Rental contract not found" });
    }

    // Authorized party: owner or tenant
    if (rental.owner.toString() !== req.user.id.toString() && rental.tenant.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to complete this rental" });
    }

    if (rental.status !== "Active") {
      return res.status(400).json({ message: `Only active rentals can be completed. Current status: '${rental.status}'` });
    }

    rental.status = "Completed";
    await rental.save();

    res.status(200).json({
      success: true,
      message: "Rental complete. Item successfully returned.",
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's list of rental contracts
// @route   GET /api/rentals
// @access  Private
export const getUserRentals = async (req, res, next) => {
  try {
    const { role } = req.query; // role can be "owner", "tenant", or undefined (returns all)

    const query = {};

    if (role === "owner") {
      query.owner = req.user.id;
    } else if (role === "tenant") {
      query.tenant = req.user.id;
    } else {
      query.$or = [{ owner: req.user.id }, { tenant: req.user.id }];
    }

    let rentals = await Rental.find(query)
      .select("+tempRawOTP")
      .populate("item")
      .populate("owner", "name rating profileImage email")
      .populate("tenant", "name rating profileImage email")
      .sort({ createdAt: -1 });

    // Clean/sanitize raw OTP to ensure only the owner can see it
    const sanitizedRentals = rentals.map((rental) => {
      const rentalObj = rental.toObject();
      if (rentalObj.owner && rentalObj.owner._id.toString() !== req.user.id.toString()) {
        delete rentalObj.tempRawOTP;
      }
      return rentalObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedRentals.length,
      data: sanitizedRentals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific rental details (shows tempRawOTP only to the owner/lender)
// @route   GET /api/rentals/:id
// @access  Private
export const getRentalById = async (req, res, next) => {
  try {
    let rental = await Rental.findById(req.params.id)
      .populate("item")
      .populate("owner", "name rating profileImage email")
      .populate("tenant", "name rating profileImage email");

    if (!rental) {
      return res.status(404).json({ message: "Rental contract not found" });
    }

    // Authorization check
    if (rental.owner._id.toString() !== req.user.id.toString() && rental.tenant._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this contract details" });
    }

    // If active user is the owner, allow pulling the tempRawOTP in case they refreshed the page
    if (rental.owner._id.toString() === req.user.id.toString() && rental.status === "Approved") {
      const rawRental = await Rental.findById(req.params.id).select("+tempRawOTP");
      // Append to result object
      rental = rental.toObject();
      rental.tempRawOTP = rawRental.tempRawOTP;
    }

    res.status(200).json({
      success: true,
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lender rejects rental request
// @route   POST /api/rentals/:id/reject
// @access  Private
export const rejectRental = async (req, res, next) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ message: "Rental request not found" });
    }

    // Verify ownership
    if (rental.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this rental request" });
    }

    if (rental.status !== "Requested") {
      return res.status(400).json({ message: `Cannot reject a rental that is in '${rental.status}' status` });
    }

    rental.status = "Rejected";
    await rental.save();

    res.status(200).json({
      success: true,
      message: "Rental request rejected successfully",
      data: rental,
    });
  } catch (error) {
    next(error);
  }
};
