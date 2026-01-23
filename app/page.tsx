"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BottomNav from "../components/BottomNav";
import TabSkeleton from "../components/TabSkeleton";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import { MessageSquare, Users, LogOut } from "lucide-react";

// Async Components (Lazy Load)
const MemoPad = dynamic(() => import("../components/MemoPad"), { loading: () => <TabSkeleton /> });
const ItineraryTabs = dynamic(() => import("../components/ItineraryTabs"), { loading: () => <TabSkeleton /> });
const TransportComparison = dynamic(() => import("../components/TransportComparison"), { loading: () => <TabSkeleton /> });
const CityGuide = dynamic(() => import("../components/CityGuide"), { loading: () => <TabSkeleton /> });
const LBSDiscovery = dynamic(() => import("../components/LBSDiscovery"), { loading: () => <TabSkeleton />, ssr: false });
const AIOptimizer = dynamic(() => import("../components/AIOptimizer"), { ssr: false });
const GroupChat = dynamic(() => import("../components/GroupChat"), { ssr: false });
const MemberInfo = dynamic(() => import("../components/MemberInfo"), { ssr: false });

type Tab = "guide" | "memo" | "itinerary" | "transport" | "map";

export default function Home() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("guide");
    const [activeLeg, setActiveLeg] = useState("leg1");

    // Modals
    const [showChat, setShowChat] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

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
                <div className="absolute inset-0 z-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(#444 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}></div>
                <LoginModal />
            </div>
        );
    }

    // 3. Logged In BUT Email Not Verified
    if (user && !user.emailVerified) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                    <h2 className="text-2xl font-bold mb-2">이메일 인증이 필요합니다</h2>
                    <p className="text-gray-500 mb-6 word-keep-all">
                        <span className="font-bold text-slate-800">{user.email}</span>로 인증 메일을 발송했습니다.
                    </p>
                    <button onClick={() => window.location.reload()} className="w-full bg-black text-white font-bold py-4 rounded-2xl">
                        인증 완료 (새로고침)
                    </button>
                </div>
            </div>
        );
    }

    // 4. Authenticated & Verified Dashboard (Tabbed)
    return (
        <main className="min-h-screen bg-slate-50 text-black font-sans pb-32">
            {/* Mobile Header (German Theme) */}
            <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-4 border-b border-gray-100 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1">
                    🇩🇪 Germa-Niche
                </h1>
                <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold bg-black text-[#FFCE00] px-3 py-1 rounded-full border border-gray-800 mr-2">
                        D-14
                    </div>
                    {/* Header Icons */}
                    <button onClick={() => setShowMembers(true)} className="text-gray-800 hover:text-black transition-all">
                        <Users size={22} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setShowChat(true)} className="text-gray-800 hover:text-black transition-all relative">
                        <MessageSquare size={22} strokeWidth={2.5} />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#DD0000] rounded-full border-2 border-white"></span>
                    </button>
                    <button
                        onClick={() => import("../firebase").then(m => m.auth.signOut())}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Dynamic Content Area */}
            <div className="max-w-md mx-auto px-4 mt-6">

                {/* GUIDE TAB */}
                {activeTab === "guide" && (
                    <div className="space-y-8 animate-fadeIn">
                        <section>
                            <CityGuide activeLeg={activeLeg} />
                        </section>
                    </div>
                )}

                {/* MEMO TAB */}
                {activeTab === "memo" && (
                    <div className="animate-fadeIn">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Quick Memo</h2>
                            <p className="text-sm text-gray-400">잊기 쉬운 아이디어를 기록하세요</p>
                        </div>
                        <MemoPad />
                    </div>
                )}

                {/* ITINERARY TAB */}
                {activeTab === "itinerary" && (
                    <div className="animate-fadeIn">
                        <ItineraryTabs activeTab={activeLeg} onTabChange={setActiveLeg} />
                    </div>
                )}

                {/* TRANSPORT TAB */}
                {activeTab === "transport" && (
                    <div className="animate-fadeIn">
                        <TransportComparison />
                    </div>
                )}

                {/* MAP TAB */}
                {activeTab === "map" && (
                    <div className="animate-fadeIn">
                        <LBSDiscovery />
                    </div>
                )}
            </div>

            <AIOptimizer />

            {/* Modals */}
            <AnimatePresence>
                {showChat && <GroupChat onClose={() => setShowChat(false)} />}
                {showMembers && <MemberInfo onClose={() => setShowMembers(false)} />}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
    );
}
