const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ph-8.7tjeuwe.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("tikidocsDB");
    const userCollection = database.collection("users");
    const postsCollection = database.collection("posts");
    const announcementCollection = database.collection("announcements");

    // users collection api
    app.post("/api/v1/users", async (req, res) => {
      const user = req.body;
      // check user email already existis or not
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send({ result });
    });
    
    // get all users

    app.get("/api/v1/users", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send({ result });
    });

    // make admin api
    app.put("/api/v1/users/admin/:id", async(req, res) => {
      const id = req.params.id;
      const userInfo = req.body;
      const filter = { _id: new ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: userInfo.status,
          statusPhotoUrl: userInfo.statusPhotoUrl,
          role: userInfo.role
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // checking admin role
    app.get("/api/v1/users/admin", async(req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role ==='admin';
      }
      res.send({admin});
    })

    // user posts api

    app.post("/api/v1/posts", async(req, res) => {
      const post = req.body;
      const result = await postsCollection.insertOne(post);
      res.send({result});
    })

    // admin post announcements
    app.post("/api/v1/announcement", async(req, res) => {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement);
      res.send({result});
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("TikiDocs Server is running successfully");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
