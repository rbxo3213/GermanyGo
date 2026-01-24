"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, updateDoc, doc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Plus, Filter, Crosshair, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Flag Options & Icons ---
const FLAG_COLORS = [
    { id: "red", color: "#EF4444", label: "레드" },
    { id: "orange", color: "#F97316", label: "오렌지" },
    { id: "amber", color: "#F59E0B", label: "호박색" },
    { id: "yellow", color: "#EAB308", label: "옐로우" },
    { id: "lime", color: "#84CC16", label: "라임" },
    { id: "green", color: "#22C55E", label: "그린" },
    { id: "emerald", color: "#10B981", label: "에메랄드" },
    { id: "teal", color: "#14B8A6", label: "청록" },
    { id: "cyan", color: "#06B6D4", label: "시안" },
    { id: "sky", color: "#0EA5E9", label: "하늘" },
    { id: "blue", color: "#3B82F6", label: "블루" },
    { id: "indigo", color: "#6366F1", label: "인디고" },
    { id: "violet", color: "#8B5CF6", label: "바이올렛" },
    { id: "purple", color: "#A855F7", label: "퍼플" },
    { id: "fuchsia", color: "#D946EF", label: "푸시아" },
    { id: "pink", color: "#EC4899", label: "핑크" },
    { id: "rose", color: "#F43F5E", label: "로즈" },
];

const getFlagSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 24 24" fill="${color}" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
</svg>
`;

const createFlagIcon = (colorCode: string) => {
    return L.divIcon({
        className: 'custom-flag-marker',
        html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transform: translateY(-20px);">
            ${getFlagSvg(colorCode)}
        </div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 46],
        popupAnchor: [0, -45]
    });
};

const createClusterCustomIcon = function (cluster: any) {
    return L.divIcon({
        html: `<div class="flex items-center justify-center w-10 h-10 bg-slate-900 text-[#FFCE00] rounded-full border-2 border-white shadow-xl font-black text-sm">
            ${cluster.getChildCount()}
        </div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

interface Footprint {
    id: string;
    lat: number;
    lng: number;
    message: string;
    nickname: string;
    flag: string;
    uid: string;
    createdAt: Timestamp | null;
}

// Map Controller
function MapController({ coords, trigger }: { coords: [number, number] | null, trigger: number }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 16, { duration: 1.2 }); // Zoom level increased to 16
        }
    }, [coords, map, trigger]);
    return null;
}

