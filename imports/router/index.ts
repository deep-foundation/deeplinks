import express from 'express';
import links from './links';
import boolExp from './bool_exp';
import deepLinks from './deeplinks';

const router = express.Router();

router.get('/api/links', links);
router.get('/api/bool_exp', boolExp);
router.get('/api/deeplinks', deepLinks);

export default router;
