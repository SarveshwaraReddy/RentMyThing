import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthPageLayout from "../components/AuthPageLayout.jsx";
import authService from "../services/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isEmail, validatePassword } from "../utils/validators.js";

const initialState = {
  email: "",
  password: "",
  rememberSession: false,
};

const Login = () => {
  const [formValues, setFormValues] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formValues.email || !formValues.password) {
      toast.error("Email and password are required.");
      return false;
    }

    if (!isEmail(formValues.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!validatePassword(formValues.password)) {
      toast.error("Password must be at least 8 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.login({
        email: formValues.email,
        password: formValues.password,
        rememberSession: formValues.rememberSession,
      });

      const profile = await authService.getProfile();
      setUser(profile.data.data);
      setIsAuthenticated(true);
      toast.success("Welcome back.");
      navigate("/dashboard");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Login failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Log in to access your listings, requests, and rentals."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-group">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formValues.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="form-control"
            disabled={loading}
          />
        </label>

        <label className="form-group">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={formValues.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="form-control"
            disabled={loading}
          />
        </label>

        <label className="form-group checkbox-group">
          <input
            type="checkbox"
            name="rememberSession"
            checked={formValues.rememberSession}
            onChange={handleChange}
            disabled={loading}
          />
          <span>Remember session</span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthPageLayout>
  );
};

export default Login;
