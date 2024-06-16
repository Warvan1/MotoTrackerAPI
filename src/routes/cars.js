var router = require('express').Router();
var jsonParser = require('body-parser').json();
const { jwtCheck, db } = require('../utils.js');

router.post('/addcar', jwtCheck, jsonParser, async (req, res) => {
    //get the user from the database
    var user = await db.query("select current_car from users where user_id = $1", [req.headers.user_id]);
    //if the user does not exist then fail
    if(user.rows.length != 1){
        console.log("someone tried to access a user that doesnt exist!!!");
        res.json(null); 
        return;
    }

    //TODO: add input validation

    //add the car to the cars table using the request body
    var car = await db.query("insert into cars(user_id, name, year, make, model, picture, milage) values($1, $2, $3, $4, $5, $6, $7) returning *;", 
        [req.headers.user_id, req.body.name, req.body.year, req.body.make, req.body.model, req.body.picture, req.body.milage]
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

router.get('/getcars', jwtCheck, async(req, res) => {
    //get the current car accessed by the user
    var user = await db.query("select current_car from users where user_id = $1", [req.headers.user_id]);
    var current_car = 0;
    if(user.rows.length == 1 && user.rows[0].current_car != null){
        current_car = user.rows[0].current_car;
    }

    //get all cars associated with the user
    var cars = await db.query("select * from cars where user_id = $1", [req.headers.user_id]);

    //respond with all the cars
    res.json({
        cars: cars.rows,
        current_car: current_car,
    });
});

router.get('/getcurrentcar', jwtCheck, async(req, res) => {
    //get the current car accessed by the user
    var user = await db.query("select current_car from users where user_id = $1", [req.headers.user_id]);
    //if the user does not exist then fail
    if(user.rows.length != 1){
        console.log("someone tried to access a user that doesnt exist!!!");
        res.json(null)        
        return;
    }

    var currentCar = await db.query("select * from cars where car_id = $1 and user_id = $2", [user.rows[0].current_car, req.headers.user_id]);
    if(currentCar.rows.length == 1){
        res.json(currentCar.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.post('/setcurrentcar', jwtCheck, jsonParser, async(req, res) => {
    //get the user from the database
    var user = await db.query("select current_car from users where user_id = $1", [req.headers.user_id]);
    //if the user does not exist then fail
    if(user.rows.length != 1){
        console.log("someone tried to access a user that doesnt exist!!!");
        res.json(null)        
        return;
    }

    await db.query("update users set current_car = $1 where user_id = $2;", [req.body.car_id, req.headers.user_id]);
    res.json(null);
})

module.exports = router;