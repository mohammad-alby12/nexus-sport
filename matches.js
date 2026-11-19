import { Router } from 'express';
import { listSports, matchesForSport } from '../controllers/sportsController.js';

const router = Router();
router.get('/sports', listSports);
router.get('/matches/:sport', matchesForSport);
export default router;
