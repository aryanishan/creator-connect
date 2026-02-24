import express from 'express';
import { protect } from '../middleware/auth.js';
import assetUpload from '../middleware/assetUpload.js';
import {
  createAsset,
  deleteAsset,
  getAssetById,
  getMyAssets,
  getPublicAssets,
  updateAsset
} from '../controllers/assetController.js';

const router = express.Router();

router.use(protect);
router.get('/', getPublicAssets);
router.get('/me', getMyAssets);
router.get('/:id', getAssetById);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);
router.post('/', assetUpload.array('media', 10), createAsset);

export default router;
