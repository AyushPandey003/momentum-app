import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Create handler and wrap to add lightweight logging in production to help diagnose
// 405 errors. We also provide an OPTIONS handler to respond to CORS preflight.
const handler = toNextJsHandler(auth);

export const POST = async (req: Request) => {
	try {
		const body = await req.text();
		console.log("[auth] POST received. url=", new URL(req.url).pathname, "body=", body);
	} catch (e) {
		console.log("[auth] POST received (failed to read body):", e);
	}
	return handler.POST(req as any);
};

export const GET = async (req: Request) => {
	console.log("[auth] GET received. url=", new URL(req.url).pathname);
	return handler.GET(req as any);
};

export const OPTIONS = async () => {
	// Reply to CORS preflight quickly
	return new Response(null, { status: 204 });
};