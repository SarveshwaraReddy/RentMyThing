import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import usersService from "../services/users.js";
import itemsService from "../services/items.js";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  
  // Parse userId from query parameter: e.g. /profile?userId=xxxx
  const searchParams = new URLSearchParams(location.search);
  const queryUserId = searchParams.get("userId");
  const targetUserId = queryUserId || currentUser?._id;

  const isOwnProfile = !queryUserId || queryUserId === currentUser?._id;

  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndReviews = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      // Fetch user profile, reviews, and items concurrently
      const [profileRes, reviewsRes, itemsRes] = await Promise.all([
        usersService.getUserProfile(targetUserId),
        usersService.getUserReviews(targetUserId),
        itemsService.getItems({ owner: targetUserId }),
      ]);

      setProfileData(profileRes.data.data);
      setReviews(reviewsRes.data.data);
      setItems(itemsRes.data.data);
    } catch (error) {
      console.error("Failed to load profile details:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndReviews();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="page profile-page text-center" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <div style={{ width: "100%", maxWidth: "600px" }}>
          <div className="shimmer-line title" style={{ width: "200px", margin: "0 auto 1.5rem" }}></div>
          <div className="shimmer-card" style={{ height: "150px", marginBottom: "1.5rem" }}></div>
          <div className="shimmer-card" style={{ height: "250px" }}></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page profile-page text-center">
        <h3>User profile not found.</h3>
        <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const { name, email, institution, rating, createdAt } = profileData;
  const initial = name?.charAt(0).toUpperCase() || "U";
  const formattedDate = new Date(createdAt).toLocaleDateString([], {
    year: "numeric",
    month: "long",
  });

  return (
    <motion.main
      className="page profile-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem 1.5rem" }}
    >
      <div className="profile-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem" }}>
        
        {/* Header Block / User Summary Card */}
        <section
          className="profile-user-card"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "24px",
            padding: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "2rem",
            alignItems: "center",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            className="profile-avatar-giant"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "3rem",
              fontWeight: 800,
            }}
          >
            {initial}
          </div>
          
          <div style={{ flex: 1, minWidth: "250px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.25rem" }}>{name}</h1>
            <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              🏫 {institution || "Campus Member"}
            </p>
            {isOwnProfile && (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                📧 {email} <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "12px", background: "#f1f5f9", marginLeft: "0.5rem", fontWeight: 650 }}>Private</span>
              </p>
            )}
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Member since: {formattedDate}
            </p>
          </div>

          {/* Rating Summary Stats */}
          <div
            style={{
              textAlign: "center",
              background: "#f8fafc",
              border: "1px solid var(--border-color)",
              padding: "1.25rem 2rem",
              borderRadius: "20px",
              minWidth: "160px",
            }}
          >
            <div style={{ fontSize: "2.75rem", fontWeight: 850, color: "var(--primary)", lineHeight: 1 }}>
              {rating > 0 ? rating.toFixed(1) : "New"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.2rem", margin: "0.4rem 0" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "1.1rem",
                    color: star <= Math.round(rating) ? "var(--primary)" : "#cbd5e1",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {reviews.length} transaction reviews
            </span>
          </div>
        </section>

        {/* Content split columns */}
        <div
          className="profile-content-split"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "2.5rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: Trust Ratings & Feedback Reviews */}
          <section className="profile-reviews-section">
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
              Ratings & Feedback
            </h2>
            
            {reviews.length === 0 ? (
              <div
                style={{
                  padding: "3rem 1.5rem",
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No feedback ratings listed yet for this member.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="review-item-card"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "1.25rem",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "35px",
                            height: "35px",
                            borderRadius: "50%",
                            background: "#e2e8f0",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                          }}
                        >
                          {rev.reviewer?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.9rem" }}>{rev.reviewer?.name}</strong>
                          <span
                            className="badge"
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "8px",
                              marginLeft: "0.5rem",
                              background: rev.revieweeRole === "lender" ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
                              color: rev.revieweeRole === "lender" ? "var(--primary)" : "#059669",
                              fontWeight: 700,
                            }}
                          >
                            {rev.revieweeRole === "lender" ? "Borrowed Item" : "Lent Item"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Review stars */}
                      <div style={{ display: "flex", gap: "0.1rem" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              fontSize: "0.9rem",
                              color: star <= rev.rating ? "var(--primary)" : "#e2e8f0",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineBreak: "anywhere", marginBottom: "0.5rem" }}>
                      {rev.comment || <em style={{ color: "var(--text-muted)" }}>No written feedback provided.</em>}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span>Item: <strong>{rev.item?.title || "Listing"}</strong></span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT: User Listings */}
          <section className="profile-listings-section">
            <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
              {isOwnProfile ? "My Listed Items" : `Published Listings (${items.length})`}
            </h2>

            {items.length === 0 ? (
              <div
                style={{
                  padding: "3rem 1.5rem",
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                This member hasn't published any items for rent yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {items.map((item) => (
                  <Link
                    key={item._id}
                    to={`/items/${item._id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="profile-item-row"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        padding: "1rem",
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        boxShadow: "var(--shadow-sm)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(5px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                    >
                      <img
                        src={item.images?.[0] || "https://via.placeholder.com/150"}
                        alt={item.title}
                        style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                          {item.title}
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Category: {item.category}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)" }}>
                          ₹{Math.round(item.dailyRate * 90)}/day
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "8px",
                            background: item.isAvailable ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: item.isAvailable ? "#059669" : "#dc2626",
                            fontWeight: 700,
                          }}
                        >
                          {item.isAvailable ? "Available" : "Borrowed"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </motion.main>
  );
};

export default Profile;
