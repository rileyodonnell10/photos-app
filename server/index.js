const { createServer } = require("http");

const cors = require("cors");

const photos = require("./photos");

const app = require("express")();
const WebSocket = require("ws");

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({});
});

app.get("/photos", (req, res) => {
  res.status(200).json({ photos });
});

const clients = new Set();

app.post("/website/photos/:id", (req, res) => {
  const photo = photos.find((p) => {
    return p.id === req.params.id;
  });
  if (!photo) {
    res.status(404).json({ error: "photo not found" });
    return;
  }
  if (photo.website) {
    res.status(400).json({ error: "photo already sent to website" });
    return;
  }

  photo.website = "PENDING_APPROVAL";
  // Send back an approval randomly between 3 and 7 seconds.
  const timeout = (3 + Math.floor(Math.random() * 4)) * 1000;
  setTimeout(() => {
    photo.website = "WEBSITE_APPROVED";
    clients.forEach((ws) => {
      ws.send(JSON.stringify({ event: "WEBSITE_APPROVED", photo }));
    });
  }, timeout);
  res.status(200).json({ photo });
});

const port = process.env.PORT || 3001;
const server = createServer(app);
server.listen(port, () => {
  console.log(`Starting server on port ${port}`);
});

const wss = new WebSocket.Server({ path: "/ws", server });
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WebSocket connection established");

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket connection closed");
  });
});
