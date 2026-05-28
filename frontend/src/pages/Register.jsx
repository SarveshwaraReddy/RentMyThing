import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthPageLayout from "../components/AuthPageLayout.jsx";
import authService from "../services/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isInstitutionalEmail, validatePassword, isEmail } from "../utils/validators.js";

const initialState = {
  name: "",
  email: "",
  institution: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const [formValues, setFormValues] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formValues.name || !formValues.institution || !formValues.email || !formValues.password || !formValues.confirmPassword) {
      toast.error("All fields are required.");
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

    if (formValues.password !== formValues.confirmPassword) {
      toast.error("Passwords do not match.");
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
      await authService.register({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        institution: formValues.institution,
      });

      const profile = await authService.getProfile();
      setUser(profile.data.data);
      setIsAuthenticated(true);
      toast.success("Account created successfully.");
      navigate("/dashboard");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Registration failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Create a RentMyThing account"
      subtitle="Sign up with your email to start listing and renting items."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-group">
          <span>Name</span>
          <input
            type="text"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            placeholder="Full name"
            className="form-control"
            disabled={loading}
          />
        </label>

        <label className="form-group">
          <span>Institution</span>
          <input
            type="text"
            name="institution"
            value={formValues.institution}
            onChange={handleChange}
            placeholder="School or college name"
            className="form-control"
            disabled={loading}
          />
        </label>

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
            placeholder="Minimum 8 characters"
            className="form-control"
            disabled={loading}
          />
        </label>

        <label className="form-group">
          <span>Confirm password</span>
          <input
            type="password"
            name="confirmPassword"
            value={formValues.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            className="form-control"
            disabled={loading}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </AuthPageLayout>
  );
};

export default Register;
