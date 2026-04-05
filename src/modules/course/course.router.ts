import express, { Router } from "express";
import { CourseController } from "./course.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth(UserRole.tutor), CourseController.createCourse)
router.get("/", auth(UserRole.tutor, UserRole.admin), CourseController.getAllCourses)
router.get("/:id", CourseController.getCourseByTutorId)
router.patch("/:id", auth(UserRole.tutor, UserRole.admin), CourseController.updateCourse)
router.delete("/:id", auth(UserRole.tutor), CourseController.deleteCourse)

export const courseRouter: Router = router;