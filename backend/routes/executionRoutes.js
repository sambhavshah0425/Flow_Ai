import express from 'express';
import { runWorkflow, getUserExecutions, getExecutionById } from '../controllers/executionController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/run', runWorkflow);
router.get('/', getUserExecutions);
router.get('/:id', getExecutionById);

export default router;
