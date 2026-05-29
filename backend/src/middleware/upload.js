import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure local uploads directory exists
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up memory storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
});

// Middleware function that processes files and appends array of URLs to req.imageUrls
export const uploadImages = (fieldName, maxCount = 5) => {
  const multerMiddleware = upload.array(fieldName, maxCount);

  return (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.files || req.files.length === 0) {
        req.imageUrls = [];
        return next();
      }

      try {
        const uploadPromises = req.files.map(async (file) => {
          // Local upload - Write file to disk
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          const filePath = path.join(uploadDir, uniqueFilename);
          
          await fs.promises.writeFile(filePath, file.buffer);
          
          // Generate local accessible URL
          const localUrl = `${req.protocol}://${req.get("host")}/uploads/${uniqueFilename}`;
          return localUrl;
        });

        req.imageUrls = await Promise.all(uploadPromises);
        next();
      } catch (error) {
        console.error("Upload processing error:", error);
        return res.status(500).json({ message: "Failed to process image uploads" });
      }
    });
  };
};
