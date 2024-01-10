// require in the MongoDB client
const MongoClient = require("mongodb").MongoClient;

// read the variables from the .env file
// and save it to process.env
require("dotenv").config();

const mongoURL = process.env.MONGO_URL;

// we are going to use `await` to wait for some
// asynchronous operation to finish
async function main() {
 // create the mongo client
 // the conenction function has two parameters
 // the first parameter: connection string (get from your Mongo Atlas)
 // the second parameter: options
 const client = await MongoClient.connect(mongoURL, {
    "useUnifiedTopology": true // it's for using the latest version of MongoDB
 });
 // connection
 const db = client.db("sample_airbnb");
 console.log("database connected");
 // mongoshell: db.listingsAndReviews.find().limit(10)
 const listings = await db.collection("listingsAndReviews").find().limit(10).toArray();
 console.log(listings);
}
main();