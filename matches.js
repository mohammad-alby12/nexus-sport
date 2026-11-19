import { Router } from 'express';
import { listSports, matchesForSport } from './sportsController.js';

const router = Router();
router.get('/sports', listSports);
router.get('/matches/:sport', matchesForSport);
export default router;
