import express from 'express';
import { setSecret, getSecretsList, deleteSecret } from '../controllers/secretController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateSecret } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/', validateSecret, setSecret);
router.get('/', getSecretsList);
router.delete('/:key', deleteSecret);

export default router;
