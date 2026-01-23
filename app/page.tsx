"use client";

import { useEffect, useState } from "react";
import MemoPad from "../components/MemoPad";
import ItineraryTabs from "../components/ItineraryTabs";
import TransportComparison from "../components/TransportComparison";
import TravelTips from "../components/TravelTips";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
    const { user } = useAuth();

    // Mock LBS Logic
    const [geoStatus, setGeoStatus] = useState("위치 확인 중...");
    const [nicheSpots, setNicheSpots] = useState<any[]>([]);

    useEffect(() => {
        // Basic mock for LBS
        setNicheSpots([
            { name: "Hidden Kebab", rating: 4.8, reviews: 42, dist: "0.4km" },
            { name: "Cafe Einstein", rating: 4.9, reviews: 88, dist: "1.2km" },
        ]);
    }, []);

    return (
        <main className="min-h-screen bg-slate-50 text-black font-sans pb-32">
            {/* 1. Header Hero */}
            <header className="bg-white border-b border-gray-100 p-6 pt-12 sticky top-0 z-50 bg-opacity-90 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Germa-Niche <span className="text-blue-600">2026</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">2026.02.06 — 02.16 (3인 그룹)</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">D-DAY Calculator</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 space-y-12 mt-8">

                {/* 2. Detailed Itinerary (Tabs) */}
                <section>
                    <ItineraryTabs />
                </section>

                {/* 3. Transport Comparison */}
                <section>
                    <TransportComparison />
                </section>

                {/* 4. Travel Tips (Dark Card) */}
                <section>
                    <TravelTips />
                </section>

                {/* 5. Dashboard (MemoPad) */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 px-2">나만의 여행 메모</h2>
                        <p className="text-gray-500 px-2 text-sm">잊지 말아야 할 것들을 기록하세요.</p>
                    </div>
                    <MemoPad />
                </section>

                {/* 6. LBS Discovery (Hidden Gems) */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>내 주변 숨은 맛집</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">평점 4.5+</span>
                    </h2>
                    <div className="space-y-4">
                        {nicheSpots.map((spot, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                                <div>
                                    <h3 className="font-bold">{spot.name}</h3>
                                    <p className="text-xs text-gray-400">{spot.dist} 거리</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-bold text-slate-800">{spot.rating}</span>
                                    <span className="text-xs text-gray-400">({spot.reviews})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
}
