const express = require("express");
const app = express();
app.use(express.static("public"));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const mongouri =
  "mongodb+srv://" +
  process.env.USER +
  ":" +
  process.env.PASS +
  "@" +
  process.env.MONGOHOST;

// ルーティング
app.get("/", (request, response) => {
  // if(request.cookies.user) {
  //   response.sendFile(__dirname + '/views/index.html');
  //   return;
  // }
  response.sendFile(__dirname + "/views/index.html");
  // response.redirect('/login');
});

app.get("/login", (request, response) => {
  response.sendFile(__dirname + "/views/login.html");
});

app.get("/register", (request, response) => {
  response.sendFile(__dirname + "/views/register.html");
});

app.get("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

app.post("/register", function(req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const col = db.collection("users"); // 対象コレクション
    const user = { name, email, password: hashed(password) }; // 保存対象
    col.insertOne(user, function(err, result) {
      res.redirect("/"); // リダイレクト
      client.close(); // DB を閉じる
    });
  });
});

app.post("/login", function(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const col = db.collection("users"); // 対象コレクション
    const condition = {
      email: { $eq: email },
      password: { $eq: hashed(password) }
    }; // ユーザ名とパスワードで検索する
    col.findOne(condition, function(err, user) {
      client.close();
      if (user) {
        res.cookie("user", user);
        res.redirect("/"); // リダイレクト
      } else {
        res.redirect("/login"); // リダイレクト
      }
    });
  });
});

app.get("/showUser", function(req, res) {
  MongoClient.connect(mongouri, function(err, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colUser = db.collection("users"); // 対象コレクション
    const condition = {};

    colUser.find(condition).toArray(function(err, users) {
      res.json(users); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

app.get("/deleteAllUser", function(req, res) {
  MongoClient.connect(mongouri, function(err, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colUser = db.collection("users"); // 対象コレクション
    const condition = {};

    colUser.deleteMany(condition, function(err, users) {
      res.redirect("/"); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

app.post("/savePost", function(req, res) {
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    // JSONの受け取りが終わるのを待つ
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const post = JSON.parse(received); // 保存対象
      colUser.insertOne(post, function(err, result) {
        // post = {title: xxx, snt: xxx, userId: xxx}
        res.send(decodeURIComponent(result.insertedId)); // 追加したデータの ID を返す
        client.close(); // DB を閉じる
      });
    });
  });
});

app.get("/findPosts", function(req, res) {
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colUser = db.collection("posts"); // 対象コレクション

    // 検索条件（名前が「エクサくん」ではない）
    // 条件の作り方： https://docs.mongodb.com/manual/reference/operator/query/
    const condition = { title: { $ne: "エクサくん" } };

    colUser.find(condition).toArray(function(err, posts) {
      res.json(posts); // レスポンスとしてユーザを JSON 形式で返却
      client.close(); // DB を閉じる
    });
  });
});

app.post("/deletePost", function(req, res) {
  // {id: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const target = JSON.parse(received); // target = {id: xxx}
      const oid = new ObjectID(target.id);

      colUser.deleteOne({ _id: { $eq: oid } }, function(err, result) {
        res.sendStatus(200); // ステータスコードを返す
        client.close(); // DB を閉じる
      });
    });
  });
});

app.post("/updatePost", function(req, res) {
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    // JSONの受け取りが終わるのを待つ
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const post = JSON.parse(received); // 保存対象
      const oid = new ObjectID(post.id);
      colUser.updateOne(
        { _id: { $eq: oid } },
        { $set: { title: post.title, snt: post.snt } },
        { multi: true },
        function(err, result) {
          res.sendStatus(200);
          client.close();
        }
      );
    });
  });
});

app.post("/showDetail", function(req, res) {
  // {id: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const target = JSON.parse(received); // target = {id: xxx}
      const oid = new ObjectID(target.id);
      colUser.find({ _id: { $eq: oid } }).toArray(function(err, posts) {
        res.json(posts); // レスポンスとしてユーザを JSON 形式で返却
        client.close(); // DB を閉じる
      });
    });
  });
});

app.post("/showEditModal", function(req, res) {
  // {id: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const target = JSON.parse(received); // target = {id: xxx}
      const oid = new ObjectID(target.id);
      colUser.find({ _id: { $eq: oid } }).toArray(function(err, posts) {
        res.json(posts); // レスポンスとしてユーザを JSON 形式で返却
        client.close(); // DB を閉じる
      });
    });
  });
});

app.post("/findUserPosts", function(req, res) {
  // {id: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("posts"); // 対象コレクション
      const target = JSON.parse(received); // target = {id: xxx}
      // const oid = new ObjectID();
      colUser
        .find({ userId: { $eq: target.id } })
        .toArray(function(err, posts) {
          res.json(posts); // レスポンスとしてユーザを JSON 形式で返却
          client.close(); // DB を閉じる
        });
    });
  });
});

app.post("/addFav", function(req, res) {
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    // JSONの受け取りが終わるのを待つ
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("favorite"); // 対象コレクション
      const user = JSON.parse(received); // 保存対象
      colUser.insertOne(user, function(err, result) {
        // user = {postId: xxx, userId: xxx}
        // decodeURIComponent(result.insertedId)
        res.sendStatus(200); // 追加したデータの ID を返す
        client.close(); // DB を閉じる
      });
    });
  });
});

app.post("/removeFav", function(req, res) {
  // {id: xxx, userId: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("favorite"); // 対象コレクション
      const target = JSON.parse(received); // target = {id: xxx}

      colUser.deleteOne(
        { postId: { $eq: target.postId }, userId: { $eq: target.userId } },
        function(err, result) {
          res.sendStatus(200); // ステータスコードを返す
          client.close(); // DB を閉じる
        }
      );
    });
  });
});

app.post("/checkAlreadyAddedFav", function(req, res) {
  // {postId: xxx, userId: xxx} がJSONで送られてくる
  let received = "";
  req.setEncoding("utf8");
  req.on("data", function(chunk) {
    received += chunk;
  });
  req.on("end", function() {
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colUser = db.collection("favorite"); // 対象コレクション
      const target = JSON.parse(received); //
      colUser
        .find({
          postId: { $eq: target.postId },
          userId: { $eq: target.userId }
        })
        .toArray(function(err, fav) {
          res.json(fav); // レスポンスとしてユーザを JSON 形式で返却
          client.close(); // DB を閉じる
        });
    });
  });
});

app.get("/deleteAllPosts", function(req, res) {
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colUser = db.collection("posts"); // 対象コレクション
    colUser.deleteMany({}, function(err, result) {
      res.sendStatus(200); // ステータスコードを返す
      client.close(); // DB を閉じる
    });
  });
});

const crypto = require("crypto");

function hashed(password) {
  let hash = crypto.createHmac("sha512", password);
  hash.update(password);
  let value = hash.digest("hex");
  return value;
}

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
