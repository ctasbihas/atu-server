const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Tony Stark snap");
});

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const hotDealToyCollection = client.db("action-toy-universe").collection("hot-deal-toys");
    const blogCollection = client.db("action-toy-universe").collection("blogs");
    const offeredToyCollection = client.db("action-toy-universe").collection("special-offer-toys");
    const toyCollection = client.db("action-toy-universe").collection("toys");

    // Hottest deal toys
    app.get("/hotdealtoys", async (req, res) => {
      const toys = await hotDealToyCollection.find().toArray();
      res.send(toys);
    });

    // Blogs
    app.get("/blogs", async (req, res) => {
      const blogs = await blogCollection.find().toArray();
      res.send(blogs);
    });

    // Special Offered Toys
    app.get("/offeredtoys", async (req, res) => {
      const toys = await offeredToyCollection.find().toArray();
      res.send(toys);
    });

    // Shop By Category
    app.get("/shopbycategory", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }

      const result = await toyCollection.find(query).toArray();
      res.send(result);
    });

    // Toys
    app.post("/toys", async (req, res) => {
      const toyData = req.body;
      const result = await toyCollection.insertOne(toyData);
      res.send(result);
    });
    app.get("/totalToys", async (req, res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });
    app.get("/toys", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const skip = page * limit;
    
      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
      }
    
      let sortOption = {};
    
      if (req.query?.sortBy === "ascending") {
        sortOption = { price: 1 };
      } else if (req.query?.sortBy === "descending") {
        sortOption = { price: -1 };
      }
    
      const result = await toyCollection
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();
    
      res.send(result);
    });
    

    app.get("/toy/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });
    app.put("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = req.body;
      const toy = {
        $set: {
          quantity: updatedToy.quantity,
          price: updatedToy.price,
          description: updatedToy.description,
        },
      };
      const result = await toyCollection.updateOne(filter, toy, options);
      res.send(result);
    });
    app.delete("/toys/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
