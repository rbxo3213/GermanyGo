"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, setDoc, serverTimestamp, collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

// Flag Colors (Shared Constant)
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

export default function NicknameSetup() {
    const { user, userProfile } = useAuth();
    const [nickname, setNickname] = useState("");
    const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
    const [takenFlags, setTakenFlags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"nickname" | "flag">("nickname");

    // Pre-fill nickname if editing or partial profile exists
    useEffect(() => {
        if (userProfile?.nickname) {
            setNickname(userProfile.nickname);
        }
    }, [userProfile]);

    // Fetch Taken Flags
    useEffect(() => {
        const fetchTakenFlags = async () => {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            const taken: string[] = [];
            snap.forEach(d => {
                const data = d.data();
                if (data.flag && data.uid !== user?.uid) { // Exclude my own flag if re-selecting
                    taken.push(data.flag);
                }
            });
            setTakenFlags(taken);
        };
        fetchTakenFlags();
    }, [user]);

    const handleNext = () => {
        if (step === "nickname" && nickname.trim()) {
            setStep("flag");
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user || !nickname.trim() || !selectedFlag) return;
        if (takenFlags.includes(selectedFlag)) {
            alert("이미 다른 멤버가 선택한 색상입니다. 다른 색을 골라주세요.");
            return;
        }

        setLoading(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email || "",
                nickname: nickname.trim(),
                flag: selectedFlag,
                role: 'member',
                createdAt: userProfile?.createdAt || serverTimestamp(), // Keep original timestamp if exists
                updatedAt: serverTimestamp()
            }, { merge: true }); // Merge to preserve other fields if any

            window.location.reload();
        } catch (e) {
            console.error("Profile save failed", e);
            alert("저장 중 오류가 발생했습니다.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "nickname" ? "bg-slate-900" : "bg-gray-200"}`} />
                    <div className={`h-1.5 w-8 rounded-full transition-colors ${step === "flag" ? "bg-slate-900" : "bg-gray-200"}`} />
                </div>

                <AnimatePresence mode="wait">
                    {step === "nickname" ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6 text-center"
                        >
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">반가워요!</h1>
                                <p className="text-gray-500 text-sm">멤버들에게 보여질<br />멋진 이름을 정해주세요.</p>
                            </div>

                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                                placeholder="닉네임 입력"
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-xl font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-slate-900 transition-all outline-none text-center"
                                autoFocus
                            />

                            <button
                                onClick={handleNext}
                                disabled={!nickname.trim()}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                다음으로
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white"
                        >
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">나만의 깃발</h1>
                                <p className="text-gray-500 text-xs">지도에 표시될 색상을 선택해주세요.<br />(다른 멤버와 중복될 수 없습니다)</p>
                            </div>

                            <div className="grid grid-cols-5 gap-3 mb-8 p-1">
                                {FLAG_COLORS.map((f) => {
                                    const isTaken = takenFlags.includes(f.color);
                                    const isSelected = selectedFlag === f.color;
                                    return (
                                        <button
                                            key={f.id}
                                            disabled={isTaken}
                                            onClick={() => setSelectedFlag(f.color)}
                                            className={`aspect-square rounded-xl flex items-center justify-center transition-all relative group
                                                ${isTaken ? "opacity-20 cursor-not-allowed grayscale" :
                                                    isSelected ? "bg-slate-50 ring-2 ring-slate-900 scale-110 shadow-lg z-10" : "hover:scale-105 hover:bg-gray-50"}`}
                                        >
                                            <div
                                                dangerouslySetInnerHTML={{ __html: getFlagSvg(f.color) }}
                                                className={`transition-transform duration-300 ${isSelected ? "scale-[0.8]" : "scale-[0.65]"}`}
                                            />
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 bg-slate-900 text-white p-0.5 rounded-full ring-2 ring-white">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep("nickname")}
                                    className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl text-base hover:bg-gray-200 transition-all"
                                >
                                    이전
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedFlag || loading}
                                    className="flex-[2] bg-slate-900 text-white font-bold py-4 rounded-2xl text-base hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    {loading ? "환영합니다!" : "시작하기"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
