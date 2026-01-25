"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, limit, startAfter, getDocs } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Camera, Trash2, X, ChevronRight, User, Plus, MapPin, Download, Star, Filter, Utensils, Mountain, ShoppingBag, BedDouble, TentTree, MoreHorizontal, Loader2, Trophy, Backpack, Compass } from "lucide-react";
import ImageCropModal from "./ImageCropModal"; // New

interface TravelLogData {
    id: string;
    title: string;
    images: string[];
    note: string;
    location: string;
    coords?: { lat: number; lng: number };
    category: string;
    uid: string;
    nickname: string;
    createdAt: any;
    ratings?: { [uid: string]: number };
}

const CATEGORIES = [
    { id: "food", label: "맛집", icon: <Utensils size={16} /> },
    { id: "view", label: "풍경", icon: <Mountain size={16} /> },
    { id: "stay", label: "숙소", icon: <BedDouble size={16} /> },
    { id: "activity", label: "액티비티", icon: <TentTree size={16} /> },
    { id: "shopping", label: "쇼핑", icon: <ShoppingBag size={16} /> },
    { id: "etc", label: "기타", icon: <MoreHorizontal size={16} /> },
];

const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function TravelLog() {
    const { user, userProfile } = useAuth();
    const [logs, setLogs] = useState<TravelLogData[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterMember, setFilterMember] = useState<string>("all");
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [note, setNote] = useState("");
    const [category, setCategory] = useState("food");
    const [tempImages, setTempImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Pagination
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Image Crop State
    const [originalImg, setOriginalImg] = useState<string | null>(null);

    const fetchLogs = async (isLoadMore = false) => {
        if (!hasMore && isLoadMore) return;
        setIsLoading(true);
        try {
            let q = query(collection(db, "travel_logs"), orderBy("createdAt", "desc"), limit(10));

            if (isLoadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TravelLogData));

            if (isLoadMore) {
                setLogs(prev => [...prev, ...newLogs]);
            } else {
                setLogs(newLogs);
            }

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === 10);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(false);
    }, []);

    const members = useMemo(() => {
        const names = new Set(logs.map(l => l.nickname));
        return Array.from(names);
    }, [logs]);

    const filteredLogs = logs.filter(log => {
        const catMatch = filterCategory === "all" || log.category === filterCategory;
        const memMatch = filterMember === "all" || log.nickname === filterMember;
        return catMatch && memMatch;
    });

    const myLogs = logs.filter(l => l.uid === user?.uid);
    const myCategoriesCount = new Set(myLogs.map(l => l.category)).size;

    let rankLabel = "초보 여행자";
    let RankIcon = Backpack;
    let rankColor = "bg-slate-900";

    if (myCategoriesCount >= 2) { rankLabel = "여행 매니아"; RankIcon = Backpack; rankColor = "bg-orange-500"; }
    if (myCategoriesCount >= 4) { rankLabel = "프로 탐험가"; RankIcon = Compass; rankColor = "bg-blue-600"; }
    if (myCategoriesCount >= 6) { rankLabel = "마스터 가이드"; RankIcon = Trophy; rankColor = "bg-[#FFCE00] text-black"; }

    const selectedLog = logs.find(l => l.id === selectedLogId) || null;

    const fetchCurrentLocation = () => {
        if (!navigator.geolocation) { alert("GPS를 지원하지 않습니다."); return; }
        setIsLocating(true);
        setLocation("위치 확인 중...");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentCoords({ lat: latitude, lng: longitude });
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const region = addr.province || addr.state || "";
                        const city = addr.city || addr.town || addr.county || "";
                        const road = addr.road || addr.suburb || "";
                        const fullAddress = [region, city, road].filter(Boolean).join(" ");
                        setLocation(fullAddress || data.display_name.split(",")[0]);
                    } else { setLocation("주소를 찾을 수 없음"); }
                } catch (e) {
                    console.error(e);
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } finally { setIsLocating(false); }
            },
            (err) => {
                console.error(err);
                setLocation("위치 정보 없음");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setOriginalImg(reader.result as string);
                // Clear input
                e.target.value = "";
            };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title) return;
        setIsUploading(true);
        try {
            const data: any = {
                title, location, note, category,
                coords: currentCoords,
                images: tempImages,
            };

            if (editId) {
                // Update
                await updateDoc(doc(db, "travel_logs", editId), data);
                // Optimistic Update
                setLogs(prev => prev.map(l => l.id === editId ? { ...l, ...data } : l));
                if (selectedLogId === editId) {
                    // Force refresh or just let optimistic update handle list, detail uses selectedLog from logs
                }
            } else {
                // Create
                data.uid = user.uid;
                data.nickname = userProfile?.nickname || "여행자";
                data.createdAt = serverTimestamp();
                data.ratings = {};
                await addDoc(collection(db, "travel_logs"), data);
                // Refresh list
                fetchLogs(false);
            }
            resetForm();
        } catch (error) { console.error(error); alert("저장 실패"); } finally { setIsUploading(false); }
    };

    const handleEdit = (log: TravelLogData) => {
        setEditId(log.id);
        setTitle(log.title);
        setLocation(log.location);
        setNote(log.note);
        setCategory(log.category);
        setTempImages(log.images || []);
        setCurrentCoords(log.coords || null);
        setSelectedLogId(null);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditId(null);
        setTitle(""); setLocation(""); setCurrentCoords(null); setNote(""); setTempImages([]); setCategory("food"); setOriginalImg(null);
    };

    const handleRate = async (rating: number) => {
        if (!user || !selectedLog) return;
        const logRef = doc(db, "travel_logs", selectedLog.id);
        await updateDoc(logRef, { [`ratings.${user.uid}`]: rating });
        // Optimistic update
        setLogs(prev => prev.map(l => l.id === selectedLog.id ? {
            ...l,
            ratings: { ...l.ratings, [user.uid]: rating }
        } : l));
    };

    const getAvgRating = (ratings?: { [uid: string]: number }) => {
        if (!ratings) return "0.0";
        const vals = Object.values(ratings);
        if (vals.length === 0) return "0.0";
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24">

            {/* Header & Stats */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between mx-1 relative overflow-hidden">
                <div className="flex items-center gap-4 z-10">
                    <div className={`w-14 h-14 ${rankColor} rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors`}>
                        <RankIcon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">My Rank</p>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">{rankLabel}</h2>
                        <p className="text-[10px] text-gray-400 mt-1">
                            다양한 카테고리를 정복하세요! ({myCategoriesCount}/6)
                        </p>
                    </div>
                </div>
                <div className="text-right z-10">
                    <span className="text-4xl font-black text-slate-900">{myLogs.length}</span>
                    <span className="text-xs font-bold text-gray-400 ml-1">LOGS</span>
                </div>
            </div>

            {/* Filters (유지) */}
            <div className="flex flex-col gap-3 px-1">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                        onClick={() => setFilterCategory("all")}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterCategory === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-500 border-gray-100"}`}
                    >
                        전체
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilterCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1 ${filterCategory === cat.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-500 border-gray-100"}`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
                {members.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button onClick={() => setFilterMember("all")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${filterMember === "all" ? "bg-gray-200 text-gray-800" : "bg-transparent text-gray-400"}`}>
                            모든 멤버
                        </button>
                        {members.map(m => (
                            <button key={m} onClick={() => setFilterMember(m)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${filterMember === m ? "bg-gray-200 text-gray-800" : "bg-transparent text-gray-400"}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid Layout (유지) */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <button
                    onClick={() => setIsAdding(true)}
                    className="aspect-square rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-slate-900 hover:text-slate-900 hover:bg-white transition-all group bg-gray-50/50"
                >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-gray-100">
                        <Plus size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold tracking-wide">기록 추가</span>
                </button>

                {filteredLogs.map(log => {
                    const catInfo = CATEGORIES.find(c => c.id === log.category);
                    return (
                        <motion.div
                            layout
                            key={log.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedLogId(log.id)}
                            className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden cursor-pointer group hover:shadow-md transition-all active:scale-95 aspect-square"
                        >
                            <div className="flex-1 rounded-2xl bg-gray-50 overflow-hidden relative mb-2 w-full h-full">
                                {log.images && log.images.length > 0 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={log.images[0]} alt={log.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        {catInfo?.icon || <Camera size={32} />}
                                    </div>
                                )}
                                {log.images.length > 1 && (
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold backdrop-blur-sm">
                                        +{log.images.length - 1}
                                    </div>
                                )}
                            </div>
                            <div className="px-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{catInfo?.label}</span>
                                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-[#FFCE00]">
                                        <Star size={8} fill="currentColor" /> {getAvgRating(log.ratings)}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">{log.title}</h3>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <button
                    onClick={() => fetchLogs(true)}
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl text-xs font-bold text-gray-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    더 보기
                </button>
            )}

            {/* --- Add Modal --- */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetForm} />

                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-900">{editId ? "로그 수정" : "새 로그 작성"}</h3>
                                <button onClick={resetForm}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">카테고리</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${category === cat.id ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-500"}`}>
                                                {cat.icon} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">사진 ({tempImages.length}/3)</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {tempImages.map((img, i) => (
                                            <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-gray-200">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setTempImages(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                                            </div>
                                        ))}
                                        {tempImages.length < 3 && (
                                            <label className="flex-shrink-0 w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-gray-400 cursor-pointer hover:bg-gray-100">
                                                <Camera size={20} />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <input type="text" placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 rounded-xl px-4 py-3 font-bold text-sm outline-none" required />
                                <div className="relative">
                                    <input type="text" placeholder="위치 정보" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-xs font-bold outline-none" />
                                    <button type="button" onClick={fetchCurrentLocation} className="absolute left-3 top-2.5 text-gray-400 hover:text-blue-500 transition-colors">
                                        {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                                    </button>
                                </div>
                                <textarea placeholder="내용을 입력하세요..." value={note} onChange={e => setNote(e.target.value)} rows={3} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
                                <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-70 mt-2">
                                    {isUploading ? "업로드 중..." : "등록하기"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cropper Modal */}
            <AnimatePresence>
                {originalImg && (
                    <ImageCropModal
                        imageSrc={originalImg}
                        aspect={4 / 3} // Photo Ratio
                        onCancel={() => setOriginalImg(null)}
                        onCropComplete={(croppedBase64) => {
                            setTempImages(prev => [...prev, croppedBase64]);
                            setOriginalImg(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* --- Detail Modal (UI 유지) --- */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0"
                            onClick={() => setSelectedLogId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10 max-h-[80vh] flex flex-col"
                        >
                            <button
                                onClick={() => setSelectedLogId(null)}
                                className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="relative w-full h-72 bg-gray-100 flex-shrink-0">
                                <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full scrollbar-hide">
                                    {selectedLog.images?.map((img, i) => (
                                        <div key={i} className="flex-shrink-0 w-full h-full snap-center relative flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button onClick={(e) => { e.stopPropagation(); downloadImage(img, `log_${selectedLog.id}_${i}.jpg`); }} className="absolute bottom-4 right-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-md hover:bg-black/60 transition-colors">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedLog.images || selectedLog.images.length === 0) && (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Camera size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                    {CATEGORIES.find(c => c.id === selectedLog.category)?.icon}
                                    <span>{CATEGORIES.find(c => c.id === selectedLog.category)?.label}</span>
                                </div>
                                {selectedLog.images && selectedLog.images.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {selectedLog.images.map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-tight mb-1">{selectedLog.title}</h2>
                                        <div className="flex flex-col gap-1 text-xs text-gray-500 mt-2">
                                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                                <User size={14} className="text-gray-400" /> {selectedLog.nickname}
                                            </span>
                                            {selectedLog.location && (
                                                <a
                                                    href={selectedLog.coords
                                                        ? `https://www.google.com/maps/search/?api=1&query=${selectedLog.coords.lat},${selectedLog.coords.lng}`
                                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLog.location)}`
                                                    }
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-blue-500 font-medium hover:underline w-fit"
                                                >
                                                    <MapPin size={14} /> {selectedLog.location}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex gap-0.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                                            {[1, 2, 3, 4, 5].map((s) => {
                                                const myRating = selectedLog.ratings?.[user?.uid || ""] || 0;
                                                return (
                                                    <button key={s} onClick={() => handleRate(s)} className="active:scale-90 transition-transform">
                                                        <Star size={16} className={s <= myRating ? "text-[#FFCE00] fill-[#FFCE00]" : "text-gray-200 fill-gray-200"} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold">평균 ★{getAvgRating(selectedLog.ratings)}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-6 border border-gray-100">
                                    {selectedLog.note}
                                </div>
                                {user?.uid === selectedLog.uid && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(selectedLog)}
                                            className="flex-1 py-3.5 bg-blue-50 text-blue-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                                        >
                                            <Compass size={16} /> 수정
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm("이 기록을 삭제하시겠습니까?")) {
                                                    await deleteDoc(doc(db, "travel_logs", selectedLog.id));
                                                    setSelectedLogId(null);
                                                    setLogs(prev => prev.filter(l => l.id !== selectedLog.id));
                                                }
                                            }}
                                            className="flex-1 py-3.5 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} /> 삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}