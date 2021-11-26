import express from 'express';
import links from './links';
import boolExp from './bool_exp';
import deepLinks from './deeplinks';

const router = express.Router();

router.get('/api/eh/links', links);
router.get('/api/eh/bool_exp', boolExp);
router.get('/api/eh/deeplinks', deepLinks);

export default router;
