const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "public")));
app.use(cookieParser());

let users = [
  { username: "a", password: "a", balance: 1000 },
  { username: "b", password: "b", balance: 1000 }
];

function getAdmin(user) {
  for (let i = 0; i < users.length; i++) {
    if (
      users[i].username == user.username &&
      users[i].password == user.password
    ) {
      return users[i];
    }
  }
}

let sessions = {};

app.post("/api/login", function(req, res) {
  let body = req.body;
  let user = getAdmin(body);
  if (user) {
    let sessionId = "session-" + Date.now() + Math.random() * 1000;
    res.cookie("sessionId", sessionId, { httpOnly: true });
    res.cookie("token", "token_" + sessionId);
    sessions[sessionId] = { user };
    res.json({ code: 0, user });
  } else {
    res.json({ code: 1, error: "用户密码错误" });
  }
});
app.get("/userInfo", function(req, res) {
  let session = sessions[req.cookies.sessionId];
  if (session && session.user) {
    res.json({ code: 0, user: session.user });
  } else {
    res.json({ code: 1, error: "用户未登陆" });
  }
});
app.post("/api/transfer", function(req, res) {
  let session = sessions[req.cookies.sessionId];
  if (session && session.user) {
    let { target, amount, clientToken } = req.body;
    if (clientToken == "token_" + req.cookies.sessionId) {
      amount = isNaN(amount) ? 0 : Number(amount);
      for (let i = 0; i < users.length; i++) {
        if (users[i].username == session.user.username) {
          users[i].balance -= amount;
        } else if (users[i].username == target) {
          users[i].balance += amount;
        }
      }
      res.json({ code: 0 });
    } else {
      res.json({ code: 1, error: "token验证失败" });
    }
  } else {
    res.json({ code: 1, error: "用户未登陆" });
  }
});

app.listen(3002);
