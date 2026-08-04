import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRiskSummary, getRecommendations } from '../controllers/insights.controller';

const router = Router();
router.use(authenticate);
router.get('/risk', getRiskSummary);
router.get('/recommendations', getRecommendations);

export default router;
