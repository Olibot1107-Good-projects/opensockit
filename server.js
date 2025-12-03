const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const rtoken = require("./src/rtoken");
const app = express();
const server = http.createServer(app);   // Create HTTP server
const io = new Server(server);           // Attach socket.io to that server

let connected = 0;
const port = 3000;
let users = [];
// HTTP route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use(cors());
app.use(express.static('public'));

app.get("/token", (req, res) => {
    const domain = req.headers.host
    console.log(`User is requesting token from ${domain}`);
    console.log("User is requesting token");
    const token = rtoken.makeLongRandomString();
    res.send(token);
    console.log(`Sent token (${token})`);
    users.push({ token: `${token}`, time: 20, domain: `${domain}` });
    console.log("Pushed Token to users array");
});

app.get("/tokenupdate", (req, res) => {
    const domain = req.headers.host
    // get ?token=token bit
    const tokenn = req.query.token;
    // update there time to 20
    users.forEach((user) => {
        if (user.token === tokenn) {
            user.time = 20;
            user.domain = domain;
        }
    });
    res.send("Updated token");
});

// Socket.io events
io.on("connection", (socket) => {
  let token = null;
  connected++;
  console.log("a user connected");

  // if they dont send the token in 10s dissconect them
  socket.once("token", (receivedToken) => {
    console.log("User sent token");
    token = receivedToken;
    const user = users.find(u => u.token === token);
    if (user) {
      socket.domain = user.domain;
    }
    socket.emit('token', 'connected');
  });
  socket.on("disconnect", () => {
    connected--;
    console.log("a user disconnected");
    if (token === null) {
        console.log("token is null");
    } else {
        // if there was a token remove it from the users array
        const user = users.find((user) => user.token === token);
        if (user) {
            console.log("user is in the users array");
            users = users.filter((user) => user.token !== token);
            console.log("removed token from users array");
        }
    }
  });
  setTimeout(() => {
    if (token === null) {
      console.log("Timeout");
      socket.disconnect();
    } else {
      console.log("ok");
      // check if they are in the users array
      const user = users.find((user) => user.token === token);
      if (user) {
        console.log("user is in the users array");
        // check time if its 0 disconnect them
        if (user.time < 0) {
          console.log("time is 0");
          socket.disconnect();
        }
      }
    }
  }, 10000);

  socket.on('message', (msg) => {
    io.sockets.sockets.forEach((s) => {
      if (s.domain === socket.domain && s !== socket) {
        s.emit('message', msg);
      }
    });
  });
});

setInterval(() => {
    console.log("checking users");
  users.forEach((u) => {
    if (u.time === -10) {
      console.log("time is -10");

      // Remove the user whose token matches u.token
      users = users.filter((x) => x.token !== u.token);

      console.log("removed token from users array");
    }

    u.time--;
    console.log(`time is ${u.time}`);
  });

}, 1000);


server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
