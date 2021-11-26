import express from 'express';
import links from './links';
import boolExp from './bool_exp';
import reservedCleaner from './reserved-cleaner';
import reserved from './reserved';

const router = express.Router();

router.get('/api/links', links);
router.get('/api/bool_exp', boolExp);
router.get('/api/reserved', reserved);
router.get('/api/reserved-cleaner', reservedCleaner);

export default router;
