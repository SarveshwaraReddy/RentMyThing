import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import authService from "../services/auth.js";

const Navbar = () => {
  const { user, isAuthenticated, setUser, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Successfully logged out.");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Try again.");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand logo */}
        <Link to="/" className="navbar-logo">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span>RentMyThing</span>
        </Link>

        {/* Dynamic navigation links */}
        <div className="navbar-links">
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Marketplace
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Profile
              </NavLink>
            </>
          )}
        </div>

        {/* User login actions */}
        <div className="navbar-user-actions">
          {isAuthenticated ? (
            <>
              <Link to="/items/new" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                + Share Item
              </Link>
              <div className="owner-summary" style={{ gap: "0.75rem" }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="owner-avatar" />
                ) : (
                  <div className="owner-avatar-placeholder">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" style={{ fontWeight: 600 }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.5rem 1.15rem", fontSize: "0.875rem" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
