import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import chatRouter from "./chat";
import documentsRouter from "./documents";
import tasksRouter from "./tasks";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(chatRouter);
router.use(documentsRouter);
router.use(tasksRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);

export default router;
