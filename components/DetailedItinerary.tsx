"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Train, Bus, MapPin, Plus, Trash2, Utensils, Coffee, Camera, X, CalendarDays, Pencil } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import TimeWheelPicker from "./TimeWheelPicker";

// Fixed Transport Schedule (유지)
const FIXED_SCHEDULE = [
    { type: "transport", day: 1, date: "2026-02-06", time: "09:35", title: "출국 비행기", desc: "인천 → 독일 출발", icon: <Plane size={16} /> },
    { type: "transport", day: 1, date: "2026-02-06", time: "18:17", title: "ICE 927", desc: "FRA 공항역 → 뉘른베르크 (~20:45)", icon: <Train size={16} /> },
    { type: "transport", day: 3, date: "2026-02-08", time: "09:10", title: "FlixBus N109", desc: "뉘른베르크 → 프라하 (~12:45)", icon: <Bus size={16} /> },
    { type: "transport", day: 5, date: "2026-02-10", time: "08:30", title: "RegioJet", desc: "프라하 → 베를린 (~13:00)", icon: <Bus size={16} /> },
    { type: "transport", day: 7, date: "2026-02-12", time: "08:15", title: "FlixBus 050", desc: "베를린 → 함부르크 (~11:30)", icon: <Bus size={16} /> },
    { type: "transport", day: 9, date: "2026-02-14", time: "08:50", title: "FlixTrain FLX20", desc: "함부르크 → 뒤셀도르프 (~12:30)", icon: <Train size={16} /> },
    { type: "transport", day: 11, date: "2026-02-16", time: "07:26", title: "ICE 513", desc: "뒤셀도르프 → 쾰른 (~07:48)", icon: <Train size={16} /> },
    { type: "transport", day: 11, date: "2026-02-16", time: "13:28", title: "ICE (공항행)", desc: "쾰른 → 프랑크푸르트 공항", icon: <Train size={16} /> },
    { type: "transport", day: 11, date: "2026-02-16", time: "18:00", title: "귀국 비행기", desc: "독일 → 인천", icon: <Plane size={16} /> },
];

const TRIP_DAYS = [
    { day: 1, date: "2026-02-06", label: "금" },
    { day: 2, date: "2026-02-07", label: "토" },
    { day: 3, date: "2026-02-08", label: "일" },
    { day: 4, date: "2026-02-09", label: "월" },
    { day: 5, date: "2026-02-10", label: "화" },
    { day: 6, date: "2026-02-11", label: "수" },
    { day: 7, date: "2026-02-12", label: "목" },
    { day: 8, date: "2026-02-13", label: "금" },
    { day: 9, date: "2026-02-14", label: "토" },
    { day: 10, date: "2026-02-15", label: "일" },
    { day: 11, date: "2026-02-16", label: "월" },
    { day: 12, date: "2026-02-17", label: "화" },
];

interface ItineraryItem {
    id: string;
    date: string;
    time: string;
    title: string;
    desc?: string;
    category: "food" | "place" | "etc";
    uid: string;
}

