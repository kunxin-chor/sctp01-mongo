const express = require('express');

const { ObjectId } = require('mongodb');
const {findFoodByID} = require("./data");

// setup HBS and template inheritance using wax-on
const hbs = require('hbs');
const waxOn = require('wax-on');
waxOn.setLayoutPath("./views/layouts");
waxOn.on(hbs.handlebars);
const helpers = require('handlebars-helpers')({
    'handlebars': hbs.handlebars
})

require("dotenv").config();

const app = express();
app.set("view engine", "hbs");




// req.body will be always be undefined we app.use express.urlencoded   
app.use(express.urlencoded({
    'extended': false
}))

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
  
    app.get("/", async function (req, res) {

        const {foodName, minCalories, maxCalories} = req.query;

        let searchCriteria = {};

        let searchByFoodNameOrTags = [];

        if (foodName) {
            searchByFoodNameOrTags.push({
                "foodName": {
                    "$regex": foodName,
                    "$options":"i"
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
   

        console.log(searchCriteria);

        // We want to retrieve the documents from the collections
        // and convert it to an array of JSON objects
        const foodRecords = await db.collection(COLLECTION)
            .find(searchCriteria, {
                'projection':{
                    'foodName': 1,
                    'tags': 1,
                    'calories': 1
                }
            })
            .toArray();
        res.render('all-food-records', {
            'foodRecords': foodRecords,
            'searchCriteria': {
                "foodName": foodName,
                "minCalories":minCalories,
                "maxCalories":maxCalories
            }
        })
    })

    // Display the form to add food
    app.get("/add-food", function (req, res) {
        res.render("add-food");
    })

    app.post("/add-food", async function (req, res) {
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

        const results = await db.collection(COLLECTION).insertOne({
            "foodName": foodName,
            "calories": Number(calories),
            "tags": tags
        })
        console.log(results);

        res.redirect("/");

    });

    app.get("/delete-food/:foodRecordId", async function (req, res) {
      
        const foodRecord = await findFoodByID(req.params.foodRecordId);

        res.render("confirm-delete", {
            foodRecord
        })
    });

    app.post("/delete-food/:foodRecordId", async function (req, res) {
        await db.collection(COLLECTION).deleteOne({
            '_id': new ObjectId(req.params.foodRecordId)
        })
        res.redirect("/");
    })

    app.get("/update-food/:foodRecordId", async function (req, res) {
        // findOne will return one result instead of an array
        const foodRecord = await findFoodByID(req.params.foodRecordId);

        res.render("update-food", {
            foodRecord
        })

    })

    app.post("/update-food/:foodRecordId", async function (req, res) {
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
        console.log(results);

        res.redirect("/");
    })

    app.get("/add-note/:foodid", async function(req,res){
        
        // when a line in a try block crashes the program (i.e. raises an exception)
        try {
            const foodId = req.params.foodid;
            const foodRecord = await findFoodByID(foodId);
            if (foodRecord) {
                res.render('add-note', {
                    'food': foodRecord
                })
            } else {
               // error handling
                res.status(404);
                res.send("Food record not found");
            }
        } catch (e) {
            // catching the exception (when there's an error, the program counter
            // will move in the first line the catch block)
            res.status(500);
            res.send("Sorry something went wrong. Please try again later");
        }
    
    });

    app.post("/add-note/:foodid", async function(req,res){
        const foodId = req.params.foodid;
        const noteContent = req.body.noteContent;
        const response = await db.collection(COLLECTION)
                                .updateOne({
                                    "_id": new ObjectId(foodId)
                                }, {
                                    "$push":{
                                        "notes": {
                                            '_id': new ObjectId(),
                                            'content': noteContent
                                        }
                                    }
                                })
        res.redirect("/view-food/" + foodId );

    })

    app.get("/view-food/:foodid", async function(req, res){
        const foodRecord = await findFoodByID(req.params.foodid);
        res.render('view-food',{
            'food': foodRecord
        })
    });

    app.get("/food/:foodid/delete-note/:noteid", async function(req,res){
        const {foodid, noteid} = req.params;
        // const foodid = req.params.foodid;
        // const noteid = req.params.noteid;
        
        await db.collection(COLLECTION).updateOne({
            "_id": new ObjectId(foodid)
        },{
            '$pull': {
                "notes":{
                    "_id": new ObjectId(noteid)
                }
            }
        })

        res.redirect('/view-food/' + foodid);
    })

    app.get('/food/:foodid/edit-note/:noteid', async function(req,res){

        const {foodid, noteid} = req.params;
        const foodRecord = await db.collection(COLLECTION).findOne({
          '_id': new ObjectId(foodid)  
        },{
            'projection':{
                'foodName':1,
                'notes': {
                    '$elemMatch':{
                        '_id': new ObjectId(noteid)
                    }
                }
            }
        });
        res.render('edit-note',{
            'foodName': foodRecord.foodName,
            'note': foodRecord.notes[0]
        })
    })

    app.post('/food/:foodid/edit-note/:noteid', async function(req,res){

        const {foodid, noteid} = req.params;  
        await db.collection(COLLECTION)
            .updateOne({
                '_id': new ObjectId(foodid),
                'notes._id': new ObjectId(noteid)
            },{
                '$set':{
                    'notes.$.content': req.body.noteContent
                }
            })
        
        res.redirect('/view-food/' + foodid);
    });  

}


main();

app.listen(3000, function () {
    console.log("Server has started");
})