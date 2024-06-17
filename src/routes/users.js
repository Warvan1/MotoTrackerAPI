var router = require('express').Router();
var jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');

router.post('/adduser', jwtCheck, jsonParser, async (req, res) => {
    //check to see if user already exists
    var user = await db.query("select * from users where user_id = $1", [req.body.user_id]);

    //TODO: add input validation

    //if the user doesnt exist add a new user
    if(user.rows.length == 0){
        await db.query("insert into users(user_id, email, email_verified, picture) values($1, $2, $3, $4);", 
            [req.body.user_id, req.body.email, req.body.email_verified, req.body.picture]
        );
    }

    res.json(null);
});

router.get('/getuser', jwtCheck, async (req, res) => {
    //get the user from the database
    var user = await db.query("select * from users where user_id = $1", [req.headers.user_id]);
    //if the user does not exist then fail
    if(user.rows.length != 1){
        console.log("someone tried to access a user that doesnt exist!!!");
        res.json(null);
        return;
    }

    //if the user exists respond with the user data
    res.json(user.rows[0]);
});

module.exports = router;