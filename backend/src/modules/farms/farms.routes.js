import express from 'express';
import { verifyAuth } from '../../core/auth.js';
import {
  createFarm,
  getFarms,
  deleteFarm,
  updateFarm,
  getUploadToken,
  handleMockUpload
} from './farms.controller.js';

const router = express.Router();

// Public mock upload route (called by client to upload direct streams)
router.put('/mock-upload', handleMockUpload);

// Authenticated CRUD & Token endpoints
router.use(verifyAuth);
router.get('/', getFarms);
router.post('/', createFarm);
router.put('/:id', updateFarm);
router.delete('/:id', deleteFarm);
router.get('/presigned-url', getUploadToken);

export default router;
