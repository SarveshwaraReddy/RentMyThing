import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import itemsService from "../services/items.js";

const categories = [
  "Electronics",
  "Tools",
  "Textbooks",
  "Bicycles & Scooters",
  "Clothing",
  "Sports Gear",
  "Other",
];

const AddItem = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const navigate = useNavigate();

  // Handle Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    toast.loading("Detecting your location...", { id: "geo" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        
        // Attempt a simple reverse lookup or just set placeholder address
        setFormattedAddress(
          formattedAddress || `Campus coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
        
        toast.success("Location coordinates loaded successfully!", { id: "geo" });
        setDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to detect location. Please fill it manually.", { id: "geo" });
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle File uploads and previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    const updatedFiles = [...selectedFiles, ...files];
    setSelectedFiles(updatedFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  // Remove selected image
  const removeImage = (index) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);

    const updatedPreviews = [...previews];
    URL.revokeObjectURL(updatedPreviews[index]); // release memory
    updatedPreviews.splice(index, 1);
    setPreviews(updatedPreviews);
  };

  const validateForm = () => {
    if (!title.trim()) return "Title is required";
    if (!description.trim()) return "Description is required";
    if (!category) return "Please select a category";
    if (!dailyRate || parseFloat(dailyRate) <= 0) return "Daily rate must be greater than 0";
    if (!depositAmount || parseFloat(depositAmount) < 0) return "Deposit amount cannot be negative";
    if (!formattedAddress.trim()) return "A physical location address is required";
    if (!latitude || !longitude) return "Please click 'Detect Location' or input GPS coordinates";
    if (selectedFiles.length === 0) return "Please upload at least one image of your item";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    const uploadToastId = toast.loading("Creating your listing...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("dailyRate", dailyRate);
      formData.append("depositAmount", depositAmount);
      formData.append("formattedAddress", formattedAddress);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      // Append files
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      await itemsService.createItem(formData);
      toast.success("Listing created successfully!", { id: uploadToastId });
      navigate("/marketplace");
    } catch (error) {
      console.error("Listing creation error:", error);
      const msg = error?.message || "Failed to create listing. Try again.";
      toast.error(msg, { id: uploadToastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      className="page add-item-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="add-item-card">
        <header className="page-header">
          <h1>List an Item for Rent</h1>
          <p>Fill out the details below to share your item with the campus community.</p>
        </header>

        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Main Info */}
          <div className="form-section">
            <h2 className="section-title">Item Details</h2>
            <div className="form-grid">
              <label className="form-group span-2">
                <span>Listing Title</span>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM4 Noise Cancelling Headphones"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control"
                  disabled={loading}
                />
              </label>

              <label className="form-group span-2">
                <span>Description</span>
                <textarea
                  placeholder="Describe your item, its condition, and any specific rental requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control textarea-control"
                  rows="4"
                  disabled={loading}
                />
              </label>

              <label className="form-group">
                <span>Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control select-control"
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <div className="pricing-group">
                <label className="form-group">
                  <span>Daily Rate ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  />
                </label>

                <label className="form-group">
                  <span>Security Deposit ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="form-section">
            <h2 className="section-title">Campus Location</h2>
            <div className="form-grid">
              <div className="form-group span-2">
                <span>Address / Building / Dorm</span>
                <div className="location-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. Dorm Room 302B, Main Hall Campus"
                    value={formattedAddress}
                    onChange={(e) => setFormattedAddress(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation || loading}
                    className="btn btn-secondary btn-detect-location"
                    title="Get current browser coordinates"
                  >
                    {detectingLocation ? "Detecting..." : "Detect GPS"}
                  </button>
                </div>
              </div>

              <div className="gps-coordinates span-2">
                <div className="coords-field">
                  <span>Latitude:</span>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Auto-detected"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  />
                </div>
                <div className="coords-field">
                  <span>Longitude:</span>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Auto-detected"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image uploads */}
          <div className="form-section">
            <h2 className="section-title">Upload Images (Max 5)</h2>
            <div className="upload-box-container">
              <label className="upload-dropzone">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                  disabled={loading || selectedFiles.length >= 5}
                />
                <div className="dropzone-prompt">
                  <svg
                    className="icon-upload"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Click to choose images</span>
                  <span className="upload-limit-info">Up to 5 PNG, JPG, or JPEG images</span>
                </div>
              </label>

              {previews.length > 0 && (
                <div className="image-previews-grid">
                  {previews.map((src, index) => (
                    <div key={src} className="preview-thumbnail-wrapper">
                      <img src={src} alt={`Preview ${index}`} className="preview-thumbnail" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn-remove-preview"
                        title="Remove image"
                        disabled={loading}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/marketplace")}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Publishing listing..." : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </motion.main>
  );
};

export default AddItem;
