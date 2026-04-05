import { prisma } from "../../lib/prisma";

const createSlotIntoDB = async (payload: any, userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { user_id: userId },
    });

    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }


    const result = await prisma.courseSlot.create({
        data: { ...payload, tutor_id: tutorProfile.id },
        include: {
            course: true
        }
    });
    return result;
};

const getAllSlots = async () => {

    const result = await prisma.courseSlot.findMany({
        include: {
            tutor: true,
            course: true,
        }
    });
    return result;
}


const getAllSlotsByTutor = async (tutorID: string) => {
    const result = await prisma.courseSlot.findMany({
        where: {
            tutor_id: tutorID,
        },
        include: {
            course: true
        }
    });
    return result;
}

const getSlotById = async (slotId: string, userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    const result = await prisma.courseSlot.findUnique({
        where: { id: slotId },
        include: {
            tutor: true,
            course: true,
        }
    });
    return result;
}

const updateSlot = async (slotId: string, payload: Partial<{
    name: string;
    description: string;
    date: Date;
    start_time: Date;
    end_time: Date;
    meeting_link: string;
    course_id: string;
}>, userId: string) => {

    const slot = await prisma.courseSlot.findUnique({
        where: { id: slotId },
    });

    if (!slot) {
        throw new Error("Slot not found");
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { user_id: userId },
    });

    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }

    if (slot.tutor_id !== tutorProfile.id) {
        throw new Error("Unauthorized! You can only update your own slots");
    }

    const result = await prisma.courseSlot.update({
        where: {
            id: slotId
        },
        data: payload,
        include: {
            course: true,
            tutor: true,
        }
    });
    return result;
};

const deleteSlot = async (slotId: string, userId: string) => {

    const slot = await prisma.courseSlot.findUnique({
        where: { id: slotId },
    });

    if (!slot) {
        throw new Error("Slot not found");
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { user_id: userId },
    });

    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }

    if (slot.tutor_id !== tutorProfile.id) {
        throw new Error("Unauthorized! You can only delete your own slots");
    }

    const result = await prisma.courseSlot.delete({
        where: {
            id: slotId
        }
    });
    return result;
};

export const slotService = {
    createSlotIntoDB,
    getAllSlotsByTutor,
    getAllSlots,
    updateSlot,
    deleteSlot,
    getSlotById,
}