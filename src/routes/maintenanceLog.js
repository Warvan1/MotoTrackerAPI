let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { ifCarCheckAccess, requireCarDBObject, requireUser } = require('../middleware.js');

router.post('/addmaintenance', jwtCheck, jsonParser, ifCarCheckAccess, requireCarDBObject, async (req, res) => {
    //TODO: add post body input validation

    //add an entry to the maintenance log table
    await db.query("insert into maintenance(user_id, car_id, service_type, miles, cost, gallons, notes) values($1, $2, $3, $4, $5, $6, $7);", 
        [req.headers.userid, req.query.car_id, req.body.type, req.body.miles, req.body.cost, req.body.gallons, req.body.notes]
    );

    //update the cars miles, total_costs, total_gallons, and total_fuel_costs
    if(req.body.type == "Fuel"){
        await db.query("update cars set miles = $2, total_costs = $3, total_gallons = $4, total_fuel_costs = $5 where car_id = $1;", 
            [req.query.car_id, req.body.miles, parseFloat(req.car_db.total_costs) + parseFloat(req.body.cost), parseFloat(req.car_db.total_gallons) + parseFloat(req.body.gallons), parseFloat(req.car_db.total_fuel_costs) + parseFloat(req.body.cost)]
        );
    }
    else{
        await db.query("update cars set miles = $2, total_costs = $3 where car_id = $1;", 
            [req.query.car_id, req.body.miles, parseFloat(req.car_db.total_costs) + parseFloat(req.body.cost)]
        );
    }

    //querys to update event values
    if(req.body.type == "Oil Change"){
        await db.query("update cars set oil_change_time = $1, oil_change_miles = $2;", [Date.now(), req.body.miles]);
    }
    else if(req.body.type == "Tire Rotation"){
        await db.query("update cars set tire_rotation_time = $1, tire_rotation_miles = $2;", [Date.now(), req.body.miles]);
    }
    else if(req.body.type == "Air Filter"){
        await db.query("update cars set air_filter_time = $1, air_filter_miles = $2;", [Date.now(), req.body.miles]);
    }
    else if(req.body.type == "Inspection"){
        await db.query("update cars set inspection_time = $1;", [Date.now()]);
    }
    else if(req.body.type == "Registration"){
        await db.query("update cars set registration_time = $1;", [Date.now()]);
    }

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
    if(req.query.maintenance_id == null){
        res.json(null);
        return;
    }

    let deletedLog = await db.query("delete from maintenance where user_id = $1 and maintenance_id = $2 returning *;", [req.headers.userid, req.query.maintenance_id]);

    //return if we failed to delete
    if(deletedLog.rows.length == 0){
        res.json(null);
        return;
    }

    //retrieve the car that the maintenance log entry refrenced
    let car = await db.query("select * from cars where car_id = $1", [deletedLog.rows[0].car_id]);
    //retrieve the current max miles entry for this car
    let log = await db.query("select max(miles) from maintenance where car_id = $1;", [deletedLog.rows[0].car_id]);

    //handle empty log case
    let miles = log.rows[0].max;
    if(miles == null){
        miles = 0;
    }

    //update the car miles, total_costs, total_gallons, and total_fuel_costs
    if(deletedLog.rows[0].service_type == "Fuel"){
        await db.query("update cars set miles = $2, total_costs = $3, total_gallons = $4, total_fuel_costs = $5 where car_id = $1;", 
            [deletedLog.rows[0].car_id, miles, parseFloat(car.rows[0].total_costs) - parseFloat(deletedLog.rows[0].cost), parseFloat(car.rows[0].total_gallons) - parseFloat(deletedLog.rows[0].gallons), parseFloat(car.rows[0].total_fuel_costs) - parseFloat(deletedLog.rows[0].cost)]
        );
    }
    else{
        await db.query("update cars set miles = $2, total_costs = $3 where car_id = $1;", 
            [deletedLog.rows[0].car_id, miles, parseFloat(car.rows[0].total_costs) - parseFloat(deletedLog.rows[0].cost)]
        );
    }

    //querys to update event values
    if(deletedLog.rows[0].service_type == "Oil Change"){
        let previousEntries = await db.query("select * from maintenance where service_type = 'Oil Change' and car_id = $1;", [deletedLog.rows[0].car_id]);
        if(previousEntries.rows.length != 0){
            await db.query("update cars set oil_change_time = $1, oil_change_miles = $2;", 
                [previousEntries.rows[previousEntries.rows.length - 1].timestamp, previousEntries.rows[previousEntries.rows.length - 1].miles]
            );
        }
        else{
            await db.query("update cars set oil_change_time = 0, oil_change_miles = 0;");
        }
    }
    else if(deletedLog.rows[0].service_type == "Tire Rotation"){
        let previousEntries = await db.query("select * from maintenance where service_type = 'Tire Rotation' and car_id = $1;", [deletedLog.rows[0].car_id]);
        if(previousEntries.rows.length != 0){
            await db.query("update cars set tire_rotation_time = $1, tire_rotation_miles = $2;", 
                [previousEntries.rows[previousEntries.rows.length - 1].timestamp, previousEntries.rows[previousEntries.rows.length - 1].miles]
            );
        }
        else{
            await db.query("update cars set tire_rotation_time = 0, tire_rotation_miles = 0;");
        }
    }
    else if(deletedLog.rows[0].service_type == "Air Filter"){
        let previousEntries = await db.query("select * from maintenance where service_type = 'Air Filter' and car_id = $1;", [deletedLog.rows[0].car_id]);
        if(previousEntries.rows.length != 0){
            await db.query("update cars set air_filter_time = $1, air_filter_miles = $2;", 
                [previousEntries.rows[previousEntries.rows.length - 1].timestamp, previousEntries.rows[previousEntries.rows.length - 1].miles]
            );
        }
        else{
            await db.query("update cars set air_filter_time = 0, air_filter_miles = 0;");
        }
    }
    else if(deletedLog.rows[0].service_type == "Inspection"){
        let previousEntries = await db.query("select * from maintenance where service_type = 'Inspection' and car_id = $1;", [deletedLog.rows[0].car_id]);
        if(previousEntries.rows.length != 0){
            await db.query("update cars set inspection_time = $1;", [previousEntries.rows[previousEntries.rows.length - 1].timestamp]);
        }
        else{
            await db.query("update cars set inspection_time = 0");
        }
    }
    else if(deletedLog.rows[0].service_type == "Registration"){
        let previousEntries = await db.query("select * from maintenance where service_type = 'Registration' and car_id = $1;", [deletedLog.rows[0].car_id]);
        if(previousEntries.rows.length != 0){
            await db.query("update cars set registration_time = $1;", [previousEntries.rows[previousEntries.rows.length - 1].timestamp]);
        }
        else{
            await db.query("update cars set registration_time = 0");
        }
    }

    res.json(null);
});

module.exports = router;