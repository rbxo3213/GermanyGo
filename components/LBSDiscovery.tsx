"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, getDoc, updateDoc, getDocs, where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Plus, MapPin } from "lucide-react";

// Flag Options
// Flag Options (Colors)
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
        html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); transform: translateY(-20px); transition: transform 0.2s;">
            ${getFlagSvg(colorCode)}
        </div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 46]
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

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 14, { duration: 1.5 });
        }
    }, [coords, map]);
    return null;
}

export default function LBSDiscovery() {
    const { user, userProfile } = useAuth(); // Destructure userProfile
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [footprints, setFootprints] = useState<Footprint[]>([]);

    // UI State
    const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // Edit Mode State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Flag State
    const [myFlag, setMyFlag] = useState<string | null>(null); // The user's persistent flag
    const [isFlagSelectionOpen, setIsFlagSelectionOpen] = useState(false);
    const [takenFlags, setTakenFlags] = useState<string[]>([]);
    const [pendingFlag, setPendingFlag] = useState<string | null>(null);

    // 1. Initial Load: Get Location & Check Flag
    useEffect(() => {
        if (!user) return;

        // Get Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoading(false);
                },
                (err) => {
                    console.error("Location Error:", err);
                    setPosition([52.5200, 13.4050]); // Berlin
                    setLoading(false);
                }
            );
        } else {
            setPosition([52.5200, 13.4050]);
            setLoading(false);
        }

        // Check Flag in User Profile (Optimized: use userProfile if available)
        if (userProfile && userProfile.flag) {
            setMyFlag(userProfile.flag);
        } else {
            const checkUserFlag = async () => {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.flag) {
                        setMyFlag(data.flag);
                    } else {
                        // No flag set -> Open Selection
                        await fetchTakenFlags();
                        setIsFlagSelectionOpen(true);
                    }
                }
            };
            checkUserFlag();
        }

    }, [user, userProfile]);

    // Helper: Fetch Taken Flags
    const fetchTakenFlags = async () => {
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        const taken: string[] = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.flag) taken.push(data.flag);
        });
        setTakenFlags(taken);
    };

    // 2. Load Footprints
    useEffect(() => {
        const q = query(collection(db, "footprints"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prints = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Footprint[];
            setFootprints(prints);
        });
        return () => unsubscribe();
    }, []);

    // 3. Confirm Flag Selection
    const handleConfirmFlag = async () => {
        if (!pendingFlag || !user) return;

        // Double check taken (optimistic)
        if (takenFlags.includes(pendingFlag)) {
            alert("이미 다른 멤버가 선택한 깃발입니다!");
            await fetchTakenFlags();
            return;
        }

        try {
            await updateDoc(doc(db, "users", user.uid), { flag: pendingFlag });
            setMyFlag(pendingFlag);
            setIsFlagSelectionOpen(false);
        } catch (e) {
            console.error(e);
            alert("깃발 저장 실패");
        }
    };

    // 4. Leave / Update Footprint
    const handleSaveFootprint = async () => {
        if (!user || !message.trim() || !myFlag) return;

        try {
            if (editingId) {
                // Update
                await updateDoc(doc(db, "footprints", editingId), {
                    message: message,
                    // Optionally update nickname if user changed it? 
                    // Let's keep original nickname or update it too.
                    nickname: userProfile?.nickname || user.displayName || "여행자",
                });
            } else {
                // Create
                if (!position) return;
                await addDoc(collection(db, "footprints"), {
                    lat: position[0],
                    lng: position[1],
                    message: message,
                    nickname: userProfile?.nickname || user.displayName || "여행자", // Use Profile Nickname
                    flag: myFlag,
                    uid: user.uid,
                    createdAt: serverTimestamp()
                });
            }

            setMessage("");
            setEditingId(null);
            setIsMsgModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    // Open Edit Modal
    const openEditModal = (fp: Footprint) => {
        setMessage(fp.message);
        setEditingId(fp.id);
        setIsMsgModalOpen(true);
    };

    if (loading || !position) {
        return <div className="h-[50vh] flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="animate-spin text-3xl text-slate-300" />
            <span className="text-sm font-medium tracking-tight">위치 탐색 중...</span>
        </div>;
    }

    return (
        <section className="relative w-full h-[60vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col bg-white">
            {/* Map */}
            <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="flex-1 w-full h-full z-0 outline-none bg-slate-50">
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <FlyToLocation coords={position} />

                {/* Markers */}
                {footprints.map((fp) => {
                    const flagColorObj = FLAG_COLORS.find(c => c.color === fp.flag);
                    const flagName = flagColorObj ? flagColorObj.label : "깃발";

                    return (
                        <Marker key={fp.id} position={[fp.lat, fp.lng]} icon={createFlagIcon(fp.flag || "#000")}>
                            <Popup className="custom-popup">
                                <div className="text-center p-3 min-w-[160px]">
                                    <div className="text-3xl mb-2 drop-shadow-sm">{fp.flag === myFlag ? "🚩" : "🏳️"}</div>
                                    {/* Actually show SVG? No, text is fine or maybe the icon itself is enough */}

                                    <p className="font-bold text-base text-slate-900 mb-1 break-keep leading-snug">"{fp.message}"</p>

                                    <div className="text-xs text-gray-500 bg-gray-100 rounded-lg py-1 px-2 mt-2 inline-block">
                                        <span className="font-bold block text-slate-700">{flagName} 깃발</span>
                                        <span>{fp.nickname}님</span> {/* Nickname Display */}
                                    </div>

                                    {user && user.uid === fp.uid && (
                                        <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(fp);
                                                }}
                                                className="text-xs text-slate-900 font-bold hover:underline"
                                            >
                                                수정
                                            </button>
                                            <div className="w-px h-3 bg-gray-300"></div>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm("이 발자취를 삭제할까요?")) {
                                                        const { deleteDoc, doc } = await import("firebase/firestore");
                                                        await deleteDoc(doc(db, "footprints", fp.id));
                                                    }
                                                }}
                                                className="text-xs text-red-500 font-bold hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* FAB */}
            <div className="absolute bottom-6 right-6 z-[400]">
                <button
                    onClick={() => {
                        setMessage("");
                        setEditingId(null);
                        setIsMsgModalOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 duration-200"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>

            {/* Modal: Flag Selection (First Time) */}
            {isFlagSelectionOpen && (
                <div className="absolute inset-0 z-[600] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
                    <div className="max-w-xs w-full text-center">
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">나만의 깃발 선택</h3>
                        <p className="text-sm text-gray-500 mb-6">멤버들과 중복되지 않는<br />나만의 시그니처 깃발을 골라주세요.</p>

                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {FLAG_COLORS.map((f) => {
                                const isTaken = takenFlags.includes(f.color);
                                return (
                                    <button
                                        key={f.id}
                                        disabled={isTaken}
                                        onClick={() => setPendingFlag(f.color)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative
                                            ${isTaken ? "opacity-20 cursor-not-allowed bg-gray-100" :
                                                pendingFlag === f.color ? "bg-slate-100 ring-4 ring-slate-900 scale-110" : "hover:scale-105 hover:bg-gray-50"}`}
                                        title={f.label}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: getFlagSvg(f.color) }} className="scale-75" />
                                        {isTaken && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">X</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleConfirmFlag}
                            disabled={!pendingFlag}
                            className="w-full py-4 text-white font-bold bg-slate-900 rounded-2xl shadow-lg disabled:opacity-50 transition-all hover:bg-black"
                        >
                            이 깃발로 정하기
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Leave/Edit Message */}
            {isMsgModalOpen && (
                <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-gray-100">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{editingId ? "발자취 수정" : "발자취 남기기"}</h3>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <span>내 깃발:</span>
                                <span className="text-lg" style={{ color: myFlag || '#000' }}>●</span>
                            </div>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 mb-6 focus:ring-2 focus:ring-slate-900/10 outline-none text-base font-medium placeholder:text-gray-400 resize-none"
                            placeholder="이곳의 추억을 기록하세요..."
                            rows={3}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsMsgModalOpen(false);
                                    setEditingId(null);
                                    setMessage("");
                                }}
                                className="flex-1 py-4 text-gray-500 font-bold bg-gray-100 rounded-2xl hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveFootprint}
                                className="flex-1 py-4 text-white font-bold bg-slate-900 rounded-2xl shadow-lg hover:bg-black"
                            >
                                {editingId ? "수정완료" : "기록하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