export default function LBSDiscovery() {
    const { user, userProfile } = useAuth();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [footprints, setFootprints] = useState<Footprint[]>([]);

    const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [flyTrigger, setFlyTrigger] = useState(0);

    const [myFlag, setMyFlag] = useState<string | null>(null);
    const [isFlagSelectionOpen, setIsFlagSelectionOpen] = useState(false);
    const [takenFlags, setTakenFlags] = useState<string[]>([]);
    const [pendingFlag, setPendingFlag] = useState<string | null>(null);

    // 1. Initial Load & GPS
    useEffect(() => {
        if (!user) return;

        // Force High Accuracy GPS
        const getExactLocation = () => {
            if (!navigator.geolocation) {
                alert("GPS를 지원하지 않는 브라우저입니다.");
                setLoading(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoading(false);
                },
                (err) => {
                    console.error("GPS Error:", err);
                    alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
                    // Fallback to Berlin
                    setPosition([52.5200, 13.4050]);
                    setLoading(false);
                },
                {
                    enableHighAccuracy: true, // 중요: 정확도 우선
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        };

        getExactLocation();

        // Flag Check
        if (userProfile && userProfile.flag) {
            setMyFlag(userProfile.flag);
        } else {
            const checkUserFlag = async () => {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists() && snap.data().flag) {
                    setMyFlag(snap.data().flag);
                } else {
                    await fetchTakenFlags();
                    setIsFlagSelectionOpen(true);
                }
            };
            checkUserFlag();
        }
    }, [user, userProfile]);

    const fetchTakenFlags = async () => {
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        const taken: string[] = [];
        snap.forEach(d => { if (d.data().flag) taken.push(d.data().flag); });
        setTakenFlags(taken);
    };

    // 2. Load Footprints
    useEffect(() => {
        const q = query(collection(db, "footprints"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Footprint[];
            setFootprints(prints);
        });
        return () => unsubscribe();
    }, []);

    // 3. Confirm Flag
    const handleConfirmFlag = async () => {
        if (!pendingFlag || !user) return;
        if (takenFlags.includes(pendingFlag)) {
            alert("이미 선택된 깃발입니다!");
            await fetchTakenFlags();
            return;
        }
        try {
            await updateDoc(doc(db, "users", user.uid), { flag: pendingFlag });
            setMyFlag(pendingFlag);
            setIsFlagSelectionOpen(false);
        } catch (e) { alert("저장 실패"); }
    };

    // 4. Save Footprint
    const handleSaveFootprint = async () => {
        if (!user || !message.trim() || !myFlag || !position) return;
        try {
            if (editingId) {
                await updateDoc(doc(db, "footprints", editingId), {
                    message,
                    nickname: userProfile?.nickname || "여행자",
                });
            } else {
                await addDoc(collection(db, "footprints"), {
                    lat: position[0],
                    lng: position[1],
                    message,
                    nickname: userProfile?.nickname || "여행자",
                    flag: myFlag,
                    uid: user.uid,
                    createdAt: serverTimestamp()
                });
            }
            setMessage("");
            setEditingId(null);
            setIsMsgModalOpen(false);
        } catch (e) { alert("저장 실패"); }
    };

    const displayedFootprints = showOnlyMine
        ? footprints.filter(fp => fp.uid === user?.uid)
        : footprints;

    if (loading || !position) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-slate-900 rounded-full animate-spin"></div>
                    <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900" size={16} />
                </div>
                <span className="text-sm font-bold text-gray-400 animate-pulse">정확한 위치를 찾는 중...</span>
            </div>
        );
    }

    return (
        <section className="relative w-full h-[65vh] rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-200 flex flex-col bg-white">

            <MapContainer center={position} zoom={16} scrollWheelZoom={true} className="flex-1 w-full h-full z-0 outline-none bg-slate-50">
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapController coords={position} trigger={flyTrigger} />

                <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterCustomIcon}
                    maxClusterRadius={40} // 🔴 민감도 조정: 40px 이내만 묶음 (덜 뭉침)
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {displayedFootprints.map((fp) => (
                        <Marker key={fp.id} position={[fp.lat, fp.lng]} icon={createFlagIcon(fp.flag || "#000")}>
                            <Popup className="custom-popup" closeButton={false} maxWidth={200}>
                                <div className="text-center p-1">
                                    <div className="text-3xl mb-2 filter drop-shadow-sm">{fp.flag === myFlag ? "🚩" : "🏳️"}</div>
                                    <p className="font-bold text-slate-900 text-[15px] mb-2 break-keep leading-relaxed px-1">"{fp.message}"</p>
                                    <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 bg-gray-50 rounded-full px-3 py-1 mb-1">
                                        <span className="font-bold text-slate-600">{fp.nickname}</span>
                                        <span>•</span>
                                        <span>지금</span>
                                    </div>
                                    {user && user.uid === fp.uid && (
                                        <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMessage(fp.message);
                                                    setEditingId(fp.id);
                                                    setIsMsgModalOpen(true);
                                                }}
                                                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                            >수정</button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm("삭제할까요?")) {
                                                        const { deleteDoc, doc } = await import("firebase/firestore");
                                                        await deleteDoc(doc(db, "footprints", fp.id));
                                                    }
                                                }}
                                                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                                            >삭제</button>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {/* --- Controls --- */}

            <div className="absolute top-5 left-5 z-[400]">
                <button
                    onClick={() => setShowOnlyMine(!showOnlyMine)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-bold transition-all border
                        ${showOnlyMine
                            ? "bg-slate-900 text-[#FFCE00] border-slate-900"
                            : "bg-white text-slate-600 border-gray-100 hover:bg-gray-50"}`}
                >
                    <Filter size={14} />
                    {showOnlyMine ? "내 깃발만" : "모두 보기"}
                </button>
            </div>

            <div className="absolute top-5 right-5 z-[400]">
                <button
                    onClick={() => setFlyTrigger(prev => prev + 1)}
                    className="p-3 bg-white text-slate-700 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
                >
                    <Crosshair size={20} />
                </button>
            </div>

            <div className="absolute bottom-8 right-6 z-[400]">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setMessage("");
                        setEditingId(null);
                        setIsMsgModalOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors"
                >
                    <Plus size={28} strokeWidth={3} />
                </motion.button>
            </div>

            {/* --- Modals --- */}

            {/* Flag Selection */}
            <AnimatePresence>
                {isFlagSelectionOpen && (
                    <div className="absolute inset-0 z-[600] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-xs w-full text-center"
                        >
                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">나만의 깃발 고르기 🚩</h3>
                            <p className="text-xs text-gray-500 mb-6">지도에 표시될 나만의 색상을 정해주세요.</p>

                            <div className="grid grid-cols-5 gap-3 mb-8 p-1">
                                {FLAG_COLORS.map((f) => {
                                    const isTaken = takenFlags.includes(f.color);
                                    return (
                                        <button
                                            key={f.id} disabled={isTaken} onClick={() => setPendingFlag(f.color)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative
                                                ${isTaken ? "opacity-20 cursor-not-allowed" :
                                                    pendingFlag === f.color ? "bg-slate-100 ring-2 ring-slate-900 scale-110 shadow-md" : "hover:scale-110 hover:bg-gray-50"}`}
                                        >
                                            <div dangerouslySetInnerHTML={{ __html: getFlagSvg(f.color) }} className="scale-[0.65]" />
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={handleConfirmFlag} disabled={!pendingFlag} className="w-full py-3.5 text-white font-bold bg-slate-900 rounded-2xl shadow-lg disabled:opacity-50 hover:bg-black transition-colors">
                                선택 완료
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Message Modal (Refined UI) */}
            <AnimatePresence>
                {isMsgModalOpen && (
                    <div className="absolute inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsMsgModalOpen(false)}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>

                            <div className="text-center mb-6 mt-2">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {editingId ? "기록 수정하기" : "여기에 발자취 남기기"}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">이 장소에서의 기억을 깃발로 꽂아두세요</p>
                            </div>

                            <textarea
                                value={message} onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 mb-4 focus:ring-2 focus:ring-slate-900 outline-none text-base font-medium resize-none placeholder:text-gray-400 min-h-[100px]"
                                placeholder="예: 여기 커피 진짜 맛있다! ☕️"
                            />

                            <button
                                onClick={handleSaveFootprint}
                                disabled={!message.trim()}
                                className="w-full py-4 text-white font-bold bg-slate-900 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingId ? "수정 완료" : "깃발 꽂기"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}