const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require("dotenv").config();

const port = 5000;

const app = express();

var serviceAccount = require("./config/buruj-al-arab-firebase-adminsdk-p6nhv-7efbb439fd.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB,
});

app.use(cors());
app.use(bodyParser.json());

const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n6je5.mongodb.net/burj-al-arab-db?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const bookings = client.db("burj-al-arab-db").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result);
    });
  });

  app.get("/getBookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const decodedEmail = decodedToken.email;
          if (decodedEmail === req.query.email) {
            bookings.find({ email: req.query.email }).toArray((err, docs) => {
              res.send(docs);
            });
          } else {
            res.status(401).send("un-authorized request");
          }
        })
        .catch(function (error) {
          res.status(401).send("un-authorized request");
        });
    } else {
      res.status(401).send("un-authorized request");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
