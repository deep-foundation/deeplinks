import express from 'express';
import links from './links';
import values from './values';
import reservedCleaner from './reserved-cleaner';
import reserved from './reserved';
import healthz from './healthz';
import scheduler from './scheduler';

const router = express.Router();

router.use('/api/links', links);
router.use('/api/values', values);
router.use('/api/reserved', reserved);
router.use('/api/reserved-cleaner', reservedCleaner);
router.use('/api/healthz', healthz);
router.use('/api/scheduler', scheduler);

export default router;
