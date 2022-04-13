const express = require('express');
const staticPageController = require('../../controllers/staticPage.controller');

const router = express.Router();

router.get('/', staticPageController.home);
router.get('/help', staticPageController.help);
router.get('/about', staticPageController.about);
router.get('/contact', staticPageController.contact);

module.exports = router;
