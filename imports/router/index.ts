import express from 'express';
import links from './links.js';
import values from './values.js';
import reservedCleaner from './reserved-cleaner.js';
import reserved from './reserved.js';
import healthz from './healthz.js';
import scheduler from './scheduler.js';

const router:express.IRouter = express.Router();

router.use('/api/links', links);
router.use('/api/values', values);
router.use('/api/reserved', reserved);
router.use('/api/reserved-cleaner', reservedCleaner);
router.use('/api/healthz', healthz);
router.use('/api/scheduler', scheduler);

export default router;
