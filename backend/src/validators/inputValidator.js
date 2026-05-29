import validator from "validator";

const CATEGORIES = [
  "Electronics",
  "Tools",
  "Textbooks",
  "Bicycles & Scooters",
  "Clothing",
  "Sports Gear",
  "Other"
];

// Helper to sanitize strings by trimming and stripping HTML tags (XSS mitigation)
const sanitizeInputString = (str) => {
  if (typeof str !== "string") return "";
  let cleanStr = str.trim();
  // Basic XSS replacement for brackets to prevent script execution
  cleanStr = cleanStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  return cleanStr;
};

// 1. User Registration Validator
export const validateRegister = (req, res, next) => {
  let { name, email, password, institution } = req.body;

  const errors = {};

  if (!name || typeof name !== "string") {
    errors.name = "Name is required";
  } else {
    name = name.trim();
    if (!validator.isLength(name, { min: 2, max: 50 })) {
      errors.name = "Name must be between 2 and 50 characters";
    }
    req.body.name = sanitizeInputString(name);
  }

  if (!email || typeof email !== "string") {
    errors.email = "Email is required";
  } else {
    email = email.trim().toLowerCase();
    if (!validator.isEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    req.body.email = email;
  }

  if (!password || typeof password !== "string") {
    errors.password = "Password is required";
  } else {
    if (!validator.isLength(password, { min: 8 })) {
      errors.password = "Password must be at least 8 characters long";
    }
  }

  if (!institution || typeof institution !== "string") {
    errors.institution = "Institution is required";
  } else {
    req.body.institution = sanitizeInputString(institution);
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

// 2. User Login Validator
export const validateLogin = (req, res, next) => {
  let { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== "string") {
    errors.email = "Email is required";
  } else {
    email = email.trim().toLowerCase();
    if (!validator.isEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    req.body.email = email;
  }

  if (!password || typeof password !== "string" || validator.isEmpty(password)) {
    errors.password = "Password is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

// 3. Item Validator (Create/Update)
export const validateItem = (req, res, next) => {
  let {
    title,
    description,
    category,
    dailyRate,
    depositAmount,
    latitude,
    longitude,
    formattedAddress
  } = req.body;

  const errors = {};

  // Require title
  if (!title || typeof title !== "string") {
    errors.title = "Title is required";
  } else {
    title = title.trim();
    if (!validator.isLength(title, { min: 3, max: 100 })) {
      errors.title = "Title must be between 3 and 100 characters";
    }
    req.body.title = sanitizeInputString(title);
  }

  // Require description
  if (!description || typeof description !== "string") {
    errors.description = "Description is required";
  } else {
    description = description.trim();
    if (!validator.isLength(description, { min: 10, max: 1000 })) {
      errors.description = "Description must be between 10 and 1000 characters";
    }
    req.body.description = sanitizeInputString(description);
  }

  // Require category
  if (!category || typeof category !== "string") {
    errors.category = "Category is required";
  } else {
    category = category.trim();
    if (!CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${CATEGORIES.join(", ")}`;
    }
    req.body.category = category;
  }

  // Require rates (check numeric values)
  if (dailyRate === undefined || dailyRate === null || dailyRate === "") {
    errors.dailyRate = "Daily rate is required";
  } else {
    const rateStr = String(dailyRate).trim();
    if (!validator.isFloat(rateStr, { min: 0 })) {
      errors.dailyRate = "Daily rate must be a non-negative number";
    } else {
      req.body.dailyRate = parseFloat(rateStr);
    }
  }

  if (depositAmount === undefined || depositAmount === null || depositAmount === "") {
    errors.depositAmount = "Security deposit amount is required";
  } else {
    const depStr = String(depositAmount).trim();
    if (!validator.isFloat(depStr, { min: 0 })) {
      errors.depositAmount = "Security deposit must be a non-negative number";
    } else {
      req.body.depositAmount = parseFloat(depStr);
    }
  }

  // Location fields are required on creation
  // For updates, they may be partial but let's validate if present
  const isUpdate = req.method === "PUT";

  if (latitude !== undefined && latitude !== null && latitude !== "") {
    const latStr = String(latitude).trim();
    if (!validator.isFloat(latStr, { min: -90, max: 90 })) {
      errors.latitude = "Latitude must be a valid coordinate between -90 and 90";
    } else {
      req.body.latitude = parseFloat(latStr);
    }
  } else if (!isUpdate) {
    errors.latitude = "Latitude coordinate is required";
  }

  if (longitude !== undefined && longitude !== null && longitude !== "") {
    const lngStr = String(longitude).trim();
    if (!validator.isFloat(lngStr, { min: -180, max: 180 })) {
      errors.longitude = "Longitude must be a valid coordinate between -180 and 180";
    } else {
      req.body.longitude = parseFloat(lngStr);
    }
  } else if (!isUpdate) {
    errors.longitude = "Longitude coordinate is required";
  }

  if (formattedAddress !== undefined && formattedAddress !== null) {
    req.body.formattedAddress = sanitizeInputString(String(formattedAddress));
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

// 4. Rental Request Validator
export const validateRental = (req, res, next) => {
  const { itemId, startDate, endDate } = req.body;
  const errors = {};

  if (!itemId || !validator.isMongoId(String(itemId))) {
    errors.itemId = "A valid item ID is required";
  }

  if (!startDate || !validator.isISO8601(String(startDate))) {
    errors.startDate = "A valid start date is required";
  }

  if (!endDate || !validator.isISO8601(String(endDate))) {
    errors.endDate = "A valid end date is required";
  }

  if (startDate && endDate && validator.isISO8601(String(startDate)) && validator.isISO8601(String(endDate))) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      errors.endDate = "End date must be on or after start date";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

// 5. Handshake OTP Validator
export const validateOTP = (req, res, next) => {
  const { otp } = req.body;
  const errors = {};

  if (!otp || typeof otp !== "string") {
    errors.otp = "OTP code is required";
  } else {
    const cleanOTP = otp.trim();
    if (!validator.isNumeric(cleanOTP) || cleanOTP.length !== 6) {
      errors.otp = "OTP must be a 6-digit numeric code";
    } else {
      req.body.otp = cleanOTP;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};

// 6. Review Validator
export const validateReview = (req, res, next) => {
  let { rating, comment } = req.body;
  const errors = {};

  if (rating === undefined || rating === null || rating === "") {
    errors.rating = "Rating score is required";
  } else {
    const ratingStr = String(rating).trim();
    if (!validator.isInt(ratingStr, { min: 1, max: 5 })) {
      errors.rating = "Rating must be an integer between 1 and 5";
    } else {
      req.body.rating = parseInt(ratingStr, 10);
    }
  }

  if (comment !== undefined && comment !== null) {
    comment = comment.trim();
    if (comment.length > 500) {
      errors.comment = "Comment review feedback must not exceed 500 characters";
    }
    req.body.comment = sanitizeInputString(comment);
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
};
