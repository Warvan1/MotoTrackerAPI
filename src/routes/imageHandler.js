let express = require('express');
let router = require('express').Router();
const fs = require('fs');
const path = require('path');

//create the uploads directory if it doesnt exist
const uploadsDir = path.join(__dirname, "../../uploads");
if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

router.post('/uploadCarImage', express.raw({type: "image/*", limit: "1gb"}), async (req, res) => {
    console.log(req.headers);
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

module.exports = router;