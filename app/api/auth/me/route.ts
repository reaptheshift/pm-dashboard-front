import { NextResponse } from "next/server";
import { checkServerAuth } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await checkServerAuth();

    if (user) {
      return NextResponse.json({
        success: true,
        user,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Not authenticated",
      },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Auth check failed",
      },
      { status: 500 }
    );
  }
}
