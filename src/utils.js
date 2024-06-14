const { auth } = require('express-oauth2-jwt-bearer');
const { Pool } = require('pg');
const fs = require('fs');

const jwtCheck = auth(JSON.parse(fs.readFileSync('auth0Authentication.json')));
const db = new Pool(JSON.parse(fs.readFileSync('postgresAuthentication.json')));

module.exports = { jwtCheck, db }