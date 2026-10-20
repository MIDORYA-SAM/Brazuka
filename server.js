const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingInterval: 25000,
  pingTimeout: 20000
});

const PORT = process.env.PORT || 3000;
const players = new Map();
const MAX_PLAYERS = 80;
const WORLD_LIMIT = 42;

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, players: players.size }));

function cleanText(value, max = 24) {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

io.on("connection", socket => {
  if (players.size >= MAX_PLAYERS) {
    socket.emit("server:full");
    socket.disconnect(true);
    return;
  }

  const name = cleanText(socket.handshake.auth?.name || "Manifestante", 18) || "Manifestante";
  const color = ["#f7d34a", "#35b96f", "#f2f2f2", "#4ca7ff", "#f08b4f", "#d77cff"][
    Math.floor(Math.random() * 6)
  ];
  const player = {
    id: socket.id, name, color,
    x: (Math.random() - 0.5) * 8,
    z: (Math.random() - 0.5) * 8,
    rot: 0,
    banner: "BRASIL"
  };
  players.set(socket.id, player);

  socket.emit("world:init", {
    selfId: socket.id,
    players: [...players.values()],
    maxPlayers: MAX_PLAYERS
  });
  socket.broadcast.emit("player:joined", player);

  socket.on("player:move", data => {
    const p = players.get(socket.id);
    if (!p || !data) return;
    p.x = clamp(Number(data.x) || 0, -WORLD_LIMIT, WORLD_LIMIT);
    p.z = clamp(Number(data.z) || 0, -WORLD_LIMIT, WORLD_LIMIT);
    p.rot = Number(data.rot) || 0;
    io.emit("player:moved", { id: p.id, x: p.x, z: p.z, rot: p.rot });
  });

  socket.on("player:banner", value => {
    const p = players.get(socket.id);
    if (!p) return;
    p.banner = cleanText(value, 32) || "BRASIL";
    io.emit("player:updated", { id: p.id, banner: p.banner });
  });

  socket.on("chat:send", value => {
    const p = players.get(socket.id);
    if (!p) return;
    const message = cleanText(value, 180);
    if (!message) return;
    io.emit("chat:message", {
      id: socket.id, name: p.name, color: p.color,
      message, time: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    players.delete(socket.id);
    io.emit("player:left", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Brasil multiplayer rodando na porta ${PORT}`);
});
