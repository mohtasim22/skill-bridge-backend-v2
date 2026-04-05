import { Review } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const recalculateTutorRating = async (tutorId: string) => {
    const reviews = await prisma.review.findMany({
        where: { tutor_id: tutorId },
    });

    const total = reviews.length;
    const avg = total
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;

    await prisma.tutorProfile.update({
        where: { id: tutorId },
        data: {
            rating_avg: avg,
            total_reviews: total,
        },
    });
};

const createReviewIntoDB = async (payload: Omit<Review, "id" | "createdAt" | "updatedAt">, userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }

    const booking = await prisma.booking.findUnique({
        where: {
            id: payload.booking_id,
        },
    });
    if (!booking) {
        throw new Error("Booking not found");
    }

    const result = await prisma.review.create({
        data: {
            ...payload,
            student_id: user.id,
            tutor_id: booking.tutor_id,
        },
    });
    await recalculateTutorRating(payload.tutor_id);
    return result;
};

const getAllReviews = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    if (user.role === "STUDENT") {
        return prisma.review.findMany({
            where: { student_id: userId },
            include: {
                booking: {
                    include: { courseSlot: true },
                },
                tutor: true,
            },
        });
    }
    if (user.role === "ADMIN") {
        return prisma.review.findMany({
            include: {
                student: true,
                tutor: {
                    include: { user: true }
                },
                booking: {
                    include: { courseSlot: { include: { course: true } } },
                },
            },
            orderBy: { createdAt: "desc" }
        });
    }

    if (user.role === "TUTOR") {
        const tutorProfile = await prisma.tutorProfile.findUnique({
            where: { user_id: userId },
        });

        if (!tutorProfile) throw new Error("Tutor profile not found");

        return prisma.review.findMany({
            where: { tutor_id: tutorProfile.id },
            include: {
                booking: {
                    include: { courseSlot: true },
                },
                student: true,
            },
        });
    }

    throw new Error("Invalid role");
};

const updateReview = async (reviewId: string, payload: Partial<{
    rating: number;
    comment: string;
    status: "APPROVED" | "REJECTED"
}>, userId: string) => {

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review) {
        throw new Error("Review not found");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (user?.role !== "ADMIN" && review.student_id !== user?.id) {
        throw new Error("Unauthorized! You can only update your own reviews");
    }

    const result = await prisma.review.update({
        where: {
            id: reviewId
        },
        data: payload,
    });
    await recalculateTutorRating(review.tutor_id);
    return result;
};

const deleteReview = async (reviewId: string, userId: string) => {

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review) {
        throw new Error("Review not found");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.role !== "ADMIN" && review.student_id !== user.id) {
        throw new Error("Unauthorized! You can only delete your own reviews");
    }

    const result = await prisma.review.delete({
        where: {
            id: reviewId
        }
    });
    await recalculateTutorRating(review.tutor_id);
    return result;
};


const getTutorReviewsById = async (tutorId: string, userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
    });

    if (!tutor) throw new Error("Tutor not found");

    const reviews = await prisma.review.findMany({
        where: { tutor_id: tutorId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            booking: {
                include: {
                    courseSlot: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return reviews;
};

const getPublicTutorReviews = async (tutorId: string) => {
    const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
    if (!tutor) throw new Error("Tutor not found");

    return prisma.review.findMany({
        where: {
            tutor_id: tutorId,
            status: "APPROVED", // ✅ only approved
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            booking: {
                include: { courseSlot: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const reviewService = {
    createReviewIntoDB,
    getAllReviews,
    getPublicTutorReviews,
    getTutorReviewsById,
    updateReview,
    deleteReview
}
// End of review data operations
