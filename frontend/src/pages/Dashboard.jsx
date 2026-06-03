import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import rentalsService from "../services/rentals.js";
import itemsService from "../services/items.js";
import ChatDrawer from "../components/ChatDrawer.jsx";

const Dashboard = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("renting"); // "renting" (Tenant) vs "lending" (Lender)
  const [rentals, setRentals] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(null); // track request ID processing
  const [otpInputs, setOtpInputs] = useState({}); // track OTP input fields by rentalId

  // Chat integration states (Phase 10)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatRentalId, setSelectedChatRentalId] = useState(null);

  // Rating states (Phase 11)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingRentalId, setRatingRentalId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const openRatingModal = (rentalId) => {
    setRatingRentalId(rentalId);
    setRatingValue(5);
    setRatingComment("");
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setRatingRentalId(null);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingRentalId) return;

    setRatingSubmitting(true);
    try {
      await rentalsService.rateRental(ratingRentalId, ratingValue, ratingComment.trim());
      toast.success("Review submitted! Thank you.");
      closeRatingModal();
      loadDashboardData();
    } catch (error) {
      console.error("Submit rating error:", error);
      toast.error(error?.message || "Failed to submit review.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to access the dashboard.");
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      if (activeTab === "renting") {
        // Fetch rentals where I am the tenant
        const res = await rentalsService.getUserRentals("tenant");
        setRentals(res.data.data);
      } else {
        // Fetch items I own + rentals where I am the owner
        const [itemsRes, rentalsRes] = await Promise.all([
          itemsService.getItems({ owner: user._id }),
          rentalsService.getUserRentals("owner"),
        ]);
        setMyListings(itemsRes.data.data);
        setRentals(rentalsRes.data.data);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadDashboardData();
    }
  }, [user, activeTab]);

  // LENDER ACTIONS: Approve request
  const handleApprove = async (rentalId) => {
    setSubmittingAction(rentalId);
    try {
      const res = await rentalsService.approveRental(rentalId);
      toast.success(res.data.message || "Booking request approved!");
      loadDashboardData(); // Refresh list to update status and show OTP
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error?.message || "Failed to approve request.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // LENDER ACTIONS: Reject request
  const handleReject = async (rentalId) => {
    setSubmittingAction(rentalId);
    try {
      await rentalsService.rejectRental(rentalId);
      toast.success("Request rejected.");
      loadDashboardData();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error?.message || "Failed to reject request.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // TENANT ACTIONS: Verify OTP
  const handleOtpChange = (rentalId, val) => {
    setOtpInputs((prev) => ({ ...prev, [rentalId]: val }));
  };

  const handleVerifyOtp = async (e, rentalId) => {
    e.preventDefault();
    const otp = otpInputs[rentalId];
    if (!otp || otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit handshake OTP.");
      return;
    }

    setSubmittingAction(rentalId);
    try {
      await rentalsService.verifyOTP(rentalId, otp);
      toast.success("Handover confirmed! Your rental is now ACTIVE.");
      loadDashboardData();
    } catch (error) {
      console.error("OTP Verification error:", error);
      toast.error(error?.message || "Invalid OTP code. Try again.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // TENANT/LENDER ACTIONS: Complete Rental
  const handleComplete = async (rentalId) => {
    setSubmittingAction(rentalId);
    try {
      await rentalsService.completeRental(rentalId);
      toast.success("Rental completed! Item returned.");
      loadDashboardData();
    } catch (error) {
      console.error("Completion error:", error);
      toast.error(error?.message || "Failed to complete rental contract.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // LENDER ACTIONS: Delete item listing
  const handleDeleteListing = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await itemsService.deleteItem(itemId);
      toast.success("Listing deleted successfully.");
      setMyListings((prev) => prev.filter((item) => item._id !== itemId));
    } catch (error) {
      console.error("Delete listing error:", error);
      toast.error("Failed to delete listing.");
    }
  };

  // Trigger Chat Drawer
  const openChat = (rentalId) => {
    setSelectedChatRentalId(rentalId);
    setIsChatOpen(true);
  };

  if (authLoading) {
    return (
      <div className="page dashboard-page text-center" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <div className="shimmer-line title" style={{ width: "200px", margin: "0 auto" }}></div>
        <div style={{ marginTop: "2rem", width: "100%" }}>
          <div className="shimmer-card" style={{ height: "200px" }}></div>
        </div>
      </div>
    );
  }

  // Filter rentals by status for cleaner display
  const pendingRequests = rentals.filter((r) => r.status === "Requested");
  const approvedRentals = rentals.filter((r) => r.status === "Approved");
  const activeRentals = rentals.filter((r) => r.status === "Active");
  const completedRentals = rentals.filter((r) => ["Completed", "Rejected"].includes(r.status));

  return (
    <motion.main
      className="page dashboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dashboard Top Header */}
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800 }}>User Panel</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage listings, track rental requests, and confirm handshakes.</p>
        </div>

        {/* Renter / Lender Switch Tab */}
        <div className="dashboard-tabs" style={{ display: "flex", background: "#e2e8f0", padding: "0.25rem", borderRadius: "14px" }}>
          <button
            onClick={() => setActiveTab("renting")}
            className="btn"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "11px",
              background: activeTab === "renting" ? "#ffffff" : "transparent",
              color: activeTab === "renting" ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: activeTab === "renting" ? "var(--shadow-sm)" : "none",
            }}
          >
            Borrowing (Renting)
          </button>
          <button
            onClick={() => setActiveTab("lending")}
            className="btn"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "11px",
              background: activeTab === "lending" ? "#ffffff" : "transparent",
              color: activeTab === "lending" ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: activeTab === "lending" ? "var(--shadow-sm)" : "none",
            }}
          >
            Sharing (Lending)
          </button>
        </div>
      </header>

      {/* DASHBOARD RENTING (TENANT VIEW) */}
      {loading ? (
        <div className="page text-center" style={{ display: "grid", placeItems: "center", minHeight: "35vh" }}>
          <div className="shimmer-line title" style={{ width: "150px", margin: "1rem auto" }}></div>
          <div className="shimmer-card" style={{ height: "150px", width: "100%" }}></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
        {activeTab === "renting" ? (
          <motion.div
            key="renting-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="dashboard-panel"
          >
            {rentals.length === 0 ? (
              <div className="marketplace-empty-state">
                <h3>No Rentals Yet</h3>
                <p>You haven't requested to rent any items. Browse the campus marketplace to find items you need!</p>
                <Link to="/marketplace" className="btn btn-primary">
                  Go to Marketplace
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                {/* Active & Approved Handshakes Section */}
                {(activeRentals.length > 0 || approvedRentals.length > 0) && (
                  <div className="dashboard-section">
                    <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Ongoing Rentals</h2>
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                      {[...approvedRentals, ...activeRentals].map((rental) => (
                        <div
                          key={rental._id}
                          className="rental-row-card"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "16px",
                            padding: "1.5rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1.5rem",
                            alignItems: "center",
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          <img
                            src={rental.item?.images?.[0] || "https://via.placeholder.com/150"}
                            alt={rental.item?.title}
                            style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover" }}
                          />
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{rental.item?.title}</h3>
                              <span
                                className={`badge ${rental.status.toLowerCase()}`}
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "20px",
                                  fontWeight: 700,
                                  background: rental.status === "Approved" ? "rgba(234, 179, 8, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                  color: rental.status === "Approved" ? "#ca8a04" : "#059669",
                                }}
                              >
                                {rental.status === "Approved" ? "Handover Pending" : "Active"}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                              Lender: <strong>{rental.owner?.name}</strong> ({rental.owner?.email || "Email hidden before handshake"})
                            </p>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                              Duration: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                            </p>
                          </div>

                          <div style={{ textAlign: "right", minWidth: "150px" }}>
                            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary)" }}>
                              ₹{Math.round(rental.totalCost * 90)}
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Deposit: ₹{Math.round(rental.securityDeposit * 90)}
                            </span>
                          </div>

                          {/* Action Row containing Chat Button */}
                          <div
                            style={{
                              width: "100%",
                              borderTop: "1px solid var(--border-color)",
                              paddingTop: "1rem",
                              marginTop: "0.5rem",
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "0.75rem",
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() => openChat(rental._id)}
                              className="btn btn-secondary btn-chat"
                              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                            >
                              💬 Chat with Owner
                            </button>

                            {rental.status === "Active" && (
                              <button
                                onClick={() => handleComplete(rental._id)}
                                className="btn btn-primary"
                                style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
                                disabled={submittingAction === rental._id}
                              >
                                {submittingAction === rental._id ? "Completing..." : "Confirm Return"}
                              </button>
                            )}
                          </div>

                          {/* OTP verification input (Renter confirms pickup) */}
                          {rental.status === "Approved" && (
                            <form
                              onSubmit={(e) => handleVerifyOtp(e, rental._id)}
                              className="otp-verify-block"
                              style={{
                                width: "100%",
                                borderTop: "1px solid var(--border-color)",
                                paddingTop: "1.25rem",
                                marginTop: "0.5rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: "250px" }}>
                                <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Enter handover OTP from owner:</p>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  Meet the owner, verify the item condition, and get the code.
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                  type="text"
                                  maxLength="6"
                                  placeholder="6-digit OTP"
                                  value={otpInputs[rental._id] || ""}
                                  onChange={(e) => handleOtpChange(rental._id, e.target.value)}
                                  className="form-control"
                                  style={{ width: "120px", textAlign: "center", padding: "0.5rem" }}
                                  disabled={submittingAction === rental._id}
                                />
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                                  disabled={submittingAction === rental._id}
                                >
                                  {submittingAction === rental._id ? "Verifying..." : "Confirm Pickup"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requested Bookings Section */}
                {pendingRequests.length > 0 && (
                  <div className="dashboard-section">
                    <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Sent Rental Requests</h2>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {pendingRequests.map((rental) => (
                        <div
                          key={rental._id}
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "12px",
                            padding: "1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <img
                              src={rental.item?.images?.[0] || "https://via.placeholder.com/150"}
                              alt={rental.item?.title}
                              style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }}
                            />
                            <div>
                              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{rental.item?.title}</h3>
                              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                Requested on: {new Date(rental.createdAt).toLocaleDateString()} | Owner: {rental.owner?.name || "Hidden"}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: "#f1f5f9", color: "var(--text-muted)", fontWeight: 700 }}>
                                Waiting for Owner
                              </span>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: "0.15rem" }}>
                                ₹{Math.round(rental.totalCost * 90)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Section */}
                {completedRentals.length > 0 && (
                  <div className="dashboard-section">
                    <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Past Rentals History</h2>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {completedRentals.map((rental) => (
                        <div
                          key={rental._id}
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "12px",
                            padding: "1rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            opacity: 0.8,
                            flexWrap: "wrap",
                            gap: "1rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <img
                              src={rental.item?.images?.[0] || "https://via.placeholder.com/150"}
                              alt={rental.item?.title}
                              style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }}
                            />
                            <div>
                              <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>{rental.item?.title}</h3>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Completed on: {new Date(rental.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {rental.status === "Completed" && (
                              <button
                                onClick={() => openChat(rental._id)}
                                className="btn btn-secondary btn-chat"
                                style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "10px" }}
                              >
                                View Chat
                              </button>
                            )}
                            {rental.status === "Completed" && !rental.ratedByTenant && (
                              <button
                                onClick={() => openRatingModal(rental._id)}
                                className="btn btn-primary"
                                style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "10px", boxShadow: "none" }}
                              >
                                ⭐ Rate Lender
                              </button>
                            )}
                            {rental.status === "Completed" && rental.ratedByTenant && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                Rated
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "10px",
                                background: rental.status === "Completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                color: rental.status === "Completed" ? "#059669" : "#dc2626",
                                fontWeight: 700,
                              }}
                            >
                              {rental.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* DASHBOARD LENDING (LENDER VIEW) */
          <motion.div
            key="lending-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="dashboard-panel"
            style={{ display: "flex", flexDirection: "column", gap: "3rem" }}
          >
            {/* INCOMING RENTAL REQUESTS SECTION */}
            <div className="dashboard-section">
              <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Incoming Requests & Active Loans</h2>
              {rentals.length === 0 ? (
                <div style={{ padding: "2rem", border: "1.5px dashed #cbd5e1", borderRadius: "14px", textAlign: "center", color: "var(--text-muted)" }}>
                  No active rental requests or handovers listed for your items.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Pending Handovers & Verification */}
                  {rentals.filter(r => ["Requested", "Approved", "Active"].includes(r.status)).map((rental) => (
                    <div
                      key={rental._id}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1.5rem",
                        alignItems: "center",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <img
                        src={rental.item?.images?.[0] || "https://via.placeholder.com/150"}
                        alt={rental.item?.title}
                        style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{rental.item?.title}</h3>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "10px",
                              fontWeight: 700,
                              background:
                                rental.status === "Requested"
                                  ? "rgba(99, 102, 241, 0.15)"
                                  : rental.status === "Approved"
                                  ? "rgba(234, 179, 8, 0.15)"
                                  : "rgba(16, 185, 129, 0.15)",
                              color:
                                rental.status === "Requested"
                                  ? "var(--primary)"
                                  : rental.status === "Approved"
                                  ? "#ca8a04"
                                  : "#059669",
                            }}
                          >
                            {rental.status === "Requested" ? "Pending Approval" : rental.status === "Approved" ? "Handover Ready" : "Active Loan"}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                          Renter: <strong>{rental.tenant?.name}</strong> ({rental.status !== "Requested" ? rental.tenant?.email : "Email hidden before approval"})
                        </p>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.2/rem" }}>
                          Dates: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ textAlign: "right", minWidth: "120px" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>
                          ₹{Math.round(rental.totalCost * 90)}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Earnings (Deposit: ₹{Math.round(rental.securityDeposit * 90)})
                        </span>
                      </div>

                      {/* Action Row */}
                      <div
                        style={{
                          width: "100%",
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: "1rem",
                          marginTop: "0.5rem",
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.75rem",
                          alignItems: "center",
                        }}
                      >
                        {/* Chat button for lender */}
                        {["Approved", "Active"].includes(rental.status) && (
                          <button
                            onClick={() => openChat(rental._id)}
                            className="btn btn-secondary btn-chat"
                            style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                          >
                            💬 Chat with Tenant
                          </button>
                        )}

                        {rental.status === "Requested" && (
                          <>
                            <button
                              onClick={() => handleReject(rental._id)}
                              className="btn btn-secondary"
                              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)" }}
                              disabled={submittingAction === rental._id}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(rental._id)}
                              className="btn btn-primary"
                              style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}
                              disabled={submittingAction === rental._id}
                            >
                              {submittingAction === rental._id ? "Approving..." : "Approve & Generate OTP"}
                            </button>
                          </>
                        )}

                        {/* Lender complete loan button */}
                        {rental.status === "Active" && (
                          <button
                            onClick={() => handleComplete(rental._id)}
                            className="btn btn-primary"
                            style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}
                            disabled={submittingAction === rental._id}
                          >
                            {submittingAction === rental._id ? "Completing..." : "Confirm Return"}
                          </button>
                        )}
                      </div>

                      {/* Display OTP for approved rental */}
                      {rental.status === "Approved" && (
                        <div
                          style={{
                            width: "100%",
                            background: "rgba(16, 185, 129, 0.05)",
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "0.25rem",
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", color: "#065f46", fontWeight: 500 }}>
                            Give this Handshake OTP code to the tenant on handover:
                          </span>
                          <span
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: 850,
                              color: "#047857",
                              background: "#ffffff",
                              border: "1px dashed #059669",
                              padding: "0.25rem 1rem",
                              borderRadius: "8px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {rental.tempRawOTP || "Acquiring..."}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MY OWNED LISTINGS SECTION */}
            <div className="dashboard-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 className="section-title">My Published Items</h2>
                <Link to="/items/new" className="btn btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                  + Add New
                </Link>
              </div>

              {myListings.length === 0 ? (
                <div style={{ padding: "3rem 1rem", border: "1.5px dashed #cbd5e1", borderRadius: "14px", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>You haven't listed any items for rent yet.</p>
                  <Link to="/items/new" className="btn btn-primary">
                    List Your First Item
                  </Link>
                </div>
              ) : (
                <div className="items-grid">
                  {myListings.map((item) => (
                    <div key={item._id} className="item-card" style={{ height: "auto" }}>
                      <div className="card-image-wrapper">
                        <img
                          src={item.images?.[0] || "https://via.placeholder.com/300x200"}
                          alt={item.title}
                          className="card-image"
                        />
                        <span
                          className="category-badge"
                          style={{
                            background: item.isAvailable ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)",
                          }}
                        >
                          {item.isAvailable ? "Available" : "Borrowed"}
                        </span>
                      </div>
                      <div className="card-content" style={{ padding: "1rem" }}>
                        <h3 className="card-title" style={{ height: "1.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "1rem" }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.25rem" }}>
                          ₹{Math.round(item.dailyRate * 90)} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>/ day</span>
                        </p>
                        
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                          <button
                            onClick={() => handleDeleteListing(item._id)}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: "0.4rem", fontSize: "0.8rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.15)" }}
                          >
                            Delete
                          </button>
                          <Link
                            to={`/items/${item._id}`}
                            className="btn btn-primary"
                            style={{ flex: 1, padding: "0.4rem", fontSize: "0.8rem", boxShadow: "none" }}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Loans History for Lender */}
            {completedRentals.length > 0 && (
              <div className="dashboard-section">
                <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Past Loans History</h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {completedRentals.map((rental) => (
                    <div
                      key={rental._id}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        padding: "1rem 1.25rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        opacity: 0.8,
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <img
                          src={rental.item?.images?.[0] || "https://via.placeholder.com/150"}
                          alt={rental.item?.title}
                          style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }}
                        />
                        <div>
                          <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>{rental.item?.title}</h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Completed on: {new Date(rental.updatedAt).toLocaleDateString()} | Renter: {rental.tenant?.name || "Hidden"}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {rental.status === "Completed" && (
                          <button
                            onClick={() => openChat(rental._id)}
                            className="btn btn-secondary btn-chat"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "10px" }}
                          >
                            View Chat
                          </button>
                        )}
                        {rental.status === "Completed" && !rental.ratedByOwner && (
                          <button
                            onClick={() => openRatingModal(rental._id)}
                            className="btn btn-primary"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "10px", boxShadow: "none" }}
                          >
                            ⭐ Rate Borrower
                          </button>
                        )}
                        {rental.status === "Completed" && rental.ratedByOwner && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                            Rated
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "10px",
                            background: rental.status === "Completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: rental.status === "Completed" ? "#059669" : "#dc2626",
                            fontWeight: 700,
                          }}
                        >
                          {rental.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Floating Chat Drawer Integration (Phase 10) */}
      <ChatDrawer
        rentalId={selectedChatRentalId}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setSelectedChatRentalId(null);
        }}
      />

      {/* Interactive Review & Rating Modal (Phase 11) */}
      <AnimatePresence>
        {isRatingModalOpen && (
          <>
            {/* Modal backdrop */}
            <motion.div
              className="chat-backdrop"
              style={{ zIndex: 1000, opacity: 0.6 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closeRatingModal}
            />

            {/* Modal Box */}
            <motion.div
              className="rating-modal-box"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "480px",
                padding: "2rem",
                zIndex: 1001,
              }}
              initial={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
              transition={{ type: "spring", duration: 0.35 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Submit Transaction Review</h3>
                <button
                  onClick={closeRatingModal}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleRatingSubmit}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    How would you rate your peer interaction experience?
                  </p>
                  
                  {/* Star Rating buttons */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", margin: "0.75rem 0" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingValue(star)}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: "2.25rem",
                          cursor: "pointer",
                          color: star <= ratingValue ? "var(--primary)" : "#cbd5e1",
                          transition: "transform 0.1s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>
                    {ratingValue === 1 && "Poor 😞"}
                    {ratingValue === 2 && "Fair 😐"}
                    {ratingValue === 3 && "Good 🙂"}
                    {ratingValue === 4 && "Very Good! 😄"}
                    {ratingValue === 5 && "Outstanding! 🌟"}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                    Feedback Comments
                  </label>
                  <textarea
                    placeholder="Write a brief comment about user responsiveness, item condition, or handover punctuality..."
                    className="form-control"
                    rows="4"
                    maxLength="500"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    disabled={ratingSubmitting}
                    style={{ resize: "none" }}
                  />
                  <div style={{ textAlign: "right", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {ratingComment.length}/500 characters
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={closeRatingModal}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={ratingSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={ratingSubmitting}
                  >
                    {ratingSubmitting ? "Submitting..." : "Submit Rating"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default Dashboard;
