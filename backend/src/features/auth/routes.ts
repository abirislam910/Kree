import { Router } from 'express';
import { loginController, registrationController, signoutController, userController } from './controller.js';

const router = Router();

router.post('/login', loginController);

router.post('/register', registrationController);

router.post('/signout', signoutController);

router.get('/user', userController);

export default router;
