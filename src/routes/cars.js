let router = require('express').Router();
let jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');
const { requireUser, requireCarIDQuery, ifCarCheckAccess, requireCarDBObject } = require('../middleware.js');

router.post('/addcar', jwtCheck, jsonParser, requireUser, async (req, res) => {
    //TODO: add post body input validation

    //add the car to the cars table using the request body
    let car = await db.query("insert into cars(user_id, name, year, make, model, picture, miles) values($1, $2, $3, $4, $5, $6, $7) returning *;", 
        [req.headers.user_id, req.body.name, req.body.year, req.body.make, req.body.model, req.body.picture, req.body.miles]
    );

    if(car.rows.length == 1){
        //make this car our users current_car
        await db.query("update users set current_car = $1 where user_id = $2;", [car.rows[0].car_id, req.headers.user_id]);
        //respond with the newly added car 
        res.json(car.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/getcars', jwtCheck, requireUser, async(req, res) => {
    let cars = await db.query("select * from cars where user_id = $1;", [req.headers.user_id]);

    //respond with all the cars
    res.json({
        cars: cars.rows,
        current_car: req.user_db.current_car,
    });
});

router.get('/deletecar', jwtCheck, requireUser, requireCarIDQuery, async(req, res) => {
    await db.query("delete from cars where user_id = $1 and car_id = $2;", [req.headers.user_id, req.query.car_id])

    //set current car for the user to 0 if we deleted there current car
    if(req.query.car_id == req.user_db.current_car){
        await db.query("update users set current_car = 0 where user_id = $1;", [req.headers.user_id]);
    }
    res.json(null);
});

router.get('/getcurrentcar', jwtCheck, requireUser, async(req, res) => {
    let currentCar = await db.query("select * from cars where car_id = $1 and user_id = $2;", [req.user_db.current_car, req.headers.user_id]);
    if(currentCar.rows.length == 1){
        res.json(currentCar.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/setcurrentcar', jwtCheck, ifCarCheckAccess, requireCarDBObject, async(req, res) => {
    await db.query("update users set current_car = $1 where user_id = $2;", [req.query.car_id, req.headers.user_id]);
    res.json(null);
});

module.exports = router;