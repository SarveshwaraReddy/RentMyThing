import Item from "../models/Item.js";
import Rental from "../models/Rental.js";

// @desc    Create new item listing
// @route   POST /api/items
// @access  Private
export const createItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      dailyRate,
      depositAmount,
      latitude,
      longitude,
      formattedAddress,
    } = req.body;

    // Basic Validation
    if (!title || !description || !category || !dailyRate || !depositAmount) {
      return res.status(400).json({ message: "Please provide all required text fields" });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location coordinates are required" });
    }

    // Require at least one image
    if (!req.imageUrls || req.imageUrls.length === 0) {
      return res.status(400).json({ message: "At least one image is required for a listing" });
    }

    // Construct Location object
    const location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)], // GeoJSON format: [longitude, latitude]
      formattedAddress: formattedAddress || "",
    };

    const newItem = await Item.create({
      owner: req.user.id,
      title,
      description,
      category,
      images: req.imageUrls,
      dailyRate: parseFloat(dailyRate),
      depositAmount: parseFloat(depositAmount),
      location,
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active item listings (supports search, categories, and distance filters)
// @route   GET /api/items
// @access  Public
export const getItems = async (req, res, next) => {
  try {
    const { search, category, owner, lat, lng, maxDistance } = req.query;
    
    // Create base query
    const query = { isAvailable: true };

    // String casting to prevent NoSQL query operator injection
    const searchStr = typeof search === "string" ? search.trim() : "";
    const categoryStr = typeof category === "string" ? category.trim() : "";
    const ownerStr = typeof owner === "string" ? owner.trim() : "";

    // Search query (matches title or description)
    if (searchStr) {
      query.$or = [
        { title: { $regex: searchStr, $options: "i" } },
        { description: { $regex: searchStr, $options: "i" } },
      ];
    }

    // Category filter
    if (categoryStr) {
      query.category = categoryStr;
    }

    // Owner filter (e.g. view specific user listings)
    if (ownerStr) {
      query.owner = ownerStr;
    }

    // Geospatial search - Validate coordinates to avoid crash on invalid inputs
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const isGeoSearch = !isNaN(parsedLat) && !isNaN(parsedLng);

    if (isGeoSearch) {
      const distanceInMeters = parseInt(maxDistance, 10) || 10000; // Defaults to 10km
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
          },
          $maxDistance: distanceInMeters,
        },
      };
    }

    // Fetch items
    let items;
    if (isGeoSearch) {
      // Near query already sorts by distance automatically
      items = await Item.find(query).populate("owner", "name rating profileImage");
    } else {
      // Default to sorting by newest
      items = await Item.find(query)
        .populate("owner", "name rating profileImage")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single item details
// @route   GET /api/items/:id
// @access  Public
export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "owner",
      "name rating profileImage institution"
    );

    if (!item) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update listing details
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res, next) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Verify ownership
    if (item.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "User is not authorized to edit this listing" });
    }

    // Extract update fields
    const {
      title,
      description,
      category,
      dailyRate,
      depositAmount,
      isAvailable,
      latitude,
      longitude,
      formattedAddress,
    } = req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (dailyRate !== undefined) updateFields.dailyRate = parseFloat(dailyRate);
    if (depositAmount !== undefined) updateFields.depositAmount = parseFloat(depositAmount);
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable === "true" || isAvailable === true;

    // Handle Location updates
    if (latitude && longitude) {
      updateFields.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        formattedAddress: formattedAddress || item.location.formattedAddress || "",
      };
    } else if (formattedAddress !== undefined) {
      updateFields.location = {
        ...item.location,
        formattedAddress,
      };
    }

    // If new images were uploaded, append or replace
    if (req.imageUrls && req.imageUrls.length > 0) {
      updateFields.images = req.imageUrls; // Replace images with newly uploaded ones
    }

    item = await Item.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete listing
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Verify ownership
    if (item.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "User is not authorized to delete this listing" });
    }

    // Check if there are active or approved rentals for this item
    const activeRentalsCount = await Rental.countDocuments({
      item: req.params.id,
      status: { $in: ["Approved", "Active"] }
    });

    if (activeRentalsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete this listing because it currently has active or approved rental contracts."
      });
    }

    // Auto-reject any requested rentals for this item
    await Rental.updateMany(
      { item: req.params.id, status: "Requested" },
      { $set: { status: "Rejected" } }
    );

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
