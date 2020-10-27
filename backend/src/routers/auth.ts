import { Router } from "express";
import * as auth from "../controllers/auth";

const authRouter = Router();

authRouter.post("/login", auth.login);

authRouter.get("/verify", auth.verify);

authRouter.get("/refresh", auth.refresh);

authRouter.get("/logout", auth.logout);

export default authRouter;
