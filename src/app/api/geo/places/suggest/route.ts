import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache: key = query, value = { data, expiry }
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_MS = 45_000; // 45 seconds

function cacheGet(key: string) {
    const hit = cache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiry) { cache.delete(key); return null; }
    return hit.data;
}
function cacheSet(key: string, data: unknown) {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

export async function GET(req: NextRequest) {
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

    if (q.length < 3) {
        return NextResponse.json({ suggestions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("[geo/places/suggest] GOOGLE_MAPS_API_KEY is not set");
        return NextResponse.json(
            { error: "Address search is not configured. Contact your administrator." },
            { status: 503 }
        );
    }

    // Check cache
    const cached = cacheGet(q);
    if (cached) return NextResponse.json(cached);

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", q);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("components", "country:se");
    url.searchParams.set("language", "sv");
    url.searchParams.set("types", "address");

    try {
        const res = await fetch(url.toString(), { next: { revalidate: 0 } });
        if (!res.ok) {
            console.error("[geo/places/suggest] Google API HTTP error:", res.status);
            return NextResponse.json({ error: "Address service unavailable" }, { status: 502 });
        }

        const json = await res.json();

        if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
            console.error("[geo/places/suggest] Google Places error:", json.status, json.error_message);
            return NextResponse.json({ error: "Address service error" }, { status: 502 });
        }

        const suggestions = (json.predictions ?? []).map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
        }));

        const response = { suggestions };
        cacheSet(q, response);
        return NextResponse.json(response);
    } catch (err) {
        console.error("[geo/places/suggest] Fetch error:", err);
        return NextResponse.json({ error: "Address service unavailable" }, { status: 503 });
    }
}
