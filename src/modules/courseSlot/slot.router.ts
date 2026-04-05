import express from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { slotController } from "./slot.controller";

const router = express.Router();

router.post("/",auth(UserRole.tutor), slotController.createSlot)
router.get("/tutor/:id", slotController.getAllSlotsByTutor)

router.get("/allslots", slotController.getAllSlots)
router.get("/:id",auth(UserRole.tutor, UserRole.student, UserRole.admin),  slotController.getSlotById)

router.patch("/:id",auth(UserRole.tutor), slotController.updateSlot)
router.delete("/:id",auth(UserRole.tutor), slotController.deleteSlot)

export const courseSlotRouter = router;