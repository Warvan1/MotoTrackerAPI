const express = require('express');
var users = require('./routes/users.js');
var cars = require('./routes/cars.js');
var cors = require('cors');

const app = express();

var corsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccesStatus: 200
}

app.use(cors(corsOptions));

app.use('/express', users);
app.use('/express', cars);

app.listen(5000);