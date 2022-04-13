const express = require('express');
const staticPageController = require('../../controllers/staticPage.controller');

const router = express.Router();

router.get('/', staticPageController.home);

module.exports = router;
