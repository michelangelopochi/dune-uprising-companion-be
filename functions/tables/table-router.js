
import { Router } from 'express';
import { authenticate } from '../middlewares/auth-middleware.js';
import { getUserTables, create, deleteTable, addUser, removeUser, getAllSubscribleUsers } from './controller/table-controller.js';

const tableRouter = Router();

tableRouter.get('/getUserTables', authenticate, getUserTables);

tableRouter.post('/create', authenticate, create);

tableRouter.post('/delete', authenticate, deleteTable);

tableRouter.post('/addUser', authenticate, addUser);

tableRouter.post('/removeUser', authenticate, removeUser);

tableRouter.post('/getAllSubscribleUsers', authenticate, getAllSubscribleUsers);

export default tableRouter;