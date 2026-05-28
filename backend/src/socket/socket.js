import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Rental from "../models/Rental.js";
import Message from "../models/Message.js";

const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(";").reduce((acc, c) => {
    const parts = c.split("=");
    if (parts.length >= 2) {
      acc[parts[0].trim()] = parts[1].trim();
    }
    return acc;
  }, {});
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Authentication error: Access token missing."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };
      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      return next(new Error("Authentication error: Invalid session."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: User ${socket.user.id}`);

    // Join room for specific rental contract
    socket.on("join_room", async ({ rentalId }) => {
      try {
        if (!rentalId) return;

        const rental = await Rental.findById(rentalId);
        if (!rental) {
          socket.emit("error_message", "Rental contract not found");
          return;
        }

        // Verify if active socket user is participant (owner or tenant)
        if (
          rental.owner.toString() !== socket.user.id.toString() &&
          rental.tenant.toString() !== socket.user.id.toString()
        ) {
          socket.emit("error_message", "Not authorized to access this chat room");
          return;
        }

        socket.join(rentalId);
        console.log(`👤 User ${socket.user.id} joined room: ${rentalId}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error_message", "Failed to join room");
      }
    });

    // Send chat message
    socket.on("send_message", async ({ rentalId, content }) => {
      try {
        if (!rentalId || !content || !content.trim()) return;

        const rental = await Rental.findById(rentalId);
        if (!rental) {
          socket.emit("error_message", "Rental contract not found");
          return;
        }

        // Restrict messaging: must be owner or tenant
        if (
          rental.owner.toString() !== socket.user.id.toString() &&
          rental.tenant.toString() !== socket.user.id.toString()
        ) {
          socket.emit("error_message", "Not authorized to message in this chat");
          return;
        }

        // Restrict messaging: messaging unlocks only after Approved (cannot be Requested or Rejected)
        if (["Requested", "Rejected"].includes(rental.status)) {
          socket.emit(
            "error_message",
            "Chat messaging is locked. The request must be approved by the owner first."
          );
          return;
        }

        // Save Message to DB
        const message = await Message.create({
          rentalId,
          sender: socket.user.id,
          content: content.trim(),
        });

        // Populate sender info for the client view
        const populatedMessage = await message.populate("sender", "name profileImage");

        // Broadcast to room
        io.to(rentalId).emit("receive_message", populatedMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error_message", "Failed to deliver message");
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: User ${socket.user.id}`);
    });
  });

  return io;
};
