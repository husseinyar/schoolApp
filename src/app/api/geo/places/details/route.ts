import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const placeId = new URL(req.url).searchParams.get("placeId")?.trim() ?? "";

    if (!placeId) {
        return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("[geo/places/details] GOOGLE_MAPS_API_KEY is not set");
        return NextResponse.json(
            { error: "Address service is not configured." },
            { status: 503 }
        );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("fields", "formatted_address,geometry/location,address_components");
    url.searchParams.set("language", "sv");

    try {
        const res = await fetch(url.toString(), { next: { revalidate: 0 } });
        if (!res.ok) {
            console.error("[geo/places/details] Google API HTTP error:", res.status);
            return NextResponse.json({ error: "Address service unavailable" }, { status: 502 });
        }

        const json = await res.json();

        if (json.status !== "OK") {
            console.error("[geo/places/details] Google Places error:", json.status, json.error_message);
            return NextResponse.json({ error: "Could not load address details" }, { status: 502 });
        }

        const result = json.result;
        const components: any[] = result.address_components ?? [];

        // Extract postal_code and city (locality or postal_town)
        const getComp = (...types: string[]) =>
            components.find((c: any) => types.some((t) => c.types.includes(t)))?.long_name ?? undefined;

        const postalCode = getComp("postal_code");
        const city = getComp("locality", "postal_town");

        return NextResponse.json({
            placeId,
            formattedAddress: result.formatted_address ?? "",
            lat: result.geometry?.location?.lat ?? 0,
            lng: result.geometry?.location?.lng ?? 0,
            postalCode,
            city,
        });
    } catch (err) {
        console.error("[geo/places/details] Fetch error:", err);
        return NextResponse.json({ error: "Address service unavailable" }, { status: 503 });
    }
}
