import express from 'express';
import { uploadPdf } from '../controllers/uploadController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/pdf', uploadPdf);

export default router;
