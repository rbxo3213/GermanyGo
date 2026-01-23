"use client";

import { useEffect, useState } from "react";
import MemoPad from "../components/MemoPad";
import ItineraryTabs from "../components/ItineraryTabs";
import TransportComparison from "../components/TransportComparison";
import CityGuide from "../components/CityGuide";
import LoginModal from "../components/LoginModal";
import AIOptimizer from "../components/AIOptimizer";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
    const { user, loading } = useAuth();
    const [activeLeg, setActiveLeg] = useState("leg1");

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

    // 1. Loading State
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                    <div className="h-3 w-48 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    // 2. Not Logged In -> Show Login Modal
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}></div>
                <LoginModal />
            </div>
        );
    }

    // 3. Logged In BUT Email Not Verified -> Show Verification Blocker
    if (user && !user.emailVerified) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✉️</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">이메일 인증이 필요합니다</h2>
                    <p className="text-gray-500 mb-6 word-keep-all">
                        <span className="font-bold text-slate-800">{user.email}</span>로 인증 메일을 발송했습니다.<br />
                        메일함 확인 후 링크를 클릭해 주세요.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors"
                    >
                        인증 완료 (새로고침)
                    </button>
                    <p className="text-xs text-gray-400 mt-4">
                        메일이 오지 않았나요? 스팸함을 확인하거나<br />
                        <button onClick={() => alert("재발송 기능은 현재 준비중입니다. 잠시 후 다시 시도해주세요.")} className="underline">여기</button>를 눌러 재발송하세요.
                    </p>
                </div>
            </div>
        );
    }

    // 4. Authenticated & Verified Dashboard
    return (
        <main className="min-h-screen bg-slate-50 text-black font-sans pb-32">
            {/* Header Hero */}
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

                {/* Context-Aware City Guide (Replaces Static TravelTips) */}
                <section>
                    <CityGuide activeLeg={activeLeg} />
                </section>

                {/* Detailed Itinerary (Tabs) */}
                <section>
                    <ItineraryTabs activeTab={activeLeg} onTabChange={setActiveLeg} />
                </section>

                {/* Transport Comparison */}
                <section>
                    <TransportComparison />
                </section>

                {/* Dashboard (MemoPad) */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 px-2">나만의 여행 메모</h2>
                        <p className="text-gray-500 px-2 text-sm">잊지 말아야 할 것들을 기록하세요.</p>
                    </div>
                    <MemoPad />
                </section>

                {/* LBS Discovery (Hidden Gems) */}
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

            <AIOptimizer />
        </main>
    );
}
