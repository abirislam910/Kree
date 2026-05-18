const router = require('express').Router();

const { loginController, registrationController, signoutController, userController } = require('./controller.js');

router.post('/login', loginController);

router.post('/register', registrationController);

router.post('/signout', signoutController);

router.get('/user', userController);

module.exports = router;