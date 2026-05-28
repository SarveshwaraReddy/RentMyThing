import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import rentalsService from "../services/rentals.js";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
  : "http://localhost:5000";

const ChatDrawer = ({ rentalId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rentalDetails, setRentalDetails] = useState(null);
  
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Load chat history & details
  useEffect(() => {
    if (!rentalId || !isOpen) return;

    const loadChatData = async () => {
      setLoading(true);
      try {
        const [rentalRes, messagesRes] = await Promise.all([
          rentalsService.getRental(rentalId),
          rentalsService.getChatHistory(rentalId),
        ]);
        setRentalDetails(rentalRes.data.data);
        setMessages(messagesRes.data.data);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        toast.error("Failed to load chat history.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [rentalId, isOpen, onClose]);

  // Set up socket connection
  useEffect(() => {
    if (!rentalId || !isOpen) return;

    // Connect to Socket.io server
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Connected to socket server");
      socket.emit("join_room", { rentalId });
    });

    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("error_message", (errorMsg) => {
      toast.error(errorMsg);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    // Clean up connection on close/unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [rentalId, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!socketRef.current) {
      toast.error("Not connected to chat server. Retrying...");
      return;
    }

    // Emit message event
    socketRef.current.emit("send_message", {
      rentalId,
      content: inputText.trim(),
    });

    setInputText("");
  };

  // Identify chat partner
  const getPartnerName = () => {
    if (!rentalDetails) return "Chat";
    const isOwner = rentalDetails.owner?._id === user?._id;
    return isOwner ? rentalDetails.tenant?.name : rentalDetails.owner?.name;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sliding Chat Drawer */}
          <motion.div
            className="chat-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <header className="chat-drawer-header">
              <div className="partner-info">
                <h3>{getPartnerName()}</h3>
                <span className="chat-subtitle">
                  {rentalDetails?.item?.title || "Listing Discussion"}
                </span>
              </div>
              <button onClick={onClose} className="btn-close-drawer" title="Close Chat">
                &times;
              </button>
            </header>

            {/* Message Body */}
            <div className="chat-drawer-body" ref={scrollRef}>
              {loading ? (
                <div className="chat-loading">
                  <div className="shimmer-line text" style={{ width: "80%" }}></div>
                  <div className="shimmer-line text" style={{ width: "60%", alignSelf: "flex-end", marginTop: "1rem" }}></div>
                  <div className="shimmer-line text" style={{ width: "70%", marginTop: "1rem" }}></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-state">
                  <p>No messages yet. Send a greeting to coordinate handover details!</p>
                </div>
              ) : (
                <div className="chat-messages-container">
                  {messages.map((msg) => {
                    const isMyMessage = (msg.sender?._id || msg.sender) === user?._id;
                    const senderName = msg.sender?.name || "Member";
                    const senderInitial = senderName.charAt(0).toUpperCase();
                    
                    return (
                      <div
                        key={msg._id}
                        className={`chat-message-row ${isMyMessage ? "sent" : "received"}`}
                      >
                        {!isMyMessage && (
                          <div className="chat-avatar-placeholder" title={senderName}>
                            {senderInitial}
                          </div>
                        )}
                        <div className="chat-bubble-wrapper">
                          {!isMyMessage && <span className="bubble-sender">{senderName}</span>}
                          <div className="chat-bubble">
                            <p>{msg.content}</p>
                            <span className="bubble-time">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <footer className="chat-drawer-footer">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="form-control chat-input"
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary btn-send-message" disabled={loading || !inputText.trim()}>
                  Send
                </button>
              </form>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
