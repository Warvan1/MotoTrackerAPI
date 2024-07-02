const { db } = require('./utils.js');

const requireUserIDHeader = async (req, res, next) => {
    if(req.headers.userid != null){
        next();
    }
    else{
        res.json(null);
    }
}

//stops the request if the userid header does not have a coresponding user object in the database
const requireUser = async (req, res, next) => {
    if(req.headers.userid != null){
        //get the user from the database
        let user = await db.query("select * from users where user_id = $1;", [req.headers.userid]);
        //if the user object is not found return
        if(user.rows.length != 1){
            res.json(null);
            return;
        }
        //add the user object to the req object
        req.user_db = user.rows[0];
        next();
    }
    else{
        res.json(null);
    }
}

const requireCarIDQuery = async (req, res, next) => {
    if(req.query.car_id != null){
        next();
    }
    else{
        res.json(null);
    }
}

//if the car_id query exists check to see if the user is the car owner
const ifCarCheckOwner = async (req, res, next) => {
    if(req.query.car_id != null && req.headers.userid != null){
        //get the car from the database
        let car = await db.query("select * from cars where car_id = $1 and user_id = $2;", [req.query.car_id, req.headers.userid]);
        //if the user object is not found return
        if(car.rows.length != 1){
            res.json(null);
            return;
        }
        //add the car object to the req object
        req.car_db = car.rows[0]
        next();
    }
    else{
        next();
    }
}

//if the car_id query exists check to see if the user has edit permissions
const ifCarCheckEdit = async (req, res, next) => {
    if(req.query.car_id != null && req.headers.userid != null){
        //check to see if there is an access entry for the car and the user with edit permissions
        let car = await db.query("select cars.*, access.permissions from access inner join cars on access.car_id = cars.car_id where access.car_id = $1 and access.user_id = $2 and access.permissions = $3;",
            [req.query.car_id, req.headers.userid, "Edit"]
        );
        //if the user does not have acces to the car
        if(car.rows.length != 1) {
            res.json(null);
            return;
        }
        req.car_db = car.rows[0];
        next();
    }
    else{
        next();
    }
}

//if the car_id query exists check to see if the user has any permissions
const ifCarCheckView = async (req, res, next) => {
    if(req.query.car_id != null && req.headers.userid != null){
        //check to see if there is an access entry for the car and the user with any permissions
        let car = await db.query("select cars.*, access.permissions from access inner join cars on access.car_id = cars.car_id where access.car_id = $1 and access.user_id = $2;",
            [req.query.car_id, req.headers.userid]
        );
        //if the user does not have access to the car
        if(car.rows.length != 1) {
            res.json(null);
            return;
        }
        req.car_db = car.rows[0];
        next();
    }
    else{
        next();
    }
}

//require that there is a car_db object inside the req (often used afer ifCarCheck___)
const requireCarDBObject = async (req, res, next) => {
    if(req.car_db != null){
        next();
    }
    else{
        res.json(null);
    }
}

module.exports = { requireUserIDHeader, requireUser, requireCarIDQuery, ifCarCheckOwner, ifCarCheckEdit, ifCarCheckView, requireCarDBObject }