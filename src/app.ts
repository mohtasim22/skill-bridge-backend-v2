import express, { Application } from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { courseRouter } from "./modules/course/course.router";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { tutorRouter } from "./modules/tutor/tutor.router";
import { courseSlotRouter } from "./modules/courseSlot/slot.router";
import { reviewRouter } from "./modules/review/review.router";
import { bookingRouter } from "./modules/booking/booking.router";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/globalErrorHandler";
import { adminRouter } from "./modules/admin/admin.router";
import { PaymentController } from "./modules/payment/payment.controller";
import { paymentRouter } from "./modules/payment/payment.router";

const app: Application = express();

app.use(cors({
    origin: [
        process.env.FRONTEND_URL!,
        "http://localhost:3000",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
}));

// Better Auth handler must come before broad body parsers
app.all("/api/v1/auth/*path", toNodeHandler(auth));

// Stripe Webhook needs the raw Buffer!
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), PaymentController.handleWebhook);

app.use(express.json());
app.use(cookieParser());
// Other routers...
app.use('/api/v1/tutors', tutorRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/slots', courseSlotRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/payments", paymentRouter);


app.get("/", (req, res) => {
    res.send("Server is running successfully");
})

app.use(notFound);
app.use(errorHandler);

export default app;
// Core app configuration complete

// app routes finalized
