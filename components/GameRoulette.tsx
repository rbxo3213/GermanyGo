"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, RotateCw, Trophy, Sparkles, RefreshCcw } from "lucide-react";

interface RouletteProps {
    messageId: string;
    participants: string[];
    candidates?: string[];
    result: string | null;
    status: 'waiting' | 'spinning' | 'finished';
    currentUserNickname: string;
    isSender: boolean;
}

export default function GameRoulette({ messageId, candidates = [], result, status, currentUserNickname, isSender }: RouletteProps) {
    const [input, setInput] = useState("");
    const [displayCandidate, setDisplayCandidate] = useState(candidates[0] || "?"); // For spinning effect

    // Spinning Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'spinning' && candidates.length > 0) {
            interval = setInterval(() => {
                const random = candidates[Math.floor(Math.random() * candidates.length)];
                setDisplayCandidate(random);
            }, 80); // Fast change (Slot machine effect)
        }
        return () => clearInterval(interval);
    }, [status, candidates]);

    const addCandidate = async () => {
        if (!input.trim()) return;
        const option = input.trim();
        await updateDoc(doc(db, "messages", messageId), {
            candidates: arrayUnion(option)
        });
        setInput("");
    };

    const handleSpin = async () => {
        if (candidates.length < 2) {
            alert("최소 2개의 선택지가 필요합니다.");
            return;
        }
        await updateDoc(doc(db, "messages", messageId), { status: 'spinning' });

        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selected = candidates[randomIndex];

        // 3초 후 결과 저장 (스피닝 효과 보여줌)
        setTimeout(async () => {
            await updateDoc(doc(db, "messages", messageId), {
                status: 'finished',
                result: selected
            });
        }, 3000);
    };

    const handleReset = async () => {
        await updateDoc(doc(db, "messages", messageId), {
            status: 'waiting',
            result: null,
            candidates: []
        });
    };

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 w-72 overflow-hidden relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                        <RotateCw size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none">Decision Maker</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">운명에 맡겨보세요</p>
                    </div>
                </div>
                {status === 'waiting' && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                        {candidates.length} options
                    </span>
                )}
            </div>

            {/* Content Area */}
            <div className="relative min-h-[140px] bg-slate-50 rounded-2xl mb-4 flex flex-col items-center justify-center overflow-hidden p-4 border border-slate-100 shadow-inner">

                {/* Waiting State */}
                {status === 'waiting' && (
                    <div className="w-full h-full flex flex-col justify-center">
                        {candidates.length === 0 ? (
                            <div className="flex flex-col items-center text-gray-400 gap-2">
                                <Sparkles size={24} className="opacity-40" />
                                <span className="text-xs font-bold opacity-60">선택지를 추가해주세요</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 justify-center content-center max-h-[120px] overflow-y-auto scrollbar-hide">
                                {candidates.map((c, i) => (
                                    <motion.span
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        key={i}
                                        className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
                                    >
                                        {c}
                                    </motion.span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Spinning State (Slot Machine Effect) */}
                {status === 'spinning' && (
                    <div className="flex flex-col items-center justify-center gap-3">
                        <motion.div
                            key={displayCandidate} // Key change triggers animation
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-3xl font-black text-indigo-600 tracking-tight"
                        >
                            {displayCandidate}
                        </motion.div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Picking...</p>

                        {/* Visual Blur Lines */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-50 via-transparent to-slate-50" />
                    </div>
                )}

                {/* Finished State (Result) */}
                <AnimatePresence>
                    {status === 'finished' && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="text-center w-full relative z-10"
                        >
                            {/* Confetti Background (CSS) */}
                            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                <div className="w-full h-full bg-[radial-gradient(circle,#FFD700_2px,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-pulse" />
                            </div>

                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-white ring-4 ring-yellow-50 relative">
                                <Trophy size={32} className="text-yellow-600 drop-shadow-sm" fill="currentColor" />
                                <motion.div
                                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Sparkles size={16} className="text-yellow-400 fill-current" />
                                </motion.div>
                            </div>

                            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-1">Winner</p>
                            <p className="text-2xl font-black text-slate-800 leading-tight break-keep px-2 drop-shadow-sm">
                                {result}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input & Action Area */}
            {status === 'waiting' && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
                            placeholder="선택지 입력..."
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <button
                            onClick={addCandidate}
                            disabled={!input.trim()}
                            className="bg-slate-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed text-white w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
                        >
                            <Plus size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {isSender && (
                        <button
                            onClick={handleSpin}
                            disabled={candidates.length < 2}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                        >
                            <Play size={14} fill="currentColor" />
                            결정하기
                        </button>
                    )}
                </div>
            )}

            {status === 'finished' && isSender && (
                <div className="text-center mt-2">
                    <button
                        onClick={handleReset}
                        className="text-xs font-bold text-gray-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 mx-auto py-2 px-4 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCcw size={12} /> 다시 하기
                    </button>
                </div>
            )}
        </div>
    );
}