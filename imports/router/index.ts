import express from 'express';
import links from './links';
import boolExp from './bool_exp';
import reservedCleaner from './reserved-cleaner';
import reserved from './reserved';
import healthz from './healthz';

const router = express.Router();

router.get('/api/links', links);
router.get('/api/bool_exp', boolExp);
router.get('/api/reserved', reserved);
router.get('/api/reserved-cleaner', reservedCleaner);
router.get('/api/healthz', healthz);

export default router;
