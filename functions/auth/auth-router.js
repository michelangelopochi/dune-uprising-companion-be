import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware.js";
import { changePassword, forgotPassword, getPasswordResetToken, login, register, resetPassword } from "./controllers/auth-controller.js";

const authRouter = Router();

authRouter.post('/register', register);

authRouter.post('/login', login);

authRouter.post('/forgotPassword', forgotPassword);

authRouter.get('/reset-password', getPasswordResetToken);

authRouter.post('/resetPassword', resetPassword);

authRouter.post('/changePassword', authenticate, changePassword);

export default authRouter;