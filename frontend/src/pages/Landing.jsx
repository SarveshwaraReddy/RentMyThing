import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Landing = () => {
  const { isAuthenticated } = useAuth();

  // Motion variants for staggered child entry
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 15,
      },
    },
  };

  return (
    <div className="landing-page-wrapper" style={{ overflow: "hidden" }}>
      {/* 1. Hero Section */}
      <section className="landing-hero" style={{ padding: "5rem 1.5rem 4rem", position: "relative" }}>
        <div className="hero-container" style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
          
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.1 }}
            className="hero-text-block"
          >
            <span
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "var(--primary)",
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                display: "inline-block",
                marginBottom: "1rem",
              }}
            >
              🔒 Campus Peer-to-Peer Rentals
            </span>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 850, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
              Share More.<br />
              <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Spend Less.
              </span><br />
              Rent Locally.
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "2rem", maxWidth: "480px" }}>
              The ultimate college sharing portal. Safely rent out items you own or borrow calculators, scooters, textbooks, and gear directly from verified peers on campus.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/marketplace" className="btn btn-primary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem", boxShadow: "var(--shadow-md)" }}>
                Browse Marketplace
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}>
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/register" className="btn btn-secondary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}>
                  Join Community
                </Link>
              )}
            </div>
          </motion.div>

          {/* Right SVG Graphic Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 40, delay: 0.2 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            {/* Visual CSS/SVG Graphic of Circle Sharing Ecosystem */}
            <svg viewBox="0 0 500 500" width="100%" maxWidth="450px" style={{ filter: "drop-shadow(0 15px 30px rgba(99, 102, 241, 0.15))" }}>
              {/* Outer circular track */}
              <circle cx="250" cy="250" r="180" fill="none" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="8 8" />
              
              {/* Central Shield badge */}
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <circle cx="250" cy="250" r="60" fill="url(#shieldGrad)" />
              <path d="M236 242l10 10 18-18" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Nodes representing users/items sharing */}
              {/* Item 1: Camera */}
              <g transform="translate(250, 70)">
                <circle r="30" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
                <text x="0" y="8" fontSize="22" textAnchor="middle">📷</text>
              </g>
              {/* Item 2: Scooter */}
              <g transform="translate(430, 250)">
                <circle r="30" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
                <text x="0" y="8" fontSize="22" textAnchor="middle">🛴</text>
              </g>
              {/* Item 3: Text Book */}
              <g transform="translate(250, 430)">
                <circle r="30" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
                <text x="0" y="8" fontSize="22" textAnchor="middle">📚</text>
              </g>
              {/* Item 4: Tools */}
              <g transform="translate(70, 250)">
                <circle r="30" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
                <text x="0" y="8" fontSize="22" textAnchor="middle">🔧</text>
              </g>
              
              {/* Connected sharing flows */}
              <path d="M250 100v90" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="4 4" />
              <path d="M400 250h-90" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="4 4" />
              <path d="M250 400v-90" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="4 4" />
              <path d="M100 250h90" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="4 4" />
            </svg>
          </motion.div>

        </div>
      </section>

      {/* 2. Trust statistics section */}
      <section className="stats-section" style={{ background: "#f8fafc", padding: "4rem 1.5rem", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2.5rem" }}
        >
          <motion.div variants={itemVariants} className="stat-card" style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2.75rem", fontWeight: 850, color: "var(--primary)", marginBottom: "0.25rem" }}>100%</div>
            <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.5rem" }}>Campus Verified</strong>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Rent with confidence. Only verified campus community members can listing or rent items.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="stat-card" style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2.75rem", fontWeight: 850, color: "var(--primary)", marginBottom: "0.25rem" }}>0%</div>
            <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.5rem" }}>Platform Fees</strong>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              No subscriptions, hidden costs, or listing service cuts. Every cent stays between peer student accounts.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="stat-card" style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2.75rem", fontWeight: 850, color: "var(--primary)", marginBottom: "0.25rem" }}>100s</div>
            <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.5rem" }}>Active Listings</strong>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Find textbooks, cameras, camping supplies, monitors, charging bricks, and party speakers near you.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. Core Features Section */}
      <section className="features-section" style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 850, marginBottom: "0.5rem" }}>Designed for Campus Life</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Features built specifically to ensure fast, secure, and hassle-free peer sharing.</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem" }}
          >
            {/* Feature 1 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📍</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Geospatial Discovery</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Filter listings by geographic proximity. Search for available devices and resources in your specific library block, dorm, or department.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤝</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Handshake Verification</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                A secure handover OTP system hashes codes on checkouts. Confirm pickup and return states instantly to protect deposits.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💬</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Real-Time Messaging</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                An integrated sliding chat drawer connects tenants and owners via secure socket connections to coordinate pick-ups.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌟</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Peer Trust Systems</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Submit reviews and star ratings for transaction partners. Explore trust histories and feedback records directly on user profiles.
              </p>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* 4. How it Works section */}
      <section className="how-it-works" style={{ background: "#f8fafc", padding: "5rem 1.5rem", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 850, marginBottom: "0.5rem" }}>How RentMyThing Works</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Sharing items on campus has never been simpler.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", position: "relative" }}>
            
            {/* Step 1 */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              <div style={{ background: "var(--primary)", color: "#ffffff", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>1</div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Browse & Request</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Find tools, textbooks, or tech accessories near your campus coordinates. Send a rental request selecting start and end dates.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              <div style={{ background: "var(--primary)", color: "#ffffff", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>2</div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Coordinate via Chat</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Once approved, open the live chat drawer to coordinate a quick handover location (e.g., student union or library cafe).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              <div style={{ background: "var(--primary)", color: "#ffffff", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>3</div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Confirm with Handshake OTP</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Meet in person, inspect the item, and enter the lender's 6-digit handshake code to secure the rental transaction contract.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              <div style={{ background: "var(--primary)", color: "#ffffff", width: "40px", height: "40px", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 800, flexShrink: 0 }}>4</div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Return & Submit Feedback</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  When the rental ends, return the item, mark it complete, and submit ratings to build the student trust network.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. CTA Footer block */}
      <section style={{ padding: "6rem 1.5rem", textAlign: "center", background: "var(--gradient-primary)", color: "#ffffff", position: "relative" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 850, marginBottom: "1.25rem" }}>Ready to Start Sharing?</h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: "2.5rem", lineHeight: 1.6 }}>
            Join hundreds of campus peers cutting resource waste, saving rental costs, and earning extra cash.
          </p>
          <Link
            to="/register"
            className="btn"
            style={{
              background: "#ffffff",
              color: "var(--primary)",
              padding: "1rem 2.25rem",
              borderRadius: "14px",
              fontWeight: 750,
              fontSize: "1.1rem",
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
              textDecoration: "none",
            }}
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ padding: "2rem 1.5rem", borderTop: "1px solid var(--border-color)", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <p>© 2026 RentMyThing Inc. Built for student campus sharing. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
