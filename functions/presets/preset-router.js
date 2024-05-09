import { Router } from 'express';
import { authenticate } from '../middlewares/auth-middleware.js';
import { save, removePreset, loadPreset } from './controller/preset-controller.js';

const presetRouter = Router();

presetRouter.post('/save', authenticate, save);

presetRouter.post('/load', authenticate, loadPreset);

presetRouter.post('/delete', authenticate, removePreset);

export default presetRouter;