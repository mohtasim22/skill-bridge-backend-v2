import express from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post("/create-checkout-session", auth(UserRole.student), PaymentController.createCheckoutSession);

export const paymentRouter = router;
