// mongoUtil : this file contains utility functions related to Mongo
// Any JS file that have functions but does nothing
// but just to export them are known as modules

const {MongoClient} = require('mongodb');
let _db = null;


async function connect(mongoURL, databaseName) {
    const client = await MongoClient.connect(mongoURL);

    // same as switching the database
    const db = client.db(databaseName);
    _db = db;
    return db;
}

function getDB(){
    return _db;
}

module.exports = {
    connect, getDB
};