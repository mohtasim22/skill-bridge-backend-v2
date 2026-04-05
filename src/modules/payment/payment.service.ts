import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10" as any, // fallback to any if TS complains
});

const createCheckoutSession = async (userId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      tutor: { include: { user: true } },
      courseSlot: { include: { course: true } },
    },
  });

  if (!booking) throw new Error("Booking not found");
  if (booking.student_id !== userId) throw new Error("Unauthorized");
  if (booking.payment_status === "PAID") throw new Error("Already paid");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: booking.student.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tutoring Session: ${booking.courseSlot.course.name}`,
            description: `Tutor: ${booking.tutor.display_name}`,
          },
          unit_amount: Math.round(booking.total_price * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id, // For the webhook to know which booking this is
    },
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/bookings?payment=success`,
    cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/bookings?payment=cancelled`,
  });

  if (!session.url) throw new Error("Failed to generate Stripe checkout URL");

  return { url: session.url };
};

const processWebhook = async (rawBody: Buffer, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Missing Stripe Webhook Secret");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) throw new Error("No bookingId in metadata");

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        payment_status: "PAID",
        transaction_id: session.id, // Store stripe session ID
      },
    });
  }
};

export const PaymentService = {
  createCheckoutSession,
  processWebhook,
};

// End of Stripe payment abstraction
