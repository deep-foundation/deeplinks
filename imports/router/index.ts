import express from 'express';
import links from './links';
import values from './values';
import boolExp from './bool_exp';
import reservedCleaner from './reserved-cleaner';
import reserved from './reserved';
import healthz from './healthz';

const router = express.Router();

router.use('/api/links', links);
router.use('/api/values', values);
router.use('/api/bool_exp', boolExp);
router.use('/api/reserved', reserved);
router.use('/api/reserved-cleaner', reservedCleaner);
router.use('/api/healthz', healthz);

export default router;
