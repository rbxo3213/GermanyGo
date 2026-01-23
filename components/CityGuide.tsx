"use client";

import { motion, AnimatePresence } from "framer-motion";

type CityData = {
    [key: string]: {
        weather: string;
        food: string;
        spot: string;
        market: string;
        color: string;
    };
};

const cityData: CityData = {
    leg1: { // Frankfurt & Nuremberg
        weather: "2°C 흐림/비",
        food: "뉘른베르크 소시지 (Nürnberger Rostbratwurst) + 사우어크라우트",
        spot: "성 제발두스 교회 (St. Sebald) 석양 뷰",
        market: "Hauptmarkt (중앙 광장) - 일요일 휴무 주의",
        color: "text-red-500",
    },
    leg2: { // Nuremberg -> Prague
        weather: "-1°C 눈/흐림",
        food: "꼴레뇨 (Koleno) + 코젤다크 (Kozel Dark) 직영점",
        spot: "카렐교 (Charles Bridge) 새벽 6시 산책 (사람 없음)",
        market: "하벨 시장 (Havelské tržiště) - 기념품 추천",
        color: "text-orange-500",
    },
    leg3: { // Prague -> Berlin
        weather: "1°C 흐림",
        food: "커리부어스트 (Currywurst) - Curry 36 추천",
        spot: "이스트 사이드 갤러리 (East Side Gallery) - 형제의 키스",
        market: "마우어파크 플리마켓 (일요일만 열림)",
        color: "text-blue-500",
    },
    leg4: { // Berlin -> Hamburg
        weather: "3°C 비/바람",
        food: "피쉬브뢰트헨 (Fischbrötchen) - 항구에서 먹는 생선 샌드위치",
        spot: "엘프필하모니 (Elbphilharmonie) 전망대 (무료 입장)",
        market: "피쉬마켓 (일요일 새벽에만 열림)",
        color: "text-cyan-600",
    },
    leg5: { // Hamburg -> Cologne
        weather: "4°C 흐림",
        food: "쾰쉬 맥주 (Kölsch) - 200ml 잔으로 계속 리필됨",
        spot: "쾰른 대성당 남탑 전망대 (계단 주의)",
        market: "Hohe Straße (쇼핑 거리)",
        color: "text-indigo-600",
    },
};

interface Props {
    activeLeg: string;
}

export default function CityGuide({ activeLeg }: Props) {
    const data = cityData[activeLeg] || cityData["leg1"];

    return (
        <div className="w-full max-w-4xl mx-auto py-4">
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                </div>

                <div className="p-8 md:p-10 relative z-10 text-white">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeLeg}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="bg-white/20 p-2 rounded-lg">📍 현지 가이드</span>
                                <span className={`text-lg font-light ${data.color} brightness-150`}>
                                    {activeLeg === 'leg2' ? '프라하/체코' : '독일 도시별 꿀팁'}
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Food */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">MUST EAT</p>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🍽️</span>
                                        <p className="font-medium text-lg leading-snug">{data.food}</p>
                                    </div>
                                </div>

                                {/* Spot */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">HIDDEN SPOT</p>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">📸</span>
                                        <p className="font-medium text-lg leading-snug">{data.spot}</p>
                                    </div>
                                </div>

                                {/* Weather */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">2월 예상 날씨</p>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">❄️</span>
                                        <p className="font-medium text-lg leading-snug">{data.weather}</p>
                                    </div>
                                </div>

                                {/* Market */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">SHOPPING / MARKET</p>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🛍️</span>
                                        <p className="font-medium text-lg leading-snug">{data.market}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Bar styled decoration */}
                <div className="h-1 w-full bg-slate-800">
                    <motion.div
                        className={`h-full ${data.color.replace('text-', 'bg-')}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, repeat: Infinity }}
                    />
                </div>
            </div>
        </div>
    );
}
