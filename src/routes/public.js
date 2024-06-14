var router = require('express').Router();
var jsonParser = require('body-parser').json();

router.get('/public', (req, res) => {
    console.log(req.headers);

    res.json({
        type: "public"
    });
});

module.exports = router;