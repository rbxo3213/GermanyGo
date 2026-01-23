
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("❌ Google Maps API Key is missing in .env.local");
        return NextResponse.json({ error: 'Google Maps API Key is missing' }, { status: 500 });
    }

    // Debug Log: Check if key is loaded (First 5 chars)
    console.log(`🔑 API Key Loaded: ${apiKey.substring(0, 5)}...`);

    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=ko`;
        console.log(`📡 Fetching Google Maps: ${url.replace(apiKey, "API_KEY")}`);

        const response = await fetch(url);
        const data = await response.json();

        console.log(`✅ Google API Status: ${data.status}`);

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error("❌ Google Maps API Error Detail:", JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: data.error_message || 'Google Maps API Error',
                status: data.status,
                details: data
            }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("💥 Places API Network Error:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
