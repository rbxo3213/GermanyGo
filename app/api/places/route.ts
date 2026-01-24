import { NextResponse } from 'next/server';

// 🚀 핵심 수정: 서버 측 캐시 키도 소수점 2자리(1km) 단위로 뭉뚱그림
const roundCoord = (coord: string | null) => {
    if (!coord) return null;
    return Number(coord).toFixed(2); // 3 -> 2로 변경
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // 프론트에서 이미 2자리로 보내겠지만, 서버에서도 한번 더 확실하게 처리
    const lat = roundCoord(searchParams.get('lat'));
    const lng = roundCoord(searchParams.get('lng'));
    const radius = searchParams.get('radius') || '2000';

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API Key is missing' }, { status: 500 });
    }

    try {
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=ko`;

        if (lat && lng) {
            url += `&location=${lat},${lng}&radius=${radius}`;
        }

        const startTime = performance.now();

        // 24시간 캐시 유지
        const response = await fetch(url, {
            next: { revalidate: 86400 }
        });

        const data = await response.json();

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        const isCacheHit = duration < 50;

        if (isCacheHit) {
            console.log(`📦 [CACHE HIT] 돈 안 듦! (${duration}ms) - ${query}`);
        } else {
            console.log(`💸 [API CALL] 토큰 사용됨 (${duration}ms) - ${query}`);
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(data.error_message || 'API Error');
        }

        return NextResponse.json({
            ...data,
            _debug: {
                isCacheHit,
                duration,
                query
            }
        });
    } catch (error) {
        console.error("💥 Places API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}