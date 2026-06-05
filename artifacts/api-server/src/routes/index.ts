import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import documentsRouter from "./documents";
import payslipsRouter from "./payslips";
import cudsRouter from "./cuds";
import companyDocsRouter from "./company-documents";
import dashboardRouter from "./dashboard";
import expirationsRouter from "./expirations";
import activitiesRouter from "./activities";
import searchRouter from "./search";
import settingsRouter from "./settings";
import backupRouter from "./backup";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(documentsRouter);
router.use(payslipsRouter);
router.use(cudsRouter);
router.use(companyDocsRouter);
router.use(dashboardRouter);
router.use(expirationsRouter);
router.use(activitiesRouter);
router.use(searchRouter);
router.use(settingsRouter);
router.use(backupRouter);

export default router;
