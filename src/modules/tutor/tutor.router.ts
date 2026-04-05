import express from "express";
import { tutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middlewares/auth";


const router = express.Router();
router.post("/", tutorController.createTutor);
router.get("/", tutorController.getAllTutor);
router.get("/single", tutorController.getTutor);
router.patch("/profile", auth(UserRole.tutor), tutorController.updateTutor)
router.patch("/:id/verify", auth(UserRole.admin), tutorController.updateTutor)
router.delete("/:id", auth(UserRole.tutor), tutorController.deleteTutor)

export const tutorRouter = router;