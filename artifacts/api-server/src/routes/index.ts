import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import employeesRouter from "./employees";
import inventoryRouter from "./inventory";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);

// Protected routes — require login
router.use(requireAuth);
router.use(usersRouter);
router.use(employeesRouter);
router.use(inventoryRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);

export default router;
