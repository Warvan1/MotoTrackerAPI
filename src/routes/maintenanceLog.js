let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { ifCarCheckAccess, requireCarDBObject, requireUser } = require('../middleware.js');

router.post('/addmaintenance', jwtCheck, jsonParser, ifCarCheckAccess, requireCarDBObject, async (req, res) => {
    //TODO: add post body input validation

    //add an entry to the maintenance log table
    let log = await db.query("insert into maintenance(user_id, car_id, service_type, miles, cost, notes) values($1, $2, $3, $4, $5, $6) returning *;", 
        [req.headers.user_id, req.query.car_id, req.body.type, req.body.miles, req.body.cost, req.body.notes]
    );

    //update the cars miles and total_costs
    await db.query("update cars set miles = $2, total_costs = $3 where car_id = $1;", 
        [req.query.car_id, req.body.miles, req.car_db.total_costs + req.body.cost]
    );

    //TODO: add querys to update msl and tsl values

    res.json(log.rows[0]);
});

router.get('/getmaintenancelog', jwtCheck, requireUser, ifCarCheckAccess, async (req, res) => {
    let car_id;
    //if the car query is set
    if(req.car_db != null){
        car_id = req.car_db.car_id;
    }
    else{
        car_id = req.user_db.current_car;
    }
    let log = await db.query("select * from maintenance where car_id = $1", [car_id]);

    res.json(log.rows);
})

module.exports = router;