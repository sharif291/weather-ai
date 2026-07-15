import express from 'express';
import { verifyAuth } from '../../core/auth.js';
import { 
  getAlertLogs, 
  triggerAlertSimulation, 
  markAlertAsRead, 
  markAllAlertsAsRead 
} from './notifications.controller.js';

const router = express.Router();

router.use(verifyAuth);
router.get('/', getAlertLogs);
router.post('/trigger-alert', triggerAlertSimulation);
router.patch('/:id/read', markAlertAsRead);
router.post('/read-all', markAllAlertsAsRead);

export default router;
