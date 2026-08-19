import express from 'express';
import {
  createWorkflow,
  getUserWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow
} from '../controllers/workflowController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { validateWorkflow } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/', validateWorkflow, createWorkflow);
router.get('/', getUserWorkflows);
router.get('/:id', getWorkflowById);
router.put('/:id', validateWorkflow, updateWorkflow);
router.delete('/:id', deleteWorkflow);

export default router;
