const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bcohrzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const assignmentsCollection = client.db('assignmentsCollectionDB').collection('assignmentsCollection');
        const takeAssignmentsCollection = client.db('assignmentsCollectionDB').collection('takeAssignmentsCollection');
        const submittedAssignmentsCollection = client.db('assignmentsCollectionDB').collection('submittedAssignmentsCollection');
        // const countriesCollection = client.db('touristsSpotDB').collection('countries');

        app.get('/createAssignments', async (req, res) => {
            const cursor = assignmentsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // get all pending assignments
        app.get('/pendingAssignments', async (req, res) => {
            const cursor = takeAssignmentsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // marked assignment data
        app.get('/pendingAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await takeAssignmentsCollection.findOne(query);
            res.send(result);
        })
        // app.get('/pendingAssignments/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await takeAssignmentsCollection.findOne(query);
        //     res.send(result);
        // })

        app.get("/pendingAssignmentsEmail/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };

            // Assuming BorrowedBooksCollection.find() returns a promise
            const cursor = takeAssignmentsCollection.find(query);
            const result = await cursor.toArray();
            // Send the result as response
            res.send(result);
        })

        app.put('/pendingAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedSpot = req.body;
            const spot = {
                $set: {

                    // photoURL: updatedSpot.photoURL,
                    // title: updatedSpot.title,
                    status: 'completed',
                    getMarks: updatedSpot.getMarks,
                    // difficulty: updatedSpot.difficulty,
                    // dueDate: updatedSpot.dueDate,
                    // userEmail: updatedSpot.userEmail,
                    // shortDescription: updatedSpot.shortDescription
                }
            }
            const result1 = await takeAssignmentsCollection.deleteOne(filter);
            const result = await submittedAssignmentsCollection.updateOne(filter, spot, options);
            res.send(result);
        })


        // update
        app.get('/createAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentsCollection.findOne(query);
            res.send(result);
        })

        app.put('/createAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedSpot = req.body;
            const spot = {
                $set: {

                    photoURL: updatedSpot.photoURL,
                    title: updatedSpot.title,
                    marks: updatedSpot.marks,
                    difficulty: updatedSpot.difficulty,
                    dueDate: updatedSpot.dueDate,
                    userEmail: updatedSpot.userEmail,
                    shortDescription: updatedSpot.shortDescription
                }
            }

            const result = await assignmentsCollection.updateOne(filter, spot, options);
            res.send(result);
        })

        // Delete operation for specific user
        app.get('/createAssignments/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const cursor = assignmentsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/createsAssignments/difficulty/:fieldValue', async (req, res) => {
            const fieldValue = req.params.fieldValue;

            // Constructing the query object to filter based on user email and another field
            const query = {
                difficulty: fieldValue,
            };

            // Finding sculptures based on the constructed query
            const cursor = assignmentsCollection.find(query);

            try {
                // Converting cursor to array of documents
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching difficulty:", error);
                res.status(500).send("Error fetching difficulty");
            }
        });

        app.post('/createAssignments', async (req, res) => {
            const newAssignment = req.body;
            console.log(newAssignment);
            const result = await assignmentsCollection.insertOne(newAssignment);
            res.send(result);
        });

        // save the data in db
        app.post('/takeAssignments', async (req, res) => {
            const newTakeAssignment = req.body;
            console.log(newTakeAssignment);
            // Generate a new ObjectId for the document
            newTakeAssignment._id = new ObjectId();
            console.log(newTakeAssignment);
            const result = await takeAssignmentsCollection.insertOne(newTakeAssignment);
            const result1 = await submittedAssignmentsCollection.insertOne(newTakeAssignment);
            res.send(result);
        })

        // submitted assignment for specific user
        app.get('/takeAssignments/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = submittedAssignmentsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.delete('/createAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentsCollection.deleteOne(query);
            res.send(result);
            if (result.deletedCount === 1) {
                console.log("Successfully deleted one document.");
            } else {
                console.log("No documents matched the query. Deleted 0 documents.");
            }
        })

        app.post('/marked-assignment/:id',async(req,res)=>{
  const AssignmentId = req.params.id;
  console.log(AssignmentId);
  const query = {_id: new ObjectId(AssignmentId)};
  const takeAssignment = await takeAssignmentsCollection.findOne(query);
  console.log(takeAssignment);
})


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Study Sphere server is running')
})

app.listen(port, () => {
    console.log(`Study Sphere server is running on port: ${port}`)
})