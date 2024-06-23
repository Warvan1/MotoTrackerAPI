let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { ifCarCheckAccess, requireCarDBObject, requireUser } = require('../middleware.js');

router.post('/addmaintenance', jwtCheck, jsonParser, ifCarCheckAccess, requireCarDBObject, async (req, res) => {
    //TODO: add post body input validation

    //add an entry to the maintenance log table
    await db.query("insert into maintenance(user_id, car_id, service_type, miles, cost, notes) values($1, $2, $3, $4, $5, $6);", 
        [req.headers.userid, req.query.car_id, req.body.type, req.body.miles, req.body.cost, req.body.notes]
    );

    //update the cars miles and total_costs
    await db.query("update cars set miles = $2, total_costs = $3 where car_id = $1;", 
        [req.query.car_id, req.body.miles, parseFloat(req.car_db.total_costs) + parseFloat(req.body.cost)]
    );

    //TODO: add querys to update msl and tsl values

    res.json(null);
});

router.get('/getmaintenancelog', jwtCheck, requireUser, async (req, res) => {
    let log;
    if(req.query.filter != null){
        log = await db.query("select * from maintenance where car_id = $1 and service_type = $2;", [req.user_db.current_car, req.query.filter]);
    }
    else{
        log = await db.query("select * from maintenance where car_id = $1;", [req.user_db.current_car]);
    }

    //paging calculations
    const PL = 20; //page length constant
    let page = 1;
    //calculate total number of pages
    let totalPages = Math.floor(log.rows.length / PL);
    if(log.rows.length % PL != 0){
        totalPages++;
    }
    //set the page if req.query.page is set
    if(req.query.page != null && req.query.page > 1 && req.query.page <= totalPages){
        page = req.query.page;
    }
    //calculate the slice start and end
    let start = PL*(page-1);
    let end = PL*page;
    if(end > log.rows.length) end = log.rows.length;

    res.json({
        data: log.rows.reverse().slice(start, end),
        totalPages: totalPages,
        page: page
    });
});

router.get('/deletemaintenancelog', jwtCheck, requireUser, async (req, res) => {
    if(req.query.maintenance_id != null){
        await db.query("delete from maintenance where user_id = $1 and maintenance_id = $2;", [req.headers.userid, req.query.maintenance_id]);
    }
    res.json(null);
});

module.exports = router;