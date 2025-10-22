import { NextRequest, NextResponse } from "next/server";
import { getProjects } from "@/app/dashboard/_projects/_actions";

export async function GET(request: NextRequest) {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("API Error fetching projects:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
