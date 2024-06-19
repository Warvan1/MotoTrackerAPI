const express = require('express');
let users = require('./routes/users.js');
let cars = require('./routes/cars.js');
let maintenanceLog = require('./routes/maintenanceLog.js');
let cors = require('cors');

const app = express();

let corsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccesStatus: 200
}

app.use(cors(corsOptions));

app.use('/express', users);
app.use('/express', cars);
app.use('/express', maintenanceLog);


app.listen(5000);