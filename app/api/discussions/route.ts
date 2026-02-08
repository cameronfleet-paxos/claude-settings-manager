import { NextResponse } from "next/server";
import type { DiscussionsResponse } from "@/types/settings";
import { getOrBuildIndex, rebuildIndex, queryIndex } from "@/lib/discussions-index";

export async function GET(
  request: Request
): Promise<NextResponse<DiscussionsResponse>> {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const project = searchParams.get("project") || "all";
  const timeFilter = (searchParams.get("timeFilter") || "all") as "all" | "24h" | "7d" | "30d" | "90d" | "custom";
  const timeFrom = searchParams.get("timeFrom") ? parseInt(searchParams.get("timeFrom")!, 10) : undefined;
  const timeTo = searchParams.get("timeTo") ? parseInt(searchParams.get("timeTo")!, 10) : undefined;
  const rebuild = searchParams.get("rebuild") === "true";

  // Parse limit (default 50, max 500)
  let limit = 50;
  const limitParam = searchParams.get("limit");
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 500);
    }
  }

  // Parse offset (default 0)
  let offset = 0;
  const offsetParam = searchParams.get("offset");
  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  const index = rebuild ? await rebuildIndex() : await getOrBuildIndex();
  const result = queryIndex(index, { search, project, timeFilter, timeFrom, timeTo, limit, offset });

  return NextResponse.json(result);
}
