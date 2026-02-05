"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Snowflake, Utensils, Camera, ShoppingBag, MapPin, Navigation, ArrowRight, AlertCircle, Download } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

// --- Types ---
type PlaceInfo = {
    name: string;
    rating?: number;
    user_ratings_total?: number;
    place_id: string;
    geometry?: { location: { lat: number; lng: number } };
    formatted_address?: string;
};

type CategoryData = {
    items: PlaceInfo[];
    loading: boolean;
};

type CityDataItem = {
    weather: { temp: string; code: number; desc: string };
    food: CategoryData;
    spot: CategoryData;
    market: CategoryData;
    themeColor: string;
};

// --- Config: Cities Coordinates ---
const CITY_COORDS: { [key: string]: { lat: number; lng: number } } = {
    "Frankfurt": { lat: 50.1109, lng: 8.6821 },
    "Prague": { lat: 50.0755, lng: 14.4378 },
    "Berlin": { lat: 52.5200, lng: 13.4050 },
    "Hamburg": { lat: 53.5511, lng: 9.9937 },
    "Cologne": { lat: 50.9375, lng: 6.9603 },
};

const cityThemes: { [key: string]: string } = {
    leg1: "from-blue-500 to-cyan-400",
    leg2: "from-orange-500 to-amber-400",
    leg3: "from-indigo-500 to-purple-400",
    leg4: "from-teal-500 to-emerald-400",
    leg5: "from-rose-500 to-pink-400",
};

const LEG_MAPPING: { [key: string]: string } = {
    leg1: "Frankfurt", leg2: "Prague", leg3: "Berlin", leg4: "Hamburg", leg5: "Cologne",
};

// --- Helpers ---
const openGoogleMap = (place: PlaceInfo) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, '_blank');
};

const getWeatherDesc = (code: number) => {
    if (code === 0) return "맑음";
    if (code <= 3) return "구름 조금";
    if (code <= 48) return "안개";
    if (code <= 67) return "비";
    if (code <= 77) return "눈";
    if (code <= 82) return "소나기";
    if (code <= 86) return "눈보라";
    return "흐림";
};

const WeatherIcon = ({ code }: { code: number }) => {
    if (code === 0 || code === 1) return <Sun size={28} className="text-orange-400" />;
    if (code <= 48) return <Cloud size={28} className="text-gray-400" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={28} className="text-blue-400" />;
    if (code >= 71) return <Snowflake size={28} className="text-cyan-300" />;
    return <Cloud size={28} className="text-gray-400" />;
};

interface Props {
    activeLeg: string;
}

