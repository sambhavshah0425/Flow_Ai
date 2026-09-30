import express from 'express';
import { copilotChat, getCopilotStatus, copilotWarmup } from '../controllers/copilotController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/status', getCopilotStatus);
router.post('/warmup', copilotWarmup);
router.post('/chat', copilotChat);

export default router;
