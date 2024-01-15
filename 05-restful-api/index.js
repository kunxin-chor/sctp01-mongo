const express = require('express');
const cors = require('cors'); // cross origin resources sharing
const { ObjectId } = require('mongodb');
const {authenticateToken} = require('./middlewares');

require("dotenv").config();

const app = express();

app.use(cors()); // make sure cors() is a function call

// req.body will only be available as JSON if we have the line below  
app.use(express.json());

// make sure to put `./` to specify
// that we to require from the `mongoUtil.js`
// that is in the same directory as the current file (i.e, index.js)
const { connect } = require("./mongoUtil");
// alternative long form: const connect = require("./mongoUtil").connect;

// usually in the industry, if the varianle name is in full caps,
// it is a global constant
const COLLECTION = "foodRecords";
const DB_NAME = process.env.DB_NAME;


async function main() {
    const db = await connect(process.env.MONGO_URL, DB_NAME);

    // findOne will return one result instead of an array
    async function findFoodByID(foodId) {
        const foodRecord = await db.collection(COLLECTION).findOne({
            "_id": new ObjectId(foodId)
        });
        return foodRecord;
    }


    app.get("/foods", async function (req, res) {

        const { foodName, minCalories, maxCalories } = req.query;

        let searchCriteria = {};

        let searchByFoodNameOrTags = [];

        if (foodName) {
            searchByFoodNameOrTags.push({
                "foodName": {
                    "$regex": foodName,
                    "$options": "i"
                }
            })
            searchByFoodNameOrTags.push({
                "tags": foodName
            })

            searchCriteria["$or"] = searchByFoodNameOrTags
        }

        if (minCalories || maxCalories) {
            searchCriteria.calories = {};

            if (minCalories) {
                searchCriteria.calories["$gte"] = parseInt(minCalories);
            }
            if (maxCalories) {
                searchCriteria.calories["$lte"] = parseInt(maxCalories);
            }

        }


        // We want to retrieve the documents from the collections
        // and convert it to an array of JSON objects
        const foodRecords = await db.collection(COLLECTION)
            .find(searchCriteria, {
                'projection': {
                    'foodName': 1,
                    'tags': 1,
                    'calories': 1
                }
            })
            .toArray();

        res.json({
            foodRecords
        })
    })

    // For processes like C, U and D, NEVER mention the verb inside the URL
    app.post("/food", authenticateToken, async function (req, res) {
        // anything retrieved is from req.body is a string, not number
        const foodName = req.body.foodName;
        const calories = req.body.calories;

        if (!foodName) {
            res.status(400);
            res.json({
                "error":"Please enter foodname"
            })
            return; // end the function
        }

        if (isNaN(calories) || calories < 0) {
            res.status(400);
            res.json({
                "error":"Please enter calories and make sure it is 0 or greater"
            })
            return; // end the function
        }

        let tags = req.body.tags;
        if (tags) {
            // check if tags is already an array or a string?
            if (!Array.isArray(tags)) {
                tags = [tags];
            }
        } else {
            // if tag is undefined set to an empty array (meaning no tags selected)
            tags = [];
        }

        const results = await db.collection(COLLECTION).insertOne({
            "foodName": foodName,
            "calories": Number(calories),
            "tags": tags
        })
  
        res.json({
            "message": "Added successfully",
            "results": results

        })

    });


    app.delete("/food/:foodRecordId", async function (req, res) {
        const results = await db.collection(COLLECTION).deleteOne({
            '_id': new ObjectId(req.params.foodRecordId)
        })
        res.json({
            results
        });
    })


    app.put("/food/:foodRecordId", async function (req, res) {
        // anything retrieved is from req.body is a string, not number
        const foodName = req.body.foodName;
        const calories = req.body.calories;
        let tags = req.body.tags;
        if (tags) {
            // check if tags is already an array or a string?
            if (!Array.isArray(tags)) {
                tags = [tags];
            }
        } else {
            // if tag is undefined set to an empty array (meaning no tags selected)
            tags = [];
        }

        const results = await db.collection(COLLECTION).updateOne({
            "_id": new ObjectId(req.params.foodRecordId)
        }, {
            "$set": {
                "foodName": foodName,
                "calories": Number(calories),
                "tags": tags
            }
        });


        res.json(results);
    })

    app.post("/food/:foodid/note", async function (req, res) {
        const foodId = req.params.foodid;
        const noteContent = req.body.noteContent;
        const response = await db.collection(COLLECTION)
            .updateOne({
                "_id": new ObjectId(foodId)
            }, {
                "$push": {
                    "notes": {
                        '_id': new ObjectId(),
                        'content': noteContent
                    }
                }
            })
        res.json({
            results: response
        })

    })

    app.get("/food/:foodid", async function (req, res) {
        const foodRecord = await findFoodByID(req.params.foodid);
        res.json({foodRecord})
    });

    app.delete("/food/:foodid/note/:noteid", async function (req, res) {
        const { foodid, noteid } = req.params;
        // const foodid = req.params.foodid;
        // const noteid = req.params.noteid;

        const results = await db.collection(COLLECTION).updateOne({
            "_id": new ObjectId(foodid)
        }, {
            '$pull': {
                "notes": {
                    "_id": new ObjectId(noteid)
                }
            }
        })

        res.json({
            results
        })
    })

    
    app.put('/food/:foodid/note/:noteid', async function (req, res) {

        const { foodid, noteid } = req.params;
        const results = await db.collection(COLLECTION)
            .updateOne({
                '_id': new ObjectId(foodid),
                'notes._id': new ObjectId(noteid)
            }, {
                '$set': {
                    'notes.$.content': req.body.noteContent
                }
            })

        res.json({
            results
        })
    });

    // user routes
    app.use('/users', require('./users'));

}


main();

app.listen(3000, function () {
    console.log("Server has started");
})