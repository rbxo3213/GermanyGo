"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, limit, startAfter, getDocs } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Star, Plus, Camera, Trash2, X, ChevronRight, User, Zap, Coffee, Edit3, Loader2 } from "lucide-react"; // Generic icons
import ImageCropModal from "./ImageCropModal"; // Image Editor

interface DailyLogItem {
    id: string;
    name: string; // Used as Title
    rating: number; // 1-5
    imageUrl?: string;
    note?: string;
    uid: string;
    nickname: string;
    createdAt: any;
}

export default function DailyLog() { // Renamed from BeerPassport
    const { user, userProfile } = useAuth();
    const [logs, setLogs] = useState<DailyLogItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedLog, setSelectedLog] = useState<DailyLogItem | null>(null);

    // Pagination
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [rating, setRating] = useState(5);
    const [note, setNote] = useState("");

    // Image State
    const [originalImg, setOriginalImg] = useState<string | null>(null);
    const [finalImg, setFinalImg] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // 1. Fetch Logs (Paginated)
    const fetchLogs = async (isLoadMore = false) => {
        if (!hasMore && isLoadMore) return;
        setIsLoading(true);
        try {
            let q = query(collection(db, "beers"), orderBy("createdAt", "desc"), limit(10));

            if (isLoadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyLogItem));

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

    // Reset Form
    const closeForm = () => {
        setIsAdding(false);
        setTimeout(() => {
            setName("");
            setRating(5);
            setNote("");
            setOriginalImg(null);
            setFinalImg(null);
        }, 200);
    };

    // 2. Add Log
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name) return;
        setIsUploading(true);
        try {
            await addDoc(collection(db, "beers"), {
                name, rating, note,
                imageUrl: finalImg || "",
                uid: user.uid,
                nickname: userProfile?.nickname || "익명",
                createdAt: serverTimestamp()
            });
            closeForm();
            // Refresh list
            fetchLogs(false);
        } catch (error) {
            console.error(error);
            alert("저장 실패");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setOriginalImg(reader.result as string);
                e.target.value = "";
            };
        }
    };

    // 3. Level Logic (Generalized)
    const myCount = logs.filter(b => b.uid === user?.uid).length;
    let level = "Starter";
    if (myCount >= 3) level = "Daily Reader";
    if (myCount >= 7) level = "Collector";
    if (myCount >= 15) level = "Archive Master";

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24">

            {/* Stats Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between mx-1 relative overflow-hidden">
                <div className="flex items-center gap-4 z-10">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-[#FFCE00] shadow-lg">
                        <Zap size={28} strokeWidth={2} fill="currentColor" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">My Rank</p>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{level}</h2>
                    </div>
                </div>
                <div className="text-right z-10">
                    <span className="text-4xl font-black text-slate-900">{myCount}</span>
                    <span className="text-xs font-bold text-gray-400 ml-1">LOGS</span>
                </div>
                <div className="absolute right-0 bottom-0 opacity-5">
                    <Coffee size={120} />
                </div>
            </div>

            {/* List Grid */}
            <div className="grid grid-cols-2 gap-3 px-1">
                <button
                    onClick={() => setIsAdding(true)}
                    className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-slate-900 hover:text-slate-900 hover:bg-white transition-all group bg-gray-50/50"
                >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-gray-100">
                        <Plus size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold tracking-wide">기록 추가</span>
                </button>

                {logs.map(log => (
                    <motion.div
                        layout
                        key={log.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedLog(log)}
                        className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden cursor-pointer group hover:shadow-md transition-all active:scale-95 aspect-square"
                    >
                        <div className="flex-1 rounded-2xl bg-gray-50 overflow-hidden relative mb-2 w-full h-full">
                            {log.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={log.imageUrl} alt={log.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <Coffee size={32} strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-start">
                                <span className="bg-black/40 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1">
                                    <User size={8} /> {log.nickname}
                                </span>
                            </div>
                        </div>
                        <div className="px-1">
                            <h3 className="font-bold text-slate-900 text-sm truncate leading-tight mb-1">{log.name}</h3>
                            <div className="flex items-center gap-1.5 w-full overflow-hidden">
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <Star size={10} className="text-[#FFCE00] fill-[#FFCE00]" />
                                    <span className="text-[10px] font-bold text-slate-500">{log.rating}</span>
                                </div>
                                {log.note && (
                                    <>
                                        <div className="w-0.5 h-2 bg-gray-200" />
                                        <span className="text-[10px] text-gray-400 truncate flex-1">{log.note}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
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

            {/* Add Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={closeForm}
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">간단 기록</h3>
                                    <p className="text-gray-400 text-xs font-bold mt-1">빠르고 가볍게 일상을 기록하세요</p>
                                </div>
                                <button onClick={closeForm} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="제목 (커피, 맛집 등)" className="w-full bg-gray-50 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900" required />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button key={s} type="button" onClick={() => setRating(s)} className="active:scale-90 transition-transform">
                                                <Star size={36} className={s <= rating ? "text-[#FFCE00] fill-[#FFCE00]" : "text-gray-200 fill-gray-100"} strokeWidth={1.5} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Photo</label>
                                    <label className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative">
                                        {finalImg ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={finalImg} alt="Preview" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-xs bg-black/50 px-2 py-1 rounded-full flex items-center gap-1"><Edit3 size={12} /> 편집</span>
                                                </div>
                                            </>
                                        ) : (
                                            <><Camera size={24} /><span className="text-xs font-bold">사진 추가</span></>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                    </label>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Note (Optional)</label>
                                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="자유롭게 메모하세요" rows={2} className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 resize-none" />
                                </div>

                                <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isUploading ? "저장 중..." : <>기록하기 <ChevronRight size={18} /></>}
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
                        aspect={1} // Default to square, but user can change it via UI inside Modal
                        onCancel={() => setOriginalImg(null)}
                        onCropComplete={(croppedBase64) => {
                            setFinalImg(croppedBase64);
                            setOriginalImg(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0"
                            onClick={() => setSelectedLog(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative z-20"
                        >
                            <div className="h-64 bg-gray-100 relative">
                                {selectedLog.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={selectedLog.imageUrl} alt={selectedLog.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Coffee size={64} />
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="absolute top-4 right-4 p-2 bg-black/30 text-white rounded-full backdrop-blur-md hover:bg-black/50 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <User size={12} /> {selectedLog.nickname}
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedLog.name}</h3>
                                    <div className="flex gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} className={i < selectedLog.rating ? "text-[#FFCE00] fill-[#FFCE00]" : "text-gray-200 fill-gray-200"} />
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                        {selectedLog.note || "작성된 노트가 없습니다."}
                                    </p>
                                </div>
                                {user?.uid === selectedLog.uid && (
                                    <button
                                        onClick={() => {
                                            if (confirm("정말 삭제하시겠습니까?")) {
                                                deleteDoc(doc(db, "beers", selectedLog.id));
                                                setSelectedLog(null);
                                            }
                                        }}
                                        className="w-full py-3 text-red-500 font-bold text-sm bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> 삭제하기
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}