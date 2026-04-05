import express from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { BookingController } from "./booking.controller";

const router = express.Router();
router.post("/", auth(UserRole.student), BookingController.createBooking);
router.get("/", auth(UserRole.student, UserRole.tutor, UserRole.admin), BookingController.getAllBookings);
router.patch("/:id", auth( UserRole.tutor, UserRole.admin), BookingController.updateBooking);
export const bookingRouter = router;