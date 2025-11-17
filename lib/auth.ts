
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod, organization } from "better-auth/plugins";
import { sendMail } from "./gmail";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
        "https://momentum003.vercel.app"
    ],
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            const { renderToStaticMarkup } = await import("react-dom/server");
            const html = renderToStaticMarkup(VerifyEmail({ username: user.name, verifyUrl: url }));
            await sendMail({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: user.email,
                subject: "Verify your email",
                html,
            });
        },
        sendOnSignUp: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const { renderToStaticMarkup } = await import("react-dom/server");
            const html = renderToStaticMarkup(ForgotPasswordEmail({ username: user.name, resetUrl: url, userEmail: user.email }));
            await sendMail({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: user.email,
                subject: "Reset your password",
                html,
            });
        },
        requireEmailVerification: true
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    plugins: [organization(), lastLoginMethod(), nextCookies()]
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;