export default function CityGuide({ activeLeg }: Props) {
    const { dataSaver } = useSettings();
    const cityName = LEG_MAPPING[activeLeg] || "Frankfurt";
    const themeColor = cityThemes[activeLeg] || "from-blue-500 to-cyan-400";

    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [useGPS, setUseGPS] = useState(false);
    const [gpsError, setGpsError] = useState(false);

    const [data, setData] = useState<CityDataItem>({
        weather: { temp: "--", code: 0, desc: "로딩 중..." },
        food: { items: [], loading: false },
        spot: { items: [], loading: false },
        market: { items: [], loading: false },
        themeColor,
    });

    // 1. GPS Tracking
    useEffect(() => {
        if (!navigator.geolocation) return;

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const success = (pos: GeolocationPosition) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;

            setLocation(prev => {
                if (prev) {
                    // 🚀 핵심 수정: 소수점 2자리(약 1.1km)까지만 비교
                    const prevLatFixed = prev.lat.toFixed(2);
                    const prevLngFixed = prev.lng.toFixed(2);
                    const newLatFixed = newLat.toFixed(2);
                    const newLngFixed = newLng.toFixed(2);

                    // 1km 내외 이동이면 상태 업데이트 안 함 -> API 호출 원천 차단
                    if (prevLatFixed === newLatFixed && prevLngFixed === newLngFixed) {
                        return prev;
                    }
                }
                return { lat: newLat, lng: newLng };
            });
            setGpsError(false);
        };

        const error = (err: GeolocationPositionError) => {
            console.warn("GPS Fail:", err.message);
            setGpsError(true);
        };

        const watcher = navigator.geolocation.watchPosition(success, error, options);
        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    // 2. Fetch Data
    const fetchPlaces = async (force = false) => {
        if (dataSaver && !force) {
            console.log("Data Saver ON: Skipping Places API");
            setData(prev => ({
                ...prev,
                food: { ...prev.food, loading: false },
                spot: { ...prev.spot, loading: false },
                market: { ...prev.market, loading: false },
            }));
            return;
        }

        setData(prev => ({
            ...prev,
            food: { ...prev.food, loading: true },
            spot: { ...prev.spot, loading: true },
            market: { ...prev.market, loading: true },
        }));

        try {
            if (useGPS && !location) return;

            const baseQuery = useGPS ? "" : `${cityName} `;
            const locationParams = useGPS && location
                ? `&lat=${location.lat.toFixed(2)}&lng=${location.lng.toFixed(2)}&radius=2000`
                : "";

            const queries = [
                { key: 'food', q: `${baseQuery}best restaurant` },
                { key: 'spot', q: `${baseQuery}tourist attraction` },
                { key: 'market', q: `${baseQuery}shopping mall or market` }
            ];

            const results = await Promise.all(
                queries.map(async ({ key, q }) => {
                    const res = await fetch(`/api/places?query=${encodeURIComponent(q)}${locationParams}`);
                    if (!res.ok) throw new Error("Server Error");
                    const json = await res.json();
                    return { key, items: json.results?.slice(0, 3) || [] };
                })
            );

            setData(prev => {
                const next = { ...prev };
                results.forEach(({ key, items }) => { (next as any)[key] = { items, loading: false }; });
                return next;
            });

        } catch (error) {
            console.error("Fetch Error:", error);
            setData(prev => ({
                ...prev,
                food: { ...prev.food, loading: false },
                spot: { ...prev.spot, loading: false },
                market: { ...prev.market, loading: false },
            }));
        }
    };

    useEffect(() => {
        setData(prev => ({ ...prev, themeColor }));

        const fetchWeather = async () => {
            let lat = CITY_COORDS[cityName]?.lat;
            let lng = CITY_COORDS[cityName]?.lng;

            if (useGPS && location) {
                lat = location.lat;
                lng = location.lng;
            }

            try {
                if (lat && lng) {
                    const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
                    );
                    const weatherData = await weatherRes.json();

                    if (weatherData.current) {
                        setData(prev => ({
                            ...prev,
                            weather: {
                                temp: `${Math.round(weatherData.current.temperature_2m)}°`,
                                code: weatherData.current.weather_code,
                                desc: getWeatherDesc(weatherData.current.weather_code)
                            }
                        }));
                    }
                }
            } catch (e) { console.error("Weather Error", e); }
        };

        fetchWeather();
        fetchPlaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLeg, cityName, useGPS, location, themeColor, dataSaver]); // Added dataSaver dependency to refetch if turned off

    return (
        <div className="w-full max-w-md mx-auto space-y-8">
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex justify-between items-end px-1">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors ${useGPS ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {useGPS ? (location ? "📍 내 위치 기반" : "📡 위치 찾는 중...") : "✈️ 여행지 기반"}
                        </span>
                        <button
                            onClick={() => setUseGPS(!useGPS)}
                            className={`p-1.5 rounded-full transition-all ${useGPS ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                            {gpsError ? <AlertCircle size={14} className="text-red-500" /> : <Navigation size={14} className={useGPS ? "fill-current" : ""} />}
                        </button>
                    </div>
                    <motion.h2
                        key={useGPS ? 'gps' : cityName}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-black text-slate-900 tracking-tight"
                    >
                        {useGPS ? "내 주변 핫플" : cityName}
                    </motion.h2>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${data.themeColor} blur-2xl opacity-60`} />
            </div>

            <motion.div
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/80 flex items-center justify-between relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
            >
                <div className="z-10">
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">현재 날씨</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{data.weather.temp}</h3>
                        <span className="text-lg text-gray-500 font-semibold">{data.weather.desc}</span>
                    </div>
                </div>
                <div className="z-10 bg-slate-50 p-4 rounded-full text-slate-600 shadow-inner">
                    <WeatherIcon code={data.weather.code} />
                </div>
            </motion.div>

            <div className="space-y-8">
                <PlaceCarousel title="현지 맛집" icon={<Utensils size={18} className="text-orange-500" />} data={data.food} onLoad={() => fetchPlaces(true)} dataSaver={dataSaver} />
                <PlaceCarousel title="주요 명소" icon={<Camera size={18} className="text-purple-500" />} data={data.spot} onLoad={() => fetchPlaces(true)} dataSaver={dataSaver} />
                <PlaceCarousel title="쇼핑 & 마켓" icon={<ShoppingBag size={18} className="text-yellow-500" />} data={data.market} onLoad={() => fetchPlaces(true)} dataSaver={dataSaver} />
            </div>

            <div className="flex justify-center pt-2 pb-6">
                <button className="text-[10px] text-gray-300 flex items-center gap-1 hover:text-gray-500 transition-colors">
                    Powered by Google Places & Open-Meteo <ArrowRight size={8} />
                </button>
            </div>
        </div>
    );
}

