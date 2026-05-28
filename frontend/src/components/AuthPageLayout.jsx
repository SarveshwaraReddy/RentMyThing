import { motion } from "framer-motion";

const AuthPageLayout = ({ title, subtitle, children }) => (
  <motion.main
    className="page auth-page"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    <div className="auth-card">
      <header className="auth-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
    </div>
  </motion.main>
);

export default AuthPageLayout;
