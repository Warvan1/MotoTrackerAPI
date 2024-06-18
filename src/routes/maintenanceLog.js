
var router = require('express').Router();
var jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { requireCarWithAccess } = require('../middleware.js');

router.post('/addmaintenance', jwtCheck, jsonParser, requireCarWithAccess, async (req, res) => {
    //TODO: add post body input validation

    //add an entry to the maintenance log table
    await db.query("insert into maintenance(user_id, car_id, service_type, miles, cost, notes) values($1, $2, $3, $4, $5, $6);", 
        [req.headers.user_id, req.query.car_id, req.body.type, req.body.miles, req.body.cost, req.body.notes]
    );

    //update the cars miles and total_costs
    await db.query("update cars set miles = $2, total_costs = $3 where car_id = $1", 
        [req.query.car_id, req.body.miles, req.car_db.total_costs + req.body.cost]
    );

    //TODO: add querys to update msl and tsl values

    res.json(null);
});

module.exports = router;