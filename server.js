const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {};

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);

    if (data.type === "join") {
      const room = data.room;
      ws.room = room;

      if (!rooms[room]) {
        rooms[room] = [];
      }

      rooms[room].push(ws);

      if (rooms[room].length === 2) {
        rooms[room].forEach((client, i) =>
          client.send(JSON.stringify({ type: "start", player: i + 1 }))
        );
      }
    }

    if (data.type === "move") {
      const room = ws.room;
      if (rooms[room]) {
        rooms[room].forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "opponentMove", hand: data.hand }));
          }
        });
      }
    }
  });

  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
    }
  });
});
