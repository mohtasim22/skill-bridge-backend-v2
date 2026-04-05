import { prisma } from "../../lib/prisma";

const getAllUsers = async (userID: string) => {
    const userData = await prisma.user.findUnique({
        where: {
            id: userID
        }
    })
    if (!userData) {
        throw new Error("Unauthorized!");
    }

    const result = await prisma.user.findMany()
    return result;
}


const getAdminStats = async () => {
  const [totalUsers, totalBookings, totalCourses, totalReviews] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.course.count(),
    prisma.review.count(),
  ]);

  return { totalUsers, totalBookings, totalCourses, totalReviews };
};

const updateUserStatus = async (userId: string, status: "ACTIVE" | "BANNED") => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAdminStats
}