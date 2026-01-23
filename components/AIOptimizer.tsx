"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIOptimizer() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const generateOptimization = async () => {
        setLoading(true);
        // Simulation of an AI call since we don't have the API route fully set up with a key yet.
        // In reality, this would fetch('/api/ai-guide', { method: 'POST', body: ... })

        setTimeout(() => {
            setSuggestion(`**🇩🇪 AI 여행 코디네이터 제안**
            
**최적 경로 분석 (3인 기준)**
1. **프랑크푸르트 → 뉘른베르크**: 
   - 🚅 *ICE 조기예매(Super Sparpreis)* 추천. 3인 합계 약 60유로 예상. (패스보다 저렴)
   
2. **뉘른베르크 → 프라하 (국경이동)**: 
   - 🚌 *DB IC Bus*가 가장 효율적이었으나 현재 *열차* 환승이 일반적입니다. 
   - 💡 팁: 'Bayern-Böhmen-Ticket'을 활용하면 3인 약 40유로대로 국경 근처까지 커버 가능.

3. **프라하 → 베를린**: 
   - 🚅 *EC (EuroCity)* 열차가 엘베강 풍경이 아름답습니다. 식당칸 이용 강력 추천!

**종합 의견**: 
전체 구간 비용 합산 시, **'3인용 저먼 레일 패스(Twin Pass + 1)'**보다 **'구간권 얼리버드 예매'**가 약 **15% 더 저렴**할 것으로 분석됩니다. 하지만 일정 유동성을 원하신다면 패스를 구매하세요.`);
            setLoading(false);
        }, 2000);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-2xl flex items-center gap-2 pr-6"
            >
                <span className="text-2xl">🤖</span>
                <span className="font-bold">AI 코디</span>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        />

                        {/* Card */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl pointer-events-auto relative max-h-[80vh] flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shrink-0">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    🤖 AI 트래블 코디네이터
                                </h2>
                                <p className="text-indigo-100 text-sm mt-1">
                                    현재 일정과 인원(3명)을 분석하여 <br />최적의 교통수단과 동선을 제안합니다.
                                </p>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar grow">
                                {!suggestion && !loading && (
                                    <div className="text-center py-10">
                                        <div className="text-6xl mb-4">🗺️</div>
                                        <p className="text-gray-500 mb-6">
                                            프랑크푸르트에서 쾰른까지,<br />
                                            가장 효율적인 방법을 찾아드릴까요?
                                        </p>
                                        <button
                                            onClick={generateOptimization}
                                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                                        >
                                            분석 시작하기
                                        </button>
                                    </div>
                                )}

                                {loading && (
                                    <div className="text-center py-12 px-4 space-y-4">
                                        <div className="animate-spin text-4xl w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
                                        <p className="font-bold text-indigo-900 animate-pulse">
                                            경로 데이터를 분석 중입니다...
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            DB(독일철도청) 가격 비교 중...<br />
                                            플릭스버스 노선 검색 중...
                                        </p>
                                    </div>
                                )}

                                {suggestion && (
                                    <div className="space-y-4 animate-fade-in-up">
                                        <div className="prose prose-sm prose-indigo bg-indigo-50 p-6 rounded-2xl">
                                            <div className="whitespace-pre-line leading-relaxed">
                                                {suggestion}
                                            </div>
                                        </div>
                                        <div className="text-center pt-2">
                                            <button
                                                onClick={generateOptimization}
                                                className="text-sm text-gray-400 underline hover:text-indigo-600"
                                            >
                                                다시 분석하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
