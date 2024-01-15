const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {getDB} = require('./mongoUtil');
const { authenticateToken } = require('./middlewares');
const { ObjectId } = require('mongodb');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

router.post('/', async function(req, res){
  
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
            username: req.body.username,
            password: hashedPassword
        };
        const db = getDB();
        const results = await db.collection("users").insertOne(newUser);
        res.json({
            results
        });
    

});

router.post('/login', async function (req, res)  {
    try {
        const db = getDB();
        const user = await db.collection("users").findOne({ username: req.body.username });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/profile', authenticateToken, async function(req,res){
    const userId = req.user.userId;
    const db = getDB();
    const user = await db.collection("users").findOne({
        _id: new ObjectId(userId)
    }, {
        projection:{
            'password': 0
        }
    });

    res.json({
        user
    });

})

module.exports = router;