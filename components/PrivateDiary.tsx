"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Loader2, Image as ImageIcon, Save, Check } from "lucide-react";
import ImageCropModal from "./ImageCropModal";

interface DiaryEntry {
    id: string;
    date: string;
    text: string;
    imageUrl?: string;
    updatedAt: any;
}

const TRIP_DATES = [
    "2026-02-06", "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10",
    "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15", "2026-02-16"
];

const WEEKDAYS = ["금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월"];

export default function PrivateDiary() {
    const { user } = useAuth();

    // Default to Today if within range, else first day
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        return TRIP_DATES.includes(today) ? today : TRIP_DATES[0];
    });
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [originalImg, setOriginalImg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Fetch Entry when Date Changes
    useEffect(() => {
        if (!user) return;
        fetchEntry(selectedDate);
    }, [user, selectedDate]);

    const fetchEntry = async (date: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, "private_diaries"), where("uid", "==", user.uid), where("date", "==", date));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const data = snap.docs[0].data() as DiaryEntry;
                setText(data.text);
                setImageUrl(data.imageUrl || "");
            } else {
                setText("");
                setImageUrl("");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !text.trim()) return;
        setIsSaving(true);
        try {
            const docId = `${user.uid}_${selectedDate}`;
            const diaryData = {
                uid: user.uid,
                date: selectedDate,
                text,
                imageUrl,
                updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, "private_diaries", docId), diaryData);
            setLastSaved(new Date());
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setOriginalImg(reader.result as string);
                e.target.value = "";
            };
        }
    };

    const getDDayLabel = (date: string) => {
        const idx = TRIP_DATES.indexOf(date);
        return `Day ${idx + 1}`;
    };

    // Format Date for Header (e.g. 2월 6일 금요일)
    const formattedHeaderDate = `${selectedDate.split("-")[1]}월 ${selectedDate.split("-")[2]}일 ${WEEKDAYS[TRIP_DATES.indexOf(selectedDate)]}요일`;

    return (
        <div className="w-full max-w-md mx-auto pb-24 min-h-[80vh] flex flex-col">

            {/* 1. Top Bar */}
            <div className="px-4 py-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">My Diary</h2>
                <p className="text-sm text-gray-500 font-medium">나만의 여행 기록</p>
            </div>

            {/* 2. Date Selector (Pill Style) */}
            <div className="pl-4 mb-6 overflow-x-auto scrollbar-hide flex gap-2 snap-x pb-2">
                {TRIP_DATES.map((date, idx) => {
                    const isSelected = date === selectedDate;
                    const day = date.split("-")[2];
                    return (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center min-w-[56px] h-[72px] rounded-2xl snap-start transition-all duration-300 border ${isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-1"
                                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                                }`}
                        >
                            <span className={`text-[10px] font-bold mb-0.5 ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                                {WEEKDAYS[idx]}
                            </span>
                            <span className="text-xl font-bold font-sans">{day}</span>
                        </button>
                    )
                })}
            </div>

            {/* 3. Editor Area */}
            <div className="flex-1 px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedDate}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 min-h-[500px] relative flex flex-col"
                    >
                        {/* Editor Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <span className="block text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
                                    {getDDayLabel(selectedDate)}
                                </span>
                                <h3 className="text-xl font-extrabold text-slate-900">{formattedHeaderDate}</h3>
                            </div>
                            {/* Auto-save Indicator */}
                            <div className="text-xs text-gray-300 font-medium">
                                {isSaving ? "저장 중..." : lastSaved ? "저장됨" : ""}
                            </div>
                        </div>

                        {/* Image Uploader */}
                        <div className="mb-6">
                            {imageUrl ? (
                                <div className="relative rounded-2xl overflow-hidden shadow-sm group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imageUrl} alt="Diary" className="w-full h-auto object-cover max-h-[300px]" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <button
                                            onClick={() => setImageUrl("")}
                                            className="bg-white/90 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <ImageIcon size={20} className="text-gray-300" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">사진 추가하기</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                </label>
                            )}
                        </div>

                        {/* Text Editor (Clean) */}
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="오늘 하루는 어땠나요?"
                            className="w-full flex-1 bg-transparent border-none outline-none resize-none text-[16px] leading-[1.8] text-slate-700 placeholder:text-gray-300 font-sans"
                            style={{ minHeight: "200px" }}
                        />

                        {/* Floating Save Button (Bottom Right of Card) */}
                        <div className="absolute bottom-6 right-6">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                disabled={isSaving || !text.trim()}
                                className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-bold text-sm transition-all
                                    ${text.trim()
                                        ? "bg-slate-900 text-white hover:bg-black hover:shadow-xl"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
                                <span>저장</span>
                            </motion.button>
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Cropper */}
            <AnimatePresence>
                {originalImg && (
                    <ImageCropModal
                        imageSrc={originalImg}
                        aspect={1} // Square crop or Free? Let's use 1 for neatness or adjust as needed
                        onCancel={() => setOriginalImg(null)}
                        onCropComplete={(cropped) => {
                            setImageUrl(cropped);
                            setOriginalImg(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}