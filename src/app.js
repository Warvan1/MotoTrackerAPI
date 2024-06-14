const express = require('express');
var public = require('./routes/public.js');
var private = require('./routes/private.js');
var cors = require('cors');

const app = express();

var corsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccesStatus: 200
}

app.use(cors(corsOptions));

app.use('/express', public);
app.use('/express', private);

app.listen(5000);