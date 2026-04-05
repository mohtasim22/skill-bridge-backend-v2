import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oAuthProxy } from "better-auth/plugins";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

export const auth = betterAuth({
    baseURL: process.env.FRONTEND_URL,
    basePath: "/api/v1/auth",
    trustedOrigins: [
        process.env.FRONTEND_URL!,
        "http://localhost:3000",
    ],

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }) => {
            console.log(`🔑 Password reset requested for: ${user.email}`);
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                const info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"SkillBridge" <noreply@skillbridge.com>',
                    to: user.email,
                    subject: "Reset your password - SkillBridge",
                    text: `Click the link to reset your password: ${url}. The token is ${token}.`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2>SkillBridge 🎓</h2>
                            <p>Hi ${user.name},</p>
                            <p>You requested to reset your password. Click the button below to set a new password:</p>
                            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                            <p>Alternatively, you can copy and paste this link into your browser:</p>
                            <p><a href="${url}">${url}</a></p>
                            <hr />
                            <p style="font-size: 0.8rem; color: #777;">If you did not request this, please ignore this email.</p>
                        </div>
                    `,
                });
                console.log("✅ Password reset email sent:", info.messageId);
            } catch (error) {
                console.error("❌ Failed to send password reset email:", error);
            }
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "STUDENT",
            },
            status: {
                type: "string",
                required: false,
                defaultValue: "ACTIVE",
            },
        },
    },
    advanced: {
        cookies: {
            session_token: {
                name: "session_token",
                attributes: {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    partitioned: true,
                },
            },
            state: {
                name: "session_token",
                attributes: {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    partitioned: true,
                },
            },
        },
    },
    plugins: [
        oAuthProxy(),
    ],
});
