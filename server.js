// === server.js ===
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });

const rooms = {}; // 各ルームの状態
console.log(`Room ${room}, Player ${ws.playerNumber} played ${data.hand}`);
console.log('Current moves:', roomData.moves);

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);

    if (data.type === "join") {
      const room = data.room;
      ws.room = room;

      if (!rooms[room]) {
        rooms[room] = { players: [], moves: {} };
      }

      rooms[room].players.push(ws);
      ws.playerNumber = rooms[room].players.length;

      if (rooms[room].players.length === 2) {
        rooms[room].players.forEach((client, i) => {
          client.send(JSON.stringify({ type: "start", player: i + 1 }));
        });
      }
    }

    if (data.type === "move") {
      const roomData = rooms[ws.room];
      if (!roomData) return;

      roomData.moves[ws.playerNumber] = data.hand;

      if (roomData.moves[1] && roomData.moves[2]) {
        // 勝敗判定
        const p1 = roomData.moves[1];
        const p2 = roomData.moves[2];
        const result = judge(p1, p2);

        // 両者に送信（プレイヤー番号付き）
        roomData.players.forEach((client, i) => {
          client.send(JSON.stringify({
            type: "result",
            yourMove: i === 0 ? p1 : p2,
            opponentMove: i === 0 ? p2 : p1,
            outcome: i === 0 ? result.p1 : result.p2
          }));
        });

        // じゃんけん手のリセット
        roomData.moves = {};
      }
    }
  });

  ws.on("close", () => {
    const room = ws.room;
    
    if (room && rooms[room]) {
      rooms[room].players = rooms[room].players.filter((client) => client !== ws);
    }
  });
});

function judge(p1, p2) {
  if (p1 === p2) return { p1: "draw", p2: "draw" };

  const win =
    (p1 === "グー" && p2 === "チョキ") ||
    (p1 === "チョキ" && p2 === "パー") ||
    (p1 === "パー" && p2 === "グー");

  return win
    ? { p1: "win", p2: "lose" }
    : { p1: "lose", p2: "win" };
}