export default function DetailedItinerary() {
    const { user } = useAuth();
    const [customItems, setCustomItems] = useState<ItineraryItem[]>([]);
    const [activeDayIndex, setActiveDayIndex] = useState(0);
    const activeDay = TRIP_DAYS[activeDayIndex];
    const tabsRef = useRef<HTMLDivElement>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ time: "12:00", title: "", desc: "", category: "place" });

    useEffect(() => {
        const q = query(collection(db, "itinerary_items"), orderBy("time"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ItineraryItem[];
            setCustomItems(items);
        });
        return () => unsubscribe();
    }, []);

    const handleAddItem = async () => {
        if (!user || !newItem.title) return;
        try {
            if (editingId) {
                // Update existing
                await updateDoc(doc(db, "itinerary_items", editingId), {
                    ...newItem,
                    date: activeDay.date,
                });
            } else {
                // Add new
                await addDoc(collection(db, "itinerary_items"), {
                    ...newItem,
                    date: activeDay.date,
                    uid: user.uid,
                    createdAt: serverTimestamp()
                });
            }
            setIsAddModalOpen(false);
            setEditingId(null);
            setNewItem({ time: "12:00", title: "", desc: "", category: "place" });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("일정을 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "itinerary_items", id));
        } catch (e) { console.error(e); }
    };

    const handleEdit = (item: ItineraryItem) => {
        setNewItem({
            time: item.time,
            title: item.title,
            desc: item.desc || "",
            category: item.category
        });
        setEditingId(item.id);
        setIsAddModalOpen(true);
    };

    const currentDayItems = [
        ...FIXED_SCHEDULE.filter(i => i.date === activeDay.date).map(i => ({ ...i, isFixed: true })),
        ...customItems.filter(i => i.date === activeDay.date).map(i => ({ ...i, isFixed: false }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "food": return <Utensils size={14} />;
            case "place": return <Camera size={14} />;
            default: return <MapPin size={14} />;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-6 px-4 pb-32">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                Detailed Itinerary <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-slate-500">Day {activeDay.day}</span>
            </h2>

            <div ref={tabsRef} className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide snap-x">
                {TRIP_DAYS.map((day, idx) => (
                    <button
                        key={day.date}
                        onClick={() => setActiveDayIndex(idx)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-[4.5rem] h-[5.5rem] rounded-2xl border transition-all snap-start
                            ${idx === activeDayIndex ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"}`}
                    >
                        <span className="text-[10px] font-bold opacity-60 mb-0.5">Day {day.day}</span>
                        <span className="text-xl font-black mb-0.5">{day.date.split('-')[2]}</span>
                        <span className="text-xs font-bold">{day.label}</span>
                    </button>
                ))}
            </div>

            <div className="relative border-l-2 border-slate-200 ml-5 space-y-8 min-h-[400px]">


                <div className="pt-2 pl-8">
                    <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
                        <CalendarDays size={16} /> {activeDay.date} 일정
                    </p>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {currentDayItems.length > 0 ? (
                                currentDayItems.map((item: any, idx) => (
                                    <motion.div
                                        layout
                                        key={item.id || idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`relative p-5 rounded-2xl border transition-shadow ${item.isFixed ? "bg-gray-50 border-gray-100" : "bg-white border-blue-100 shadow-[0_4px_20px_-10px_rgba(37,99,235,0.15)]"}`}
                                    >
                                        <div className={`absolute top-6 -left-[41px] w-4 h-4 rounded-full border-4 border-slate-50 ${item.isFixed ? "bg-gray-400" : "bg-blue-500"}`} />
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl flex-shrink-0 ${item.isFixed ? "bg-gray-200 text-gray-600" : "bg-blue-50 text-blue-600"}`}>
                                                {item.isFixed ? item.icon : getCategoryIcon(item.category)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-extrabold font-mono text-slate-800 tracking-tight bg-slate-100 px-2 py-0.5 rounded-md mb-1 inline-block">{item.time}</span>
                                                    {!item.isFixed && item.uid === user?.uid && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleEdit(item)} className="text-gray-300 hover:text-blue-500 transition-colors">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className={`text-base font-bold leading-tight ${item.isFixed ? "text-slate-700" : "text-slate-900"}`}>{item.title}</h4>
                                                {item.desc && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.desc}</p>}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm">등록된 일정이 없습니다</p>
                                    <button onClick={() => setIsAddModalOpen(true)} className="mt-2 text-blue-600 font-bold text-xs hover:underline">+ 첫 일정 추가하기</button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewItem({ time: "12:00", title: "", desc: "", category: "place" });
                            setIsAddModalOpen(true);
                        }}
                        className="w-full mt-8 py-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <Plus size={18} /> 일정 추가하기
                    </button>
                </div>
            </div>

            {/* --- 수정된 부분: 하단 시트(모바일) & 모달(데스크탑) --- */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 40, stiffness: 400 }}
                            // 모바일: 하단 직각 (rounded-b-none), 데스크탑: 전체 둥글게 (sm:rounded-3xl)
                            className="bg-white w-full max-w-sm rounded-t-[2rem] rounded-b-none sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[85dvh]"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <div>
                                    <span className="block text-xs font-bold text-blue-600 mb-1">Day {activeDay.day} ({activeDay.date})</span>
                                    <h3 className="text-xl font-black text-slate-900">{editingId ? "일정 수정하기" : "새 일정 추가"}</h3>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-6">
                                    {/* Category */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {(["food", "place", "etc"] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewItem({ ...newItem, category: cat })}
                                                className={`py-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border ${newItem.category === cat ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"}`}
                                            >
                                                {cat === 'food' ? <Utensils size={20} /> : cat === 'place' ? <Camera size={20} /> : <MapPin size={20} />}
                                                <span className="text-xs font-bold">{cat === 'food' ? '식사' : cat === 'place' ? '명소' : '기타'}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Inputs */}
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Time</label>
                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                <TimeWheelPicker value={newItem.time} onChange={(time) => setNewItem({ ...newItem, time })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Title</label>
                                            <input type="text" placeholder="장소명 / 일정 이름" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full bg-white rounded-xl p-3 outline-none border border-gray-200 font-bold" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Note</label>
                                            <textarea placeholder="메모를 남겨주세요" value={newItem.desc} onChange={e => setNewItem({ ...newItem, desc: e.target.value })} className="w-full bg-white rounded-xl p-3 h-20 resize-none text-sm outline-none border border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Save Button (Safe Area Applied) */}
                            {/* 모바일: 하단 직각 유지 & Safe Area Padding 적용 (더 넉넉하게 수정) */}
                            <div className="p-6 pt-4 border-t border-gray-50 bg-white rounded-b-none sm:rounded-b-[2rem] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItem.title}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-colors disabled:opacity-50 text-lg shadow-lg shadow-slate-200"
                                >
                                    {editingId ? "수정 완료" : "등록하기"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}