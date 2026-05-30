import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error("Please login to access this page.");
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="shimmer-card" style={{ width: "100%", maxWidth: "600px", height: "300px" }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
