"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import TabSkeleton from "@/components/TabSkeleton";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import { MessageSquare, Users, LogOut, Zap, Image as ImageIcon, Map as MapIcon, Languages, Calendar, Bus, Book } from "lucide-react";

// Async Components (Lazy Load)
const MemoPad = dynamic(() => import("../components/MemoPad"), { loading: () => <TabSkeleton /> });
const ItineraryTabs = dynamic(() => import("../components/ItineraryTabs"), { loading: () => <TabSkeleton /> });
const TransportComparison = dynamic(() => import("../components/TransportComparison"), { loading: () => <TabSkeleton /> });
const DailyLog = dynamic(() => import("../components/DailyLog"), { loading: () => <TabSkeleton />, ssr: false });
const CityGuide = dynamic(() => import("../components/CityGuide"), { loading: () => <TabSkeleton /> });
const GermanPhrasebook = dynamic(() => import("../components/GermanPhrasebook"), { loading: () => <TabSkeleton />, ssr: false });
const TravelLog = dynamic(() => import("../components/TravelLog"), { loading: () => <TabSkeleton />, ssr: false });
const PrivateDiary = dynamic(() => import("../components/PrivateDiary"), { loading: () => <TabSkeleton />, ssr: false });
const LBSDiscovery = dynamic(() => import("../components/LBSDiscovery"), { loading: () => <TabSkeleton />, ssr: false });
const AIOptimizer = dynamic(() => import("../components/AIOptimizer"), { ssr: false });
const GroupChat = dynamic(() => import("../components/GroupChat"), { ssr: false });
const MemberInfo = dynamic(() => import("../components/MemberInfo"), { ssr: false });
const NicknameSetup = dynamic(() => import("../components/NicknameSetup"), { ssr: false });

type Tab = "guide" | "memo" | "log" | "transport" | "map";

export default function Home() {
    const { user, userProfile, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("guide");
    const [activeLeg, setActiveLeg] = useState("leg1");

    // Sub-tabs
    const [guideMode, setGuideMode] = useState<"city" | "phrase">("city");
    const [transportMode, setTransportMode] = useState<"info" | "itinerary">("itinerary");
    const [logMode, setLogMode] = useState<"beer" | "gallery" | "diary">("beer");

    // Modals
    const [showChat, setShowChat] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const [dDay, setDDay] = useState("D-DAY");

    useEffect(() => {
        const target = new Date("2026-02-06T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) setDDay(`D-${diffDays}`);
        else if (diffDays === 0) setDDay("D-Day");
        else setDDay(`D+${Math.abs(diffDays)}`);
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

    // 2. Not Logged In
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(#444 1px, transparent 1px)", backgroundSize: "20px 20px"
                }}></div>
                <LoginModal />
            </div>
        );
    }

    // 3. Email Verified Check
    const isEmailProvider = user.providerData.some(p => p.providerId === 'password');
    if (isEmailProvider && !user.emailVerified) {
        // (EmailVerification 컴포넌트가 있다면 그것을 사용해도 됩니다)
        const EmailVerification = dynamic(() => import("../components/EmailVerification"), { ssr: false });
        return <EmailVerification />;
    }

    // 4. Onboarding (Nickname + Flag)
    // If no profile, OR no flag (partial signup), show setup
    if (user && (!userProfile || !userProfile.flag)) {
        return <NicknameSetup />;
    }

    // 5. Dashboard
    return (
        <main className="min-h-screen bg-slate-50 text-black font-sans pb-32">
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-gray-100 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1">
                    🇩🇪 Germa-Niche
                </h1>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold bg-black text-[#FFCE00] px-3 py-1 rounded-full border border-gray-800 mr-2">
                        {dDay}
                    </div>
                    <button onClick={() => setShowMembers(true)} className="text-gray-800 hover:text-black transition-all">
                        <Users size={22} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setShowChat(true)} className="text-gray-800 hover:text-black transition-all relative">
                        <MessageSquare size={22} strokeWidth={2.5} />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#DD0000] rounded-full border-2 border-white"></span>
                    </button>
                    <button onClick={() => import("../firebase").then(m => m.auth.signOut())} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Dynamic Content Area */}
            <div className="max-w-md mx-auto px-4 mt-6">

                {/* 1. GUIDE TAB */}
                {activeTab === "guide" && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-center mb-6">
                            <div className="bg-white border border-gray-200 p-1 rounded-full flex gap-1 shadow-sm">
                                <button
                                    onClick={() => setGuideMode("city")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${guideMode === "city" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <MapIcon size={14} /> 도시 가이드
                                </button>
                                <button
                                    onClick={() => setGuideMode("phrase")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${guideMode === "phrase" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Languages size={14} /> 회화 사전
                                </button>
                            </div>
                        </div>
                        {guideMode === "city" ? <CityGuide activeLeg={activeLeg} /> : <GermanPhrasebook />}
                    </div>
                )}

                {/* 2. MEMO TAB (수정됨: 중복 타이틀 제거) */}
                {activeTab === "memo" && (
                    <div className="animate-fadeIn">
                        {/* 기존의 Quick Memo 텍스트 제거하고 바로 MemoPad 렌더링 */}
                        <MemoPad />
                    </div>
                )}

                {/* 3. LOG TAB */}
                {activeTab === "log" && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-center mb-6">
                            <div className="bg-white border border-gray-200 p-1 rounded-full flex gap-1 shadow-sm">
                                <button
                                    onClick={() => setLogMode("beer")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${logMode === "beer" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Zap size={14} /> 순간 기록
                                </button>
                                <button
                                    onClick={() => setLogMode("gallery")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${logMode === "gallery" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <ImageIcon size={14} /> 트래블 로그
                                </button>
                                <button
                                    onClick={() => setLogMode("diary")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${logMode === "diary" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Book size={14} /> 일기장
                                </button>
                            </div>
                        </div>
                        {logMode === "beer" ? (
                            <DailyLog />
                        ) : logMode === "gallery" ? (
                            <TravelLog />
                        ) : (
                            <PrivateDiary />
                        )}
                    </div>
                )}

                {/* 4. TRANSPORT TAB */}
                {activeTab === "transport" && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-center mb-6">
                            <div className="bg-white border border-gray-200 p-1 rounded-full flex gap-1 shadow-sm">
                                <button
                                    onClick={() => setTransportMode("itinerary")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${transportMode === "itinerary" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Calendar size={14} /> 여행 일정
                                </button>
                                <button
                                    onClick={() => setTransportMode("info")}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${transportMode === "info" ? "bg-slate-900 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                                >
                                    <Bus size={14} /> 교통 정보
                                </button>
                            </div>
                        </div>
                        {transportMode === "itinerary" ? (
                            <ItineraryTabs activeTab={activeLeg} onTabChange={setActiveLeg} />
                        ) : (
                            <TransportComparison />
                        )}
                    </div>
                )}

                {/* 5. MAP TAB */}
                {activeTab === "map" && (
                    <div className="animate-fadeIn">
                        <LBSDiscovery />
                    </div>
                )}
            </div>

            <AIOptimizer />

            <AnimatePresence>
                {showChat && <GroupChat onClose={() => setShowChat(false)} />}
                {showMembers && <MemberInfo onClose={() => setShowMembers(false)} />}
            </AnimatePresence>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
    );
}