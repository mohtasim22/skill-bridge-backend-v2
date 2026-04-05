import express from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { reviewController } from "./review.controller";

const router = express.Router();

router.post("/",auth(UserRole.student), reviewController.createReview)
router.get("/",auth(UserRole.student, UserRole.tutor, UserRole.admin),  reviewController.getAllReviews)
router.get("/:id",auth(UserRole.student, UserRole.tutor, UserRole.admin),  reviewController.getTutorReviewsById)

router.get("/tutor/:id/public", reviewController.getPublicTutorReviews)

router.patch("/:id",auth(UserRole.student, UserRole.admin), reviewController.updateReview)
router.delete("/:id",auth(UserRole.student, UserRole.admin), reviewController.deleteReview)

export const reviewRouter = router;