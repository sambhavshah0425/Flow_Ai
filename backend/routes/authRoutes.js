import express from 'express';
import { register, login, getProfile, logout } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateRegister, validateLogin } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getProfile);

export default router;
