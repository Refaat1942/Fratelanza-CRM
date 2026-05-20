import { Router, type IRouter } from "express";
import patientsRouter from "./patients";

const router: IRouter = Router();

router.use(patientsRouter);

export default router;
