import { Route, Routes } from "react-router-dom";
import Landing from "../pages/Landing.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Marketplace from "../pages/Marketplace.jsx";
import AddItem from "../pages/AddItem.jsx";
import ItemDetails from "../pages/ItemDetails.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Profile from "../pages/Profile.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/items/:id" element={<ItemDetails />} />
    
    {/* Private Routes */}
    <Route path="/items/new" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  </Routes>
);

export default AppRoutes;
