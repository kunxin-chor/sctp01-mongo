const express = require("express");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

const app = express();
app.set("view engine", "hbs");

async function main() {
    const client = await MongoClient.connect(process.env.MONGO_URL);
    const db = client.db("sample_airbnb");

    // req: whatever the frontend is sending to the backend
    // res: whatever the backend is sending back to the frontend
    app.get("/listings", async function(req,res){
        const listings = await db.collection("listingsAndReviews")
                           .find()
                           .limit(10)
                           .toArray();
        // res.render: send back to the frontend
        // the content of the file specified in the first parameter
        // second parameter: an object (the key is the variable name in the HBS file, the value will
        // be whatever we provide)
        res.render("listings.hbs", {
            "allListings": listings
        });

    })

}
main();

app.listen(3000, function(){
    console.log("Server has started")
})