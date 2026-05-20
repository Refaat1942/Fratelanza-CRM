import { Router, type IRouter } from "express";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";

const router: IRouter = Router();

router.use(patientsRouter);
router.use(appointmentsRouter);

export default router;
