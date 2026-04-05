import { prisma } from "../../lib/prisma";


const createTutorIntoDB = async (payload: {
  display_name: string
  bio: string
  qualification: string
  email: string
  hourly_rate?: number
}) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  })

  if (!user) throw new Error("User not found")
  if (user.role !== "TUTOR") throw new Error("Only tutors can create a tutor profile")

  const existing = await prisma.tutorProfile.findUnique({
    where: { user_id: user.id },
  })
  if (existing) throw new Error("Tutor profile already exists")

  return prisma.tutorProfile.create({
    data: {
      display_name: payload.display_name,
      bio: payload.bio,
      qualification: payload.qualification,
      hourly_rate: payload.hourly_rate || 0,
      user_id: user.id,
    },
  })
}

const getAllTutor = async (filters: { minPrice?: number; maxPrice?: number; course?: string } = {}) => {
    let where: any = {};
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.hourly_rate = {};
      if (filters.minPrice !== undefined) where.hourly_rate.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.hourly_rate.lte = filters.maxPrice;
    }

    if (filters.course) {
      where.courses = {
        some: {
          name: { contains: filters.course, mode: "insensitive" }
        }
      };
    }

    const result = await prisma.tutorProfile.findMany({
        where,
        include: {
          courses: true, 
          courseSlots: true,
          user: true
        }
    });
    return result;
};

const getTutorService = async ({ userId, tutorId }: { userId?: string; tutorId?: string }) => {
  if (!userId && !tutorId) {
    throw new Error("Provide either userId or tutorId");
  }

  const result = await prisma.tutorProfile.findUnique({
    where: userId 
      ? { user_id: userId } 
      : { id: tutorId! },
  });

  return result;
};

const updateTutor = async (
  payload: Partial<{
    display_name: string;
    bio: string;
    qualification: string;
    hourly_rate: number;
    is_verified: boolean;
  }>,
  userId: string,
  tutorProfileId?: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  // admin — uses tutorProfileId directly
  if (user.role === "ADMIN") {
    if (!tutorProfileId) throw new Error("Tutor profile ID is required");

    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });
    if (!tutor) throw new Error("Tutor profile not found");

    return prisma.tutorProfile.update({
      where: { id: tutorProfileId },
      data: payload,
    });
  }

  // tutor updates own profile
  return prisma.tutorProfile.update({
    where: { user_id: userId },
    data: payload,
  });
};

const deleteTutor = async (tutorId: string, userId: string) => {
    const user = await prisma.user.findUnique({
        where: {    
            id: userId,
        },
    }); 
    if (!user) {
        throw new Error("User not found");
    }   
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: tutorId },
    });
    if (!tutorProfile) {
        throw new Error("Tutor profile not found");
    }
    if (tutorProfile.user_id !== user.id) {
        throw new Error("Unauthorized! You can only delete your own tutor profile");
    }
    const result = await prisma.tutorProfile.delete({
        where: { id: tutorId },
    });
    return result;
};


export const tutorService = {
    createTutorIntoDB,
    getAllTutor,
    updateTutor,
    getTutorService,
    deleteTutor
}
// End of tutor service operations
