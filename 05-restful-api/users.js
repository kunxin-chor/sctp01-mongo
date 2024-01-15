const express = require('express');
const { getDB } = require('./mongoUtil');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('./middlewares');
require('dotenv').config();

// create a new router object
// a router object can have routes
const router = express.Router();

// CUSTOM MIDDLEWARE FOR AUTHENTICATING VIA TOKEN


// put in routes here
router.post('/', async function (req, res) {
    const db = getDB();
    const result = await db.collection("users").insertOne({
        'email': req.body.email,
        'password': await bcrypt.hash(req.body.password, 12)
    })
    res.json({
        "message": "Success",
        "result": result
    })
})

// the full url will be POST /user/logins
// we expect the body to be an object with two keys
// - email: address of the user
// - password: password of the user
router.post('/login', async function (req, res) {
    const db = getDB();
    // find the user by the given req.body.email and the req.body.password
    const user = await db.collection("users").findOne({
        'email': req.body.email,
    });

    // first argument of bcyrpt.compare: plaintext
    // second argument of bcrypt.compare: the hashed version
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        // user exists and the password given matches the hashed version
        // create the token with jwt.sign
        // 1st parameter: the data to store in the JWT (we must store some identifying information about the user)
        // 2nd parameter: jwt secret
        // 3rd parameter: the expiry
        const token = jwt.sign({
            "_id": user._id
        }, process.env.JWT_SECRET, {
            // can use `h` for hours `m` for minutes, `d` for days, `y` for years
            'expiresIn': '1h'
        });
        res.json({
            'token': token
        })
    } else {
        res.status(401);
        res.json({
            'error': 'Invalid credentials'
        })
    }
})

router.get('/profile', authenticateToken, async function (req, res) {

    // find the user by their _id
    const user = await getDB().collection("users").findOne({
        '_id': new ObjectId(req.data._id)
    }, {
        projection: {
            password: 0
        }
    })
    res.json({
        'message': 'Success',
        'user': user
    })




})

// make sure to export the router object
// so that other files, like index.js, can use it
module.exports = router;