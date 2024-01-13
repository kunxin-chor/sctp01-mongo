const {getDB} = require('./mongoUtil');
const { ObjectId } = require('mongodb');
const COLLECTION = "foodRecords";

// findOne will return one result instead of an array
async function findFoodByID(foodId) {
    const db = getDB();
    const foodRecord = await db.collection(COLLECTION).findOne({
        "_id": new ObjectId(foodId)
    });
    return foodRecord;
}

module.exports = { findFoodByID}