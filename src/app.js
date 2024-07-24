const express = require('express');
let users = require('./routes/users.js');
let cars = require('./routes/cars.js');
let maintenanceLog = require('./routes/maintenanceLog.js');
let imageHandler = require('./routes/imageHandler.js');
let { jwtCheck } = require('./utils.js');
let cors = require('cors');
let helmet = require('helmet');

const app = express();

let corsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccesStatus: 200
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(jwtCheck);

app.use('/express', users);
app.use('/express', cars);
app.use('/express', maintenanceLog);
app.use('/express', imageHandler);


app.listen(5000);