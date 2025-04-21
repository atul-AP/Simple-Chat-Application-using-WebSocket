const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto"); // For generating unique chat IDs

const app = express();
const server = http.createServer(app);

// Enable large buffer support for audio/image transfer
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10MB
  cors: {
    origin: "*", // Update if you want to restrict
    methods: ["GET", "POST"]
  }
});

const users = {};

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Parse incoming JSON requests
app.use(express.json());

// === Socket.IO Events ===
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // User joins chat
  socket.on("joinRoom", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined.`);

    // Notify others
    socket.broadcast.emit("message", {
      user: "Bot",
      text: `${username} joined the chat.`,
      time: new Date().toLocaleTimeString()
    });

    // Update active user list
    io.emit("activeUsers", Object.values(users));
  });

  // Text chat message
  socket.on("chatMessage", (msg) => {
    const user = users[socket.id] || "Anonymous";
    const messageData = {
      user,
      text: msg,
      time: new Date().toLocaleTimeString()
    };

    console.log("💬 Text Message:", messageData);
    io.emit("message", messageData);
  });

  // Voice message (base64 or binary blob)
  socket.on("voiceMessage", (data) => {
    console.log("🎙️ Voice Message received");
    io.emit("voiceMessage", data);
  });

  // Image message (base64 or blob)
  socket.on("imageMessage", (data) => {
    console.log("🖼️ Image Message received");
    io.emit("imageMessage", data);
  });

  // User leaves chat
  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];

    console.log(`❌ ${username} disconnected.`);

    // Notify others
    io.emit("message", {
      user: "Bot",
      text: `${username} left the chat.`,
      time: new Date().toLocaleTimeString()
    });

    io.emit("activeUsers", Object.values(users));
  });
});

// === Generate Unique Chat Link ===
// Function to generate a unique chat link (chat ID)
function generateUniqueChatID() {
  return crypto.randomBytes(16).toString("hex"); // Generates a unique chat ID
}

// Endpoint to generate chat link
app.get("/generateChatLink", (req, res) => {
  const uniqueChatID = generateUniqueChatID();
  const chatLink = `${req.protocol}://${req.get("host")}/chat/${uniqueChatID}`;
  console.log("Generated Chat Link:", chatLink);

  // Return the generated chat link
  res.json({ chatLink });
});

// Optional: handle message saving
app.post("/saveMessage", (req, res) => {
  // You can implement MongoDB or file saving here
  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
