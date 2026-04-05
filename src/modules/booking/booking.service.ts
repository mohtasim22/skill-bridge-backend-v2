
import { prisma } from "../../lib/prisma";

const createBookingIntoDB = async (
  payload: {
    course_slot_id: string;
    tutor_id: string;
  },
  userId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new Error("Student not found");
  }

  const slot = await prisma.courseSlot.findUnique({
    where: {
      id: payload.course_slot_id,
    },
  });

  if (!slot) {
    throw new Error("Course Slot not found");
  }

  const existing = await prisma.booking.findFirst({
    where: {
      student_id: userId,
      course_slot_id: payload.course_slot_id,
    },
  });
  if (existing) throw new Error("You have already booked this slot");

  const result = await prisma.$transaction(async (tx) => {
    const tutor = await tx.tutorProfile.findUnique({
      where: { id: payload.tutor_id },
    });

    if (!tutor) {
      throw new Error("Tutor profile not found");
    }

    const start = new Date(slot.start_time).getTime();
    const end = new Date(slot.end_time).getTime();

    if (end <= start) {
      throw new Error("Invalid course slot duration");
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    const calculatedPrice = durationHours * tutor.hourly_rate;

    return await tx.booking.create({
      data: {
        student_id: userId,
        tutor_id: payload.tutor_id,
        course_slot_id: payload.course_slot_id,
        booking_status: "PENDING",
        total_price: calculatedPrice,
      },
    });
  });

  return result;
};

const getAllBookings = async (userID: string) => {
  const userData = await prisma.user.findUnique({
    where: { id: userID },
  });

  if (!userData) {
    throw new Error("Unauthorized!");
  }

  if (userData.role === "STUDENT") {
    const result = await prisma.booking.findMany({
      where: { student_id: userID },
      include: {
        tutor: true,
        courseSlot: true,
        review: true
      },
    });
    return result;
  }
  if (userData.role === "ADMIN") {
    const result = await prisma.booking.findMany({
      include: {
        tutor: true,
        courseSlot: true,
        student: true
      },
    });
    return result;
  }

  if (userData.role === "TUTOR") {
    // first get the tutor profile to get tutor id
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { user_id: userID },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found!");
    }

    const result = await prisma.booking.findMany({
      where: { tutor_id: tutorProfile.id },
      include: {
        tutor: true,
        courseSlot: true,
        student: true
      },
    });
    return result;
  }

  throw new Error("Invalid role!");
};

const updateBooking = async (
  bookingId: string,
  payload: { booking_status: "CONFIRMED" | "CANCELLED" | "PENDING" | "COMPLETED" },
  userID: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userID } });
  if (!user) throw new Error("User not found");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");


  if (user.role !== "ADMIN") {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { user_id: userID },
    });

    if (!tutorProfile) throw new Error("Tutor profile not found");
    if (booking.tutor_id !== tutorProfile.id) {
      throw new Error("Unauthorized! You can only update your own bookings");
    }
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: payload,
  });
};

export const BookingService = {
  createBookingIntoDB,
  getAllBookings,
  updateBooking
};
// End of booking processing logic

// booking validation final
