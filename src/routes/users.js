let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { db } = require('../utils.js');
const { requireUser } = require('../middleware.js');

router.post('/adduser', jsonParser, async (req, res) => {
    //check to see if user already exists
    let user = await db.query("select * from users where user_id = $1;", [req.body.userid]);

    //if the user doesnt exist add a new user
    if(user.rows.length === 0){
        await db.query("insert into users(user_id, email, email_verified) values($1, $2, $3);", 
            [req.body.userid, req.body.email, req.body.email_verified]
        );
    }

    res.json(null);
});

router.get('/getuser', requireUser, async (req, res) => {
    res.json(req.user_db);
});

module.exports = router;