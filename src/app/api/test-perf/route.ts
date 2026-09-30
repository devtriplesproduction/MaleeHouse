import { getProjectsListAction } from "@/actions/project.actions";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getProjectsListAction();
  return NextResponse.json(result);
}
