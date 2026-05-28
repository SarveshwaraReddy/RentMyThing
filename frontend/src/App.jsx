import { AnimatePresence } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <AnimatePresence mode="wait">
        <AppRoutes />
      </AnimatePresence>
    </div>
  );
}

export default App;