function PlaceCarousel({ title, icon, data, onLoad, dataSaver }: { title: string, icon: React.ReactNode, data: CategoryData, onLoad?: () => void, dataSaver?: boolean }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-1">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</div>
                <span className="text-lg font-bold text-slate-800 tracking-tight">{title}</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                {data.loading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="min-w-[85%] h-36 bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 animate-pulse flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="h-5 bg-gray-100 rounded-md w-2/3" />
                                <div className="h-3 bg-gray-50 rounded-md w-1/2" />
                            </div>
                            <div className="h-8 bg-gray-50 rounded-xl w-full" />
                        </div>
                    ))
                ) : data.items.length > 0 ? (
                    data.items.map((place, index) => (
                        <motion.div
                            key={place.place_id}
                            className="min-w-[85%] snap-center bg-white rounded-[1.5rem] p-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-36 cursor-pointer relative overflow-hidden group"
                            onClick={() => openGoogleMap(place)}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-300 leading-none group-hover:text-slate-400 transition-colors pointer-events-none">
                                {index + 1}
                            </div>
                            <div className="relative z-10 pr-6">
                                <h4 className="font-bold text-slate-900 text-lg leading-snug line-clamp-1 mb-1">{place.name}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                    {place.rating ? (
                                        <span className="text-xs font-bold bg-yellow-400/20 text-yellow-700 px-2 py-0.5 rounded-md flex items-center gap-1">★ {place.rating}</span>
                                    ) : (
                                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">정보 없음</span>
                                    )}
                                    <p className="text-xs text-gray-400 line-clamp-1">{place.formatted_address?.split(',')[0] || "주소 정보 없음"}</p>
                                </div>
                            </div>
                            <div className="relative z-10 flex items-center text-xs font-bold text-slate-600 bg-slate-50 w-fit px-3 py-2 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <MapPin size={12} className="mr-1.5" /> 구글 맵에서 보기
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="min-w-full h-36 flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200">
                        {dataSaver ? (
                            <div className="text-center">
                                <span className="block text-xs mb-2">데이터 절약 모드 사용 중</span>
                                <button onClick={onLoad} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 mx-auto hover:bg-black transition-colors">
                                    <Download size={12} /> 데이터 불러오기
                                </button>
                            </div>
                        ) : (
                            <>
                                <Camera size={24} className="mb-2 opacity-50" />
                                <span>추천 장소를 찾을 수 없어요</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}