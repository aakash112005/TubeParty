import { Router } from 'express';
import { createRoom, checkRoom, healthCheck } from '../controllers/roomController.js';

const router = Router();

router.post('/rooms', createRoom);
router.get('/rooms/:code', checkRoom);
router.get('/health', healthCheck);

export default router;
