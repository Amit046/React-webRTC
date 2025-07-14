const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: {
    origin: "*", // allow frontend
    methods: ["GET", "POST"],
  },
});

// For mapping emails & sockets
const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`✅ New socket connected: ${socket.id}`);

  // Room join logic
  socket.on("room:join", (data) => {
    const { email, room } = data;
    console.log(`👤 ${email} joined room ${room}`);

    // Save mapping
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);

    // Join room
    socket.join(room);

    // Notify others in room
    socket.to(room).emit("user:joined", { email, id: socket.id });

    // Notify current user that they joined
    io.to(socket.id).emit("room:join", data);
  });

  // WebRTC: Caller sends offer
  socket.on("user:call", ({ to, offer }) => {
    console.log(`📞 Calling ${to}`);
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  // WebRTC: Callee accepts call
  socket.on("call:accepted", ({ to, ans }) => {
    console.log(`✅ Call accepted by ${socket.id}`);
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  // Negotiation started (like screen sharing or change in stream)
  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("🔄 Negotiation Needed");
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  // Negotiation answer sent
  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("✅ Negotiation Done");
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // 💬 Chat message
  socket.on("chat:msg", ({ to, msg }) => {
    const sender = socketidToEmailMap.get(socket.id) || "Unknown";
    io.to(to).emit("chat:receive", { from: sender, msg });
  });

  // ❌ Call disconnect or leave
  socket.on("call:leave", ({ room }) => {
    console.log(`❌ ${socket.id} left room ${room}`);
    socket.leave(room);
    socket.to(room).emit("user:left", { id: socket.id });
  });

  // On disconnect
  socket.on("disconnect", () => {
    const email = socketidToEmailMap.get(socket.id);
    console.log(`⚠️ Disconnected: ${socket.id} (${email})`);

    if (email) emailToSocketIdMap.delete(email);
    socketidToEmailMap.delete(socket.id);
  });
});
