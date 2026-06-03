import { AnimatePresence } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";
import Navbar from "./components/Navbar.jsx";
import CustomCursor from "./components/CustomCursor.jsx";

function App() {
  return (
    <div className="app-shell">
      <CustomCursor />
      <Navbar />
      <AnimatePresence mode="wait">
        <AppRoutes />
      </AnimatePresence>
    </div>
  );
}

export default App;
