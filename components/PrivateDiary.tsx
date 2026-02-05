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
    moods?: string[]; // Changed to array for multiple selection
    updatedAt: any;
}

const TRIP_DATES = [
    "2026-02-06", "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10",
    "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15", "2026-02-16"
];

const WEEKDAYS = ["금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월"];

// Cute English Tags with Distinct Colors
const MOOD_TAGS = [
    { id: "Happy", color: "bg-[#FFB347]" },    // Pastel Orange
    { id: "Excited", color: "bg-[#FF6B6B]" },  // Pastel Red/Pink
    { id: "Calm", color: "bg-[#77DD77]" },     // Pastel Green
    { id: "Tired", color: "bg-[#AEC6CF]" },    // Pastel Blue-Grey
    { id: "Sad", color: "bg-[#B39EB5]" },      // Pastel Purple
    { id: "Hungry", color: "bg-[#F49AC2]" },   // Pastel Pink
    { id: "Sick", color: "bg-[#CB99C9]" },     // Violet
];

export default function PrivateDiary() {
    const { user } = useAuth();

    // Default to Today if within range, else first day
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        return TRIP_DATES.includes(today) ? today : TRIP_DATES[0];
    });
    const [text, setText] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [moods, setMoods] = useState<string[]>([]); // Array for multiple selection
    const [originalImg, setOriginalImg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

    // Fetch Entry when Date Changes
    useEffect(() => {
        if (!user) return;
        fetchEntry(selectedDate);
    }, [user, selectedDate]);

    const fetchEntry = async (date: string) => {
        if (!user) return;
        setIsLoading(true);
        setSaveStatus("idle");
        try {
            const q = query(collection(db, "private_diaries"), where("uid", "==", user.uid), where("date", "==", date));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const data = snap.docs[0].data() as DiaryEntry;
                setText(data.text);
                setImageUrl(data.imageUrl || "");
                // Handle legacy string mood vs new array moods
                if (data.moods && Array.isArray(data.moods)) {
                    setMoods(data.moods);
                } else if ((data as any).mood) {
                    setMoods([(data as any).mood]);
                } else {
                    setMoods([]);
                }
            } else {
                setText("");
                setImageUrl("");
                setMoods([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !text.trim()) return;
        setSaveStatus("saving");
        try {
            const docId = `${user.uid}_${selectedDate}`;
            const diaryData = {
                uid: user.uid,
                date: selectedDate,
                text,
                imageUrl,
                moods, // Save array
                updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, "private_diaries", docId), diaryData);
            setSaveStatus("success");

            setTimeout(() => {
                setSaveStatus("idle");
            }, 2000);
        } catch (e) {
            console.error(e);
            alert("저장 실패");
            setSaveStatus("idle");
        }
    };

    const toggleMood = (tagId: string) => {
        setMoods(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(m => m !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
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

    const formattedHeaderDate = `${selectedDate.split("-")[1]}월 ${selectedDate.split("-")[2]}일 ${WEEKDAYS[TRIP_DATES.indexOf(selectedDate)]}요일`;

    return (
        <div className="w-full max-w-md mx-auto pb-32 min-h-[80vh] flex flex-col">

            {/* 1. Top Bar */}
            <div className="px-4 py-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">My Diary</h2>
                <p className="text-sm text-gray-500 font-medium">나만의 여행 기록 공간</p>
            </div>

            {/* 2. Date Selector */}
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
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-1 flex flex-col"
                    >
                        <div className="p-6 pb-2">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="block text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
                                        {getDDayLabel(selectedDate)}
                                    </span>
                                    <h3 className="text-xl font-extrabold text-slate-900">{formattedHeaderDate}</h3>
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
                                    <label className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-100 transition-colors hover:border-gray-200">
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                            <ImageIcon size={20} className="text-gray-300" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">오늘의 사진 남기기</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                    </label>
                                )}
                            </div>

                            {/* Mood Tags (New) */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 mb-3">오늘의 기분 (중복 선택 가능)</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOOD_TAGS.map((tag) => {
                                        const isActive = moods.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleMood(tag.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-95 border
                                                    ${isActive
                                                        ? `${tag.color} text-white border-transparent shadow-sm`
                                                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                                            >
                                                {tag.id}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 my-4" />

                            {/* Text Editor */}
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="오늘의 특별한 순간을 기록해보세요..."
                                className="w-full bg-transparent border-none outline-none resize-none text-[16px] leading-[1.8] text-slate-700 placeholder:text-gray-300 font-sans min-h-[200px]"
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Save Button */}
                <div className="mt-6">
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || !text.trim()}
                        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95
                            ${saveStatus === 'success'
                                ? "bg-green-500 text-white shadow-green-200"
                                : text.trim() ? "bg-slate-900 text-white shadow-xl hover:shadow-2xl" : "bg-gray-100 text-gray-400"
                            }`}
                    >
                        {saveStatus === 'saving' ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                저장 중...
                            </>
                        ) : saveStatus === 'success' ? (
                            <>
                                <Check size={20} strokeWidth={3} />
                                저장 완료!
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                기록 저장하기
                            </>
                        )}
                    </button>
                    {saveStatus === 'success' && (
                        <p className="text-center text-xs text-green-500 font-bold mt-2 animate-fadeIn">성공적으로 저장되었습니다</p>
                    )}
                </div>
            </div>

            {/* Cropper */}
            <AnimatePresence>
                {originalImg && (
                    <ImageCropModal
                        imageSrc={originalImg}
                        aspect={1}
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