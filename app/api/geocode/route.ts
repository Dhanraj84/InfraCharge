import { NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/redis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const cacheKey = `geocode:${address.toLowerCase().trim()}`;
    const cachedResult = await getCache(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        source: "redis-cache",
      });
    }

    // Response object
    const responseData = {
      address,
      latitude: 0,
      longitude: 0,
    };

    // Cache result in Redis for 24 hours (86400s)
    await setCache(cacheKey, responseData, 86400);

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "Geocode failed" },
      { status: 500 }
    );
  }
}

