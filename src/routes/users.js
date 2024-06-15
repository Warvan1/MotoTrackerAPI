var router = require('express').Router();
var jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');

router.post('/adduser', jwtCheck, jsonParser, async (req, res) => {
    res.end();
    //check to see if user already exists
    var user = await db.query("select * from users where user_id = $1", [req.body.user_id]);

    //if the user doesnt exist add a new user
    if(user.rows.length == 0){
        await db.query("insert into users(user_id, email, email_verified, picture) values($1, $2, $3, $4);", 
            [req.body.user_id, req.body.email, req.body.email_verified, req.body.picture]
        );
    }
});

router.get('/getuser', jwtCheck, async (req, res) => {
    //get the user from the database
    var user = await db.query("select * from users where user_id = $1", [req.headers.user_id]);

    //if the user exists respond with the user data
    if(user.rows.length == 1){
        res.json(user.rows[0]);
    }
    else{
        console.log("someone tried to access a user that doesnt exist!!!");
        res.json(null);
    }
})

module.exports = router;