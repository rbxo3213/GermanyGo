"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";
import "./MapStyles.css";

// Fix Leaflet Default Icon Issue in React
const icon = L.icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Default icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


interface Footprint {
    id: string;
    lat: number;
    lng: number;
    message: string;
    nickname: string;
    createdAt: Timestamp | null;
}

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 15, { duration: 2 });
        }
    }, [coords, map]);
    return null;
}

export default function LBSDiscovery() {
    const { user } = useAuth();
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [footprints, setFootprints] = useState<Footprint[]>([]);
    const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // 1. Get Current Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoading(false);
                },
                (err) => {
                    console.error("Location Error:", err);
                    // Default to Berlin if location fails
                    setPosition([52.5200, 13.4050]);
                    setLoading(false);
                }
            );
        } else {
            setPosition([52.5200, 13.4050]);
            setLoading(false);
        }
    }, []);

    // 2. Load Footprints from Firestore
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

    // 3. Handle Leave Footprint
    const handleLeaveFootprint = async () => {
        if (!position || !user || !message.trim()) return;

        try {
            await addDoc(collection(db, "footprints"), {
                lat: position[0],
                lng: position[1],
                message: message,
                nickname: user.displayName || "Traveler",
                uid: user.uid,
                createdAt: serverTimestamp()
            });

            setMessage("");
            setIsMsgModalOpen(false);
            alert("발자취를 남겼습니다! 🐾");
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    if (loading || !position) {
        return <div className="h-[60vh] flex flex-col items-center justify-center text-gray-300 gap-2">
            <Loader2 className="animate-spin text-2xl text-slate-400" />
            <span className="text-sm font-medium">위치 찾는 중...</span>
        </div>;
    }

    return (
        <section className="relative w-full h-[calc(100vh-180px)] rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 flex flex-col bg-slate-50">
            {/* Title Overlay */}
            <div className="absolute top-4 left-0 right-0 z-[400] flex justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-lg border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span>🚩</span> 여행지 발자취 기록
                    </h2>
                </div>
            </div>

            {/* Map */}
            <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="flex-1 w-full h-full z-0 outline-none">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToLocation coords={position} />

                {/* Current User Marker */}
                <Marker position={position} icon={DefaultIcon}>
                    <Popup>현재 내 위치</Popup>
                </Marker>

                {/* Other Footprints */}
                {footprints.map((fp) => (
                    <Marker key={fp.id} position={[fp.lat, fp.lng]} icon={DefaultIcon}>
                        <Popup>
                            <div className="text-center p-1">
                                <p className="font-bold text-sm mb-1">{fp.message}</p>
                                <p className="text-xs text-blue-500">- {fp.nickname}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Check-in Button */}
            <div className="absolute bottom-6 right-6 z-[400]">
                <button
                    onClick={() => setIsMsgModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-95"
                >
                    <span className="text-2xl">🐾</span>
                </button>
            </div>

            {/* Message Modal */}
            {isMsgModalOpen && (
                <div className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">발자취 남기기</h3>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="이 장소에 대한 생각..."
                            rows={3}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsMsgModalOpen(false)}
                                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLeaveFootprint}
                                className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl shadow-lg shadow-blue-200"
                            >
                                남기기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
