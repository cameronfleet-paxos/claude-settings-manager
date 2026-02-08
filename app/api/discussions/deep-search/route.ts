import { NextRequest } from "next/server";
import { getOrBuildIndex } from "@/lib/discussions-index";
import { deepSearchProject, deepSearchAll } from "@/lib/discussions-deep-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get("project");
  const search = searchParams.get("search");
  const timeFilter = searchParams.get("timeFilter") as "all" | "24h" | "7d" | "30d" | "90d" | "custom" | null;
  const timeFrom = searchParams.get("timeFrom") ? parseInt(searchParams.get("timeFrom")!, 10) : null;
  const timeTo = searchParams.get("timeTo") ? parseInt(searchParams.get("timeTo")!, 10) : null;

  if (!search || search.length < 3) {
    return new Response(
      JSON.stringify({ error: "search parameter must be at least 3 characters" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let index = await getOrBuildIndex();

  // Apply time filter to index entries before deep search
  if (timeFilter && timeFilter !== "all") {
    if (timeFilter === "custom") {
      const filteredEntries: typeof index.entries = {};
      for (const [id, entry] of Object.entries(index.entries)) {
        if (timeFrom && entry.mtime < timeFrom) continue;
        if (timeTo && entry.mtime > timeTo) continue;
        filteredEntries[id] = entry;
      }
      index = { ...index, entries: filteredEntries };
    } else {
      const now = Date.now();
      const cutoffs: Record<string, number> = { "24h": 86400000, "7d": 604800000, "30d": 2592000000, "90d": 7776000000 };
      const cutoff = now - cutoffs[timeFilter];
      const filteredEntries: typeof index.entries = {};
      for (const [id, entry] of Object.entries(index.entries)) {
        if (entry.mtime >= cutoff) {
          filteredEntries[id] = entry;
        }
      }
      index = { ...index, entries: filteredEntries };
    }
  }

  const generator = project && project !== "all"
    ? deepSearchProject(project, search, request.signal, index)
    : deepSearchAll(search, request.signal, index);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const event of generator) {
          if (request.signal.aborted) break;

          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (err) {
        if (!request.signal.aborted) {
          const errorEvent = `data: ${JSON.stringify({
            type: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
