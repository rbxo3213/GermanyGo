"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin, Cloud, Sun, Utensils, Camera, ShoppingBag, ArrowRight } from "lucide-react";

// --- Types ---
type CityDataItem = {
    weather: { temp: string; condition: string; desc: string };
    food: string;
    spot: string;
    market: string;
    themeColor: string;
};

// --- Mock Data (Fallback) ---
// 실제 날씨 API 연동 전까지 사용할 데이터입니다. 디자인을 위해 구조를 세분화했습니다.
const cityData: { [key: string]: CityDataItem } = {
    leg1: {
        weather: { temp: "2°", condition: "Cloudy", desc: "흐림/비" },
        food: "뉘른베르크 소시지 & 사우어크라우트",
        spot: "성 제발두스 교회 석양 뷰",
        market: "Hauptmarkt 중앙 광장",
        themeColor: "from-blue-500 to-cyan-400",
    },
    leg2: {
        weather: { temp: "-1°", condition: "Snow", desc: "눈/흐림" },
        food: "꼴레뇨 & 코젤 다크 직영점",
        spot: "카렐교 새벽 6시 산책",
        market: "하벨 시장 (기념품)",
        themeColor: "from-orange-500 to-amber-400",
    },
    leg3: {
        weather: { temp: "1°", condition: "Cloudy", desc: "흐림" },
        food: "커리부어스트 (Curry 36)",
        spot: "이스트 사이드 갤러리",
        market: "마우어파크 플리마켓",
        themeColor: "from-indigo-500 to-purple-400",
    },
    leg4: {
        weather: { temp: "3°", condition: "Rain", desc: "비/바람" },
        food: "피쉬브뢰트헨 (생선 샌드위치)",
        spot: "엘프필하모니 전망대",
        market: "피쉬마켓 (일요일 새벽)",
        themeColor: "from-teal-500 to-emerald-400",
    },
    leg5: {
        weather: { temp: "4°", condition: "Cloudy", desc: "흐림" },
        food: "쾰쉬 맥주 (무한 리필)",
        spot: "쾰른 대성당 남탑",
        market: "Hohe Straße 쇼핑 거리",
        themeColor: "from-rose-500 to-pink-400",
    },
};

const LEG_MAPPING: { [key: string]: string } = {
    leg1: "Frankfurt",
    leg2: "Prague",
    leg3: "Berlin",
    leg4: "Hamburg",
    leg5: "Cologne",
};

interface Props {
    activeLeg: string;
}

// --- Sub-components ---
const CardSkeleton = () => (
    <div className="animate-pulse flex flex-col gap-2 w-full">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    </div>
);

export default function CityGuide({ activeLeg }: Props) {
    const fallback = cityData[activeLeg] || cityData["leg1"];
    const [data, setData] = useState<CityDataItem>(fallback);
    const [loading, setLoading] = useState(false);
    const cityName = LEG_MAPPING[activeLeg] || "Unknown City";

    useEffect(() => {
        setData(cityData[activeLeg] || cityData["leg1"]);

        const fetchData = async () => {
            const city = LEG_MAPPING[activeLeg];
            if (!city) return;

            setLoading(true);
            try {
                // 실제 API 호출 (여기서는 시뮬레이션)
                // const [foodRes, spotRes, marketRes] = await Promise.all([...]);

                // Demo Delay for skeleton showcase
                await new Promise(resolve => setTimeout(resolve, 800));

                // 데이터 업데이트 로직 유지...
            } catch (error) {
                console.error("Failed to fetch Places data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeLeg]);

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1"
                    >
                        Current Location
                    </motion.p>
                    <motion.h2
                        key={cityName}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl font-extrabold text-slate-900 tracking-tight"
                    >
                        {cityName}
                    </motion.h2>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${data.themeColor} blur-xl opacity-40 absolute right-4 top-4`} />
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-2 gap-4">

                {/* Weather Widget (Span 2) */}
                <motion.div
                    className="col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between relative overflow-hidden group"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className="z-10">
                        <p className="text-gray-500 font-medium text-sm">Today's Weather</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-5xl font-bold text-slate-800 tracking-tighter">{data.weather.temp}</h3>
                            <span className="text-lg text-gray-600 font-medium">{data.weather.desc}</span>
                        </div>
                    </div>
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${data.themeColor} opacity-20 absolute -right-6 -top-6 blur-2xl group-hover:opacity-30 transition-opacity`} />
                    <div className="z-10 bg-slate-50 p-3 rounded-full text-slate-700 shadow-sm">
                        {data.weather.condition === 'Snow' ? <Cloud size={32} /> : <Sun size={32} />}
                    </div>
                </motion.div>

                {/* Food Card */}
                <InfoCard
                    title="Must Eat"
                    icon={<Utensils size={20} className="text-orange-500" />}
                    content={data.food}
                    loading={loading}
                    delay={0.1}
                />

                {/* Spot Card */}
                <InfoCard
                    title="Hidden Spot"
                    icon={<Camera size={20} className="text-purple-500" />}
                    content={data.spot}
                    loading={loading}
                    delay={0.2}
                />

                {/* Market Card (Span 2) */}
                <motion.div
                    className="col-span-2 bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                            <ShoppingBag size={20} className="text-yellow-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Shopping</span>
                    </div>

                    {loading ? (
                        <div className="animate-pulse h-6 bg-white/20 rounded w-2/3" />
                    ) : (
                        <h4 className="text-xl font-bold leading-relaxed">{data.market}</h4>
                    )}

                    <div className="absolute right-0 bottom-0 p-6 opacity-5">
                        <ShoppingBag size={120} />
                    </div>
                </motion.div>

            </div>

            {/* API Credit / Refresh */}
            <div className="mt-6 flex justify-center">
                <button className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors">
                    Powered by Google Places <ArrowRight size={10} />
                </button>
            </div>
        </div>
    );
}

// Small Sub-component for Grid Items
function InfoCard({ title, icon, content, loading, delay }: any) {
    return (
        <motion.div
            className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between h-36"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring" }}
            whileHover={{ y: -2 }}
        >
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase">{title}</span>
                <div className="p-2 bg-slate-50 rounded-full">{icon}</div>
            </div>

            <div className="mt-2">
                {loading ? (
                    <CardSkeleton />
                ) : (
                    <p className="font-semibold text-slate-800 text-lg leading-tight line-clamp-2">
                        {content}
                    </p>
                )}
            </div>
        </motion.div>
    );
}