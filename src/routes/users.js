let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { requireUserIDHeader, requireUser } = require('../middleware.js');

router.post('/adduser', jwtCheck, jsonParser, async (req, res) => {
    //check to see if user already exists
    let user = await db.query("select * from users where user_id = $1;", [req.body.userid]);

    //TODO: add post body input validation

    //if the user doesnt exist add a new user
    if(user.rows.length == 0){
        await db.query("insert into users(user_id, email, email_verified, picture) values($1, $2, $3, $4);", 
            [req.body.userid, req.body.email, req.body.email_verified, req.body.picture]
        );
    }

    res.json(null);
});

router.get('/getuser', jwtCheck, requireUser, async (req, res) => {
    res.json(req.user_db);
});

module.exports = router;