const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    res.status(401).send({error: true, message: 'unauthorize access'});
  }
  
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if(error){
      res.status(401).send({error: true, message: 'unauthorize access'});
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.USERDB_NAME}:${process.env.USERDB_PASS}@cluster0.5a8lj4m.mongodb.net/?retryWrites=true&w=majority`;

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

    const reviewCollection = client.db("hairCutting").collection("reviews");
    const serviceCollection = client.db("hairCutting").collection("services");
    const userCollection = client.db("hairCutting").collection("user");

    //jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //user api
    app.post('/user', async (req, res) => {
        const user = req.body;
        console.log(user);
        const query = {email : user.email}
        const existingUser = await userCollection.findOne(query);
        console.log(existingUser);
        if(existingUser){
          return res.send({message: 'User already exist.'})
        }
        const result = await userCollection.insertOne(user);
       res.send(result);
    });

    //get all user
    app.get('/alluser', async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    
    //make admin role
    app.patch('/admin/user/:id', async(req, res) => {
      const id = req.params.id;
      const filter = (_id = new ObjectId(id))
      const updateDoc ={
        $set: {
          role : "admin"
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    //services api
    app.get("/service", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    //review collection
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });



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
  res.send("hair cutting shop are open!");
});

app.listen(port, () => {
  console.log(`hair cutting shop are opne on port ${port}`);
});

//name : hairCuttingUser
//pass : oAuVlfasez4eGAGM
