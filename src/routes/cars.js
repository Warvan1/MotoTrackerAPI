let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { requireUser, requireCarIDQuery, ifCarCheckOwner, ifCarCheckView, requireCarDBObject } = require('../middleware.js');

router.post('/addcar', jwtCheck, jsonParser, requireUser, async (req, res) => {
    //TODO: add post body input validation

    //add the car to the cars table using the request body
    let car = await db.query("insert into cars(user_id, name, year, make, model, picture, miles) values($1, $2, $3, $4, $5, $6, $7) returning *;", 
        [req.headers.userid, req.body.name, req.body.year, req.body.make, req.body.model, req.body.picture, req.body.miles]
    );

    if(car.rows.length == 1){
        //make this car our users current_car
        await db.query("update users set current_car = $1 where user_id = $2;", [car.rows[0].car_id, req.headers.userid]);
        //add a entry to the access table with Edit permissions
        await db.query("insert into access values($1, $2, $3)", [car.rows[0].car_id, req.headers.userid, "Edit"]);
        //respond with the newly added car 
        res.json(car.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/getcars', jwtCheck, requireUser, async(req, res) => {
    //get all the cars that the user has any permissions for
    let cars = await db.query("select cars.*, access.permissions from cars inner join access on cars.car_id = access.car_id where access.user_id = $1 order by cars.car_id", 
        [req.headers.userid]
    );

    //respond with all the cars
    res.json({
        cars: cars.rows,
        current_car: req.user_db.current_car,
    });
});

router.get('/deletecar', jwtCheck, requireUser, requireCarIDQuery, async(req, res) => {
    //implicit owner requirement for delete in sql query
    await db.query("delete from cars where user_id = $1 and car_id = $2;", [req.headers.userid, req.query.car_id])

    //set current car for the user to 0 if we deleted there current car
    if(req.query.car_id == req.user_db.current_car){
        await db.query("update users set current_car = 0 where user_id = $1;", [req.headers.userid]);
    }
    res.json(null);
});

router.get('/getcurrentcar', jwtCheck, requireUser, async(req, res) => {
    let access = await db.query("select * from access where car_id = $1 and user_id = $2;", [req.user_db.current_car, req.user_db.user_id]);
    if(access.rows.length == 0){
        res.json(null);
    }
    let currentCar = await db.query("select * from cars where car_id = $1;", [req.user_db.current_car]);
    if(currentCar.rows.length == 1){
        currentCar.rows[0].permissions = access.rows[0].permissions;
        res.json(currentCar.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/setcurrentcar', jwtCheck, ifCarCheckView, requireCarDBObject, async(req, res) => {
    await db.query("update users set current_car = $1 where user_id = $2;", [req.query.car_id, req.headers.userid]);
    res.json(null);
});

router.post('/sharecar', jwtCheck, jsonParser, ifCarCheckOwner, requireCarDBObject, async(req, res) => {
    let user = await db.query("select * from users where email = $1;", [req.body.email]);
    if(user.rows.length == 0){
        res.json({
            message: "email is not connected to a user account."
        });
        return;
    }
    let access = await db.query("select * from access where car_id = $1 and user_id = $2;", [req.query.car_id, user.rows[0].user_id]);
    if(access.rows.length == 0){
        await db.query("insert into access values($1, $2, $3)", [req.query.car_id, user.rows[0].user_id, req.body.permissions]);
    }
    else{
        await db.query("update access set permissions = $3 where car_id = $1 and user_id = $2;", [req.query.car_id, user.rows[0].user_id, req.body.permissions]);
    }
    res.json({
        message: "shared succesfully."
    })
});

module.exports = router;