import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import visitsRouter from "./visits";

const router: IRouter = Router();

router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(visitsRouter);

export default router;
