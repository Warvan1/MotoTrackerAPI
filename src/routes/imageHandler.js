let express = require('express');
let router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { carIDCheckView, carIDCheckEdit } = require('../middleware.js');

//create the uploads directory if it doesnt exist
const uploadsDir = path.join(__dirname, "../../uploads");
if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

router.post('/uploadCarImage', express.raw({type: "image/*", limit: "64mb"}), carIDCheckEdit, async (req, res) => {
    let filename = req.query.car_id + ".jpg";
    let filepath = path.join(uploadsDir, filename);

    fs.writeFile(filepath, req.body, (err) => {
        if(err){
            console.log(err);
            res.status(500).send({ message: 'Failed to upload file' });
            return;
        }
        res.send({ message: 'file uploaded successfully.' });
    });

    //TODO: replace image columns on user and car with a imageExists flag

});

router.get('/downloadCarImage', express.static('../../uploads'), carIDCheckView, async (req, res) => {
    let filename = req.query.car_id + ".jpg";
    let filepath = path.join(uploadsDir, filename);
    if(!fs.existsSync(filepath)){
        res.status(404).send({ message: 'File not found'});
        return;
    }

    res.sendFile(path.join(filepath));
});

module.exports = router;