import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ItemCard = ({ item }) => {
  const {
    _id,
    title,
    category,
    images,
    dailyRate,
    depositAmount,
    location,
    owner,
  } = item;

  const mainImage = images && images.length > 0 ? images[0] : "https://via.placeholder.com/300x200?text=No+Image";
  const ownerName = owner?.name || "Campus Member";
  const ownerRating = owner?.rating || 0;
  const ownerImage = owner?.profileImage || "";

  return (
    <motion.div
      className="item-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-image-wrapper">
        <img src={mainImage} alt={title} className="card-image" loading="lazy" />
        <span className="category-badge">{category}</span>
      </div>

      <div className="card-content">
        <div className="card-header-info">
          <h3 className="card-title" title={title}>{title}</h3>
          <div className="pricing-tag">
            <span className="rate">₹{Math.round(dailyRate * 90)}</span>
            <span className="unit">/ day</span>
          </div>
        </div>

        <p className="card-location">
          <svg
            className="icon-pin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="14"
            height="14"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {location?.formattedAddress || "On Campus"}
        </p>

        <div className="deposit-info">
          <span>Deposit: <strong>₹{Math.round(depositAmount * 90)}</strong></span>
        </div>

        <div className="card-footer">
          <Link to={`/profile?userId=${owner?._id || owner}`} className="owner-summary" style={{ textDecoration: "none", color: "inherit", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {ownerImage ? (
              <img src={ownerImage} alt={ownerName} className="owner-avatar" />
            ) : (
              <div className="owner-avatar-placeholder">
                {ownerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="owner-details">
              <span className="owner-name" style={{ fontWeight: 600 }}>{ownerName}</span>
              <div className="owner-rating" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <svg
                  className="icon-star"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  width="12"
                  height="12"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{ownerRating > 0 ? ownerRating.toFixed(1) : "New"}</span>
              </div>
            </div>
          </Link>

          <Link to={`/items/${_id}`} className="btn-view-details">
            Rent Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ItemCard;
