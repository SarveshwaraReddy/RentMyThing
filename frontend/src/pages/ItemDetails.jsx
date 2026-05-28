import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import itemsService from "../services/items.js";
import rentalsService from "../services/rentals.js";
import { useAuth } from "../context/AuthContext.jsx";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Booking states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const response = await itemsService.getItem(id);
        setItem(response.data.data);
      } catch (error) {
        console.error("Error loading item details:", error);
        toast.error("Failed to load item details. Returning to marketplace.");
        navigate("/marketplace");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="page item-details-page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div style={{ width: "100%", maxWidth: "1000px" }}>
          <div className="shimmer-line title" style={{ width: "250px", marginBottom: "2rem" }}></div>
          <div className="details-grid">
            <div>
              <div className="shimmer-card" style={{ height: "350px", marginBottom: "1.5rem" }}></div>
              <div className="shimmer-card" style={{ height: "150px" }}></div>
            </div>
            <div>
              <div className="shimmer-card" style={{ height: "250px", marginBottom: "1.5rem" }}></div>
              <div className="shimmer-card" style={{ height: "100px" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page item-details-page text-center">
        <h2>Item not found.</h2>
        <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    category,
    images,
    dailyRate,
    depositAmount,
    location,
    isAvailable,
    owner,
  } = item;

  const imagesList = images && images.length > 0 ? images : ["https://via.placeholder.com/600x360?text=No+Image+Available"];
  const activeImage = imagesList[activeImageIdx];
  const isOwner = currentUser && owner && (currentUser._id === (owner._id || owner));

  // Date constraints
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate rental duration and costs
  let durationDays = 0;
  let rentalCost = 0;
  let securityDeposit = 0;
  let totalCost = 0;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (durationDays > 0) {
      rentalCost = durationDays * Math.round(dailyRate * 90);
      securityDeposit = Math.round(depositAmount * 90);
      totalCost = rentalCost + securityDeposit;
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to request a booking.");
      navigate("/login");
      return;
    }

    if (durationDays <= 0) {
      toast.error("End date must be after start date.");
      return;
    }

    setBookingLoading(true);
    try {
      await rentalsService.requestRental({
        itemId: item._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      toast.success("Rental request submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.response?.data?.message || "Failed to book item. Overlapping rental exists.");
    } finally {
      setBookingLoading(false);
    }
  };

  const ownerName = owner?.name || "Campus Member";
  const ownerRating = owner?.rating || 0;
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <motion.main
      className="page item-details-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back Link */}
      <div className="back-btn-wrapper">
        <Link to="/marketplace" className="btn-back">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </Link>
      </div>

      {/* Header Info */}
      <section className="details-header">
        <div className="details-title-section">
          <h1>{title}</h1>
          <div className="details-meta">
            <span className="category-badge" style={{ position: "static", background: "var(--primary-light)", color: "var(--primary)" }}>
              {category}
            </span>
            <span className={`availability-badge ${isAvailable ? "available" : "unavailable"}`}>
              {isAvailable ? "● Available" : "● Borrowed"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="details-grid">
        
        {/* Left Column: Media & Core details */}
        <div className="details-main-content">
          
          {/* Gallery Slider */}
          <div className="item-gallery-container">
            <div className="active-image-wrapper">
              <img src={activeImage} alt={title} className="active-image" />
            </div>
            {imagesList.length > 1 && (
              <div className="thumbnail-strip">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`thumbnail-btn ${activeImageIdx === idx ? "active" : ""}`}
                  >
                    <img src={img} alt={`${title} preview ${idx + 1}`} className="thumbnail-image" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Block */}
          <section className="info-section-card">
            <h2>Item Description</h2>
            <p className="description-text">{description}</p>
          </section>

          {/* Location Block */}
          <section className="info-section-card">
            <h2>Pickup Location</h2>
            <div className="location-address">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" style={{ color: "var(--primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location?.formattedAddress || "On Campus"}</span>
            </div>
          </section>

        </div>

        {/* Right Column: Booking panel & owner profile summary */}
        <div className="sticky-column">
          
          {/* Booking Request Card */}
          <section className="booking-card">
            <div className="booking-card-price">
              <span className="price">₹{Math.round(dailyRate * 90)}</span>
              <span className="unit"> / day</span>
            </div>

            {isOwner ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  You are the owner of this listing. You cannot borrow your own item.
                </p>
                <Link to="/dashboard" className="btn btn-secondary" style={{ width: "100%" }}>
                  Go to Lender Dashboard
                </Link>
              </div>
            ) : !isAvailable ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--danger)", fontWeight: 700 }}>
                  This item is currently borrowed and unavailable.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-dates-form">
                <div className="form-group">
                  <span>Start Date</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) {
                        setEndDate("");
                      }
                    }}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <span>End Date</span>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-control"
                    required
                    disabled={!startDate}
                  />
                </div>

                <AnimatePresence>
                  {durationDays > 0 && (
                    <motion.div
                      className="cost-breakdown"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="cost-row">
                        <span>Duration:</span>
                        <span>{durationDays} {durationDays === 1 ? "day" : "days"}</span>
                      </div>
                      <div className="cost-row">
                        <span>Rental Cost:</span>
                        <span>₹{rentalCost}</span>
                      </div>
                      <div className="cost-row">
                        <span>Refundable Deposit:</span>
                        <span>₹{securityDeposit}</span>
                      </div>
                      <div className="cost-row total">
                        <span>Total Due:</span>
                        <span>₹{totalCost}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="btn btn-primary btn-book"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? "Submitting Request..." : "Request Booking"}
                </button>
              </form>
            )}
          </section>

          {/* Owner details summary panel */}
          <section className="owner-card-panel">
            <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", fontWeight: 700 }}>
              Listed By
            </h4>
            
            <div className="owner-card-header">
              {owner?.profileImage ? (
                <img src={owner.profileImage} alt={ownerName} className="owner-card-avatar" />
              ) : (
                <div className="owner-card-avatar">
                  {ownerInitial}
                </div>
              )}
              
              <div className="owner-card-info">
                <h3>{ownerName}</h3>
                <p>🏫 {owner?.institution || "Campus Member"}</p>
              </div>
            </div>

            <div className="owner-card-rating">
              <span>Trust Rating:</span>
              <div style={{ display: "flex", gap: "0.1rem", color: "var(--primary)", fontSize: "1.1rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} style={{ color: star <= Math.round(ownerRating) ? "var(--primary)" : "#cbd5e1" }}>
                    ★
                  </span>
                ))}
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                ({ownerRating > 0 ? ownerRating.toFixed(1) : "New"})
              </span>
            </div>

            <Link to={`/profile?userId=${owner?._id || owner}`} className="btn-view-owner">
              View Owner Profile & Reviews
            </Link>
          </section>

        </div>

      </div>
    </motion.main>
  );
};

export default ItemDetails;
