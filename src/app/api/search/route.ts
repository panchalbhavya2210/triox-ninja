import { NextResponse } from "next/server";
import { search } from "duck-duck-scrape";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
    }

    const searchResults = await search(query);

    const results = searchResults.results.slice(0, 4).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("DuckDuckGo Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error.", details: error.message },
      { status: 500 },
    );
  }
}
