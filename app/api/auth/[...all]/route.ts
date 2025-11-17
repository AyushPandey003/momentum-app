import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const GET = async (request: Request, context?: any) => {
	console.log("auth route GET hit");
	if (typeof handlers.GET === "function") {
		return handlers.GET(request);
	}
	return new Response(null, { status: 404 });
};

export const POST = async (request: Request, context?: any) => {
	console.log("auth route POST hit");
	if (typeof handlers.POST === "function") {
		return handlers.POST(request);
	}
	return new Response(null, { status: 404 });
};