const express = require('express');
const staticPageController = require('../controllers/staticPage.controller');
const sessionController = require('../controllers/session.controller');

const router = express.Router();

router.get('/', staticPageController.home);
router.get('/help', staticPageController.help);
router.get('/about', staticPageController.about);
router.get('/contact', staticPageController.contact);
router.get('/login', sessionController.login);
router.post('/login', sessionController.create);

module.exports = router;
