import dotenv from "dotenv";
import { createServer } from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
