import { NextResponse } from "next/server";
import { convertEonetEvent, convertUSGSFeature } from "@/lib/disasterUtils";
import type { DisasterEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [earthquakeResponse, eonetResponse] = await Promise.all([
      fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson", {
        next: { revalidate: 60 },
      }),
      fetch(
        "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires,severeStorms,volcanoes,floods&limit=300",
        { next: { revalidate: 300 } }
      ),
    ]);

    if (!earthquakeResponse.ok || !eonetResponse.ok) {
      throw new Error(`Upstream API failure: USGS ${earthquakeResponse.status}, EONET ${eonetResponse.status}`);
    }

    const earthquakeData = await earthquakeResponse.json();
    const eonetData = await eonetResponse.json();

    const earthquakes: DisasterEvent[] = (earthquakeData.features ?? []).map(convertUSGSFeature);
    const naturalDisasters: DisasterEvent[] = (eonetData.events ?? [])
      .map(convertEonetEvent)
      .filter((event: DisasterEvent | null): event is DisasterEvent => event !== null);

    const events = [...earthquakes, ...naturalDisasters].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return NextResponse.json(
      { updatedAt: new Date().toISOString(), count: events.length, events },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("WORLD NOW disaster API error", error);
    return NextResponse.json(
      { error: "자연재해 데이터를 불러오지 못했습니다." },
      { status: 502 }
    );
  }
}
