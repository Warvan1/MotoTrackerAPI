const { db } = require('./utils.js');

//stops the request if there is no user_id header
const requireUserIDHeader = async (req, res, next) => {
    if(req.headers.user_id != null){
        next();
    }
    else{
        res.json(null);
    }
}

//stops the request if the user_id header does not have a coresponding user object in the database
//adds the user object to the req
const requireUser = async (req, res, next) => {
    if(req.headers.user_id != null){
        //get the user from the database
        var user = await db.query("select * from users where user_id = $1", [req.headers.user_id]);
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

const requireCarWithAccess = async (req, res, next) => {
    if(req.query.car_id != null && req.headers.user_id != null){
        //get the car from the database
        var car = await db.query("select * from cars where car_id = $1 and user_id = $2;", [req.query.car_id, req.headers.user_id]);
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
        res.json(null);
    }

}

module.exports = { requireUserIDHeader, requireUser, requireCarIDQuery, requireCarWithAccess }