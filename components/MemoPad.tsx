"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Plus, MapPin, MessageCircle, X, Trash2, Map as MapIcon, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Lazy load MemoComments to avoid circular deps if any
const MemoComments = dynamic(() => import("./MemoComments"), { ssr: false });

type MemoTab = "todo" | "wish" | "goals";

interface MemoItem {
    id: string;
    title: string;
    content: string;
    lat?: number;
    lng?: number;
    completed: boolean;
    category: MemoTab;
    uid: string;
    nickname: string;
    createdAt: Timestamp | null;
}

// Marker Icon fix
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function MemoPad() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<MemoTab>("todo");
    const [memos, setMemos] = useState<MemoItem[]>([]);

    // UI States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null); // For Detail View

    // Create Form State
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newLocation, setNewLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Load Memos
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MemoItem[];
            setMemos(ms);
        });
        return () => unsubscribe();
    }, [user]);

    const handleAddLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setNewLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setIsLocating(false);
                },
                (err) => {
                    alert("위치를 가져올 수 없습니다.");
                    setIsLocating(false);
                }
            );
        } else {
            setIsLocating(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !user) return;

        try {
            await addDoc(collection(db, "memos"), {
                title: newTitle,
                content: newContent,
                lat: newLocation?.lat,
                lng: newLocation?.lng,
                completed: false,
                category: activeTab,
                uid: user.uid,
                nickname: userProfile?.nickname || user.displayName || "멤버",
                createdAt: serverTimestamp()
            });
            setIsCreateOpen(false);
            setNewTitle("");
            setNewContent("");
            setNewLocation(null);
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await deleteDoc(doc(db, "memos", id));
            if (selectedMemo?.id === id) setSelectedMemo(null);
        }
    };

    const filteredMemos = memos.filter(m => m.category === activeTab);

    return (
        <div className="w-full bg-white text-black font-sans min-h-[500px]">
            {/* Header & Tabs */}
            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
                        여행 노트
                    </h2>
                    <p className="text-gray-400 font-medium text-xs ml-1">
                        {filteredMemos.length}개의 기록
                    </p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    {(["todo", "wish", "goals"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab
                                ? "bg-white text-black shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab === "todo" && "할 일"}
                            {tab === "wish" && "위시"}
                            {tab === "goals" && "목표"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Memo List (Board) */}
            <div className="space-y-3 pb-20">
                {filteredMemos.map((memo) => (
                    <motion.div
                        layoutId={memo.id}
                        key={memo.id}
                        onClick={() => setSelectedMemo(memo)}
                        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{memo.title}</h3>
                            {memo.lat && <MapPin size={16} className="text-slate-400" />}
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                            {memo.content || "내용 없음"}
                        </p>

                        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-3">
                            <span className="font-bold text-slate-700">{memo.nickname}</span>
                            <div className="flex items-center gap-1">
                                <MessageCircle size={12} />
                                <span>댓글 확인</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredMemos.length === 0 && (
                    <div className="py-20 text-center text-gray-300">
                        기록이 없습니다.
                    </div>
                )}
            </div>

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-40">
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-slate-900 hover:bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 duration-200"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-safe overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-900">새로운 기록</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="p-2 bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="제목을 입력하세요"
                                    className="w-full text-xl font-bold placeholder:text-gray-300 border-none outline-none"
                                />
                                <div className="h-px bg-gray-100 w-full" />
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="내용을 자유롭게 작성하세요..."
                                    rows={5}
                                    className="w-full text-base font-medium placeholder:text-gray-300 border-none outline-none resize-none"
                                />

                                {/* Location Button */}
                                <button
                                    onClick={handleAddLocation}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl w-full transition-colors ${newLocation ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}
                                >
                                    {isLocating ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                                    <span className="font-bold text-sm">
                                        {newLocation ? "위치 첨부됨" : "현재 위치 첨부하기"}
                                    </span>
                                </button>

                                <button
                                    onClick={handleCreate}
                                    disabled={!newTitle.trim()}
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black disabled:opacity-50 mt-4"
                                >
                                    저장하기
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedMemo && (
                    <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            layoutId={selectedMemo.id}
                            className="bg-white w-full max-w-md h-[80vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white z-10 sticky top-0">
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{selectedMemo.title}</h3>
                                    <p className="text-xs font-bold text-slate-500">
                                        Published by {selectedMemo.nickname}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {user?.uid === selectedMemo.uid && (
                                        <button onClick={() => handleDelete(selectedMemo.id)} className="p-2 text-gray-300 hover:text-red-500">
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedMemo(null)} className="p-2 bg-gray-100 rounded-full">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                                    {selectedMemo.content}
                                </p>

                                {/* Map View if Location exists */}
                                {selectedMemo.lat && selectedMemo.lng && (
                                    <div className="h-48 w-full rounded-2xl overflow-hidden mb-8 border border-gray-100 shadow-inner">
                                        <MapContainer
                                            center={[selectedMemo.lat, selectedMemo.lng]}
                                            zoom={14}
                                            scrollWheelZoom={false}
                                            zoomControl={false}
                                            className="w-full h-full"
                                        >
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <Marker position={[selectedMemo.lat, selectedMemo.lng]} icon={icon} />
                                        </MapContainer>
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <MessageCircle size={18} />
                                        댓글
                                    </h4>
                                    <MemoComments memoId={selectedMemo.id} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
