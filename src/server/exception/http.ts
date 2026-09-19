import { NextResponse } from "next/server";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m: string) => new AppError(m, 400);
export const unauthorized = (m = "Authentication required") => new AppError(m, 401);
export const forbidden = (m = "You are not allowed to perform this action") => new AppError(m, 403);
export const notFound = (m = "Resource not found") => new AppError(m, 404);
export const conflict = (m: string) => new AppError(m, 409);

/** Global exception handler — never leaks stack traces / SQL to the client. */
export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ success: false, error: error.message, status: error.status }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  console.error("[CivicSolve] Unhandled error:", error);

  if (/DATABASE_URL|JWT_SECRET/i.test(message)) {
    return NextResponse.json(
      { success: false, error: "Server configuration is missing. Please add DATABASE_URL and JWT_SECRET in Vercel environment variables.", status: 500 },
      { status: 500 },
    );
  }

  if (/ECONNREFUSED|ENOTFOUND|timeout|self-signed|SSL|certificate|ssl/i.test(message)) {
    return NextResponse.json(
      { success: false, error: "Database connection failed. Check the Vercel DATABASE_URL and SSL settings.", status: 500 },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Something went wrong on our side. Please try again.", status: 500 },
    { status: 500 },
  );
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
