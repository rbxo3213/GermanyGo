
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Trophy, Users } from "lucide-react";

interface GameProps {
    messageId: string;
    participants: string[]; // List of Nicknames
    result: string | null;
    status: 'waiting' | 'spinning' | 'finished';
    currentUserNickname: string;
    isSender: boolean;
}

export default function GameRoulette({ messageId, participants = [], result, status, currentUserNickname, isSender }: GameProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [displayResult, setDisplayResult] = useState(result || "?");

    // Sync local spinning state with prop status
    useEffect(() => {
        if (status === 'spinning') {
            setIsSpinning(true);
            // Simulate spin visual
            const interval = setInterval(() => {
                const randomName = participants[Math.floor(Math.random() * participants.length)];
                setDisplayResult(randomName || "...");
            }, 100);

            // Stop visual spin when result arrives (or timeout)
            if (result) {
                clearInterval(interval);
                setIsSpinning(false);
                setDisplayResult(result);
            }

            return () => clearInterval(interval);
        } else if (status === 'finished' && result) {
            setIsSpinning(false);
            setDisplayResult(result);
        }
    }, [status, result, participants]);

    const handleJoin = async () => {
        if (participants.includes(currentUserNickname)) return;
        try {
            const msgRef = doc(db, "messages", messageId);
            await updateDoc(msgRef, {
                participants: arrayUnion(currentUserNickname)
            });
        } catch (e) {
            console.error("Join failed", e);
        }
    };

    const handleStart = async () => {
        if (participants.length < 2) {
            alert("최소 2명이 필요합니다!");
            return;
        }
        try {
            const msgRef = doc(db, "messages", messageId);
            // Set status to spinning first
            await updateDoc(msgRef, { status: 'spinning' });

            // Wait a bit then pick winner
            setTimeout(async () => {
                const winner = participants[Math.floor(Math.random() * participants.length)];
                await updateDoc(msgRef, {
                    status: 'finished',
                    result: winner
                });
            }, 3000);
        } catch (e) {
            console.error("Start failed", e);
        }
    };

    return (
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white">
                    <Trophy size={16} className="text-[#FFCE00]" />
                    <span className="font-bold text-sm">운명의 돌림판</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={12} />
                    <span>{participants.length}명 참여</span>
                </div>
            </div>

            {/* Game Content */}
            <div className="p-6 flex flex-col items-center justify-center min-h-[160px] relative">

                {status === 'waiting' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <div className="text-4xl mb-2">🎲</div>
                        <p className="text-sm text-gray-500 font-medium mb-4">
                            누가 걸릴까요?
                        </p>

                        {!participants.includes(currentUserNickname) ? (
                            <button
                                onClick={handleJoin}
                                className="bg-[#FFCE00] hover:bg-[#e6b800] text-black font-bold py-2 px-6 rounded-full text-sm shadow-md active:scale-95 transition-all"
                            >
                                참여하기
                            </button>
                        ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                참여 완료
                            </span>
                        )}

                        <div className="flex flex-wrap justify-center gap-1 mt-4">
                            {participants.map(p => (
                                <span key={p} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {(status === 'spinning' || status === 'finished') && (
                    <div className="flex flex-col items-center">
                        <motion.div
                            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                            transition={isSpinning ? { repeat: Infinity, duration: 0.5, ease: "linear" } : {}}
                            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-4 shadow-inner
                                ${status === 'finished' ? 'border-[#FFCE00] bg-yellow-50' : 'border-slate-200 bg-white'}
                            `}
                        >
                            <span className={`text-2xl font-black ${status === 'finished' ? 'text-slate-900' : 'text-gray-300'}`}>
                                {status === 'finished' ? '👑' : '?'}
                            </span>
                        </motion.div>

                        <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">WINNER</p>
                            <motion.p
                                key={displayResult}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-black text-slate-900"
                            >
                                {displayResult}
                            </motion.p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Control */}
            {status === 'waiting' && isSender && (
                <button
                    onClick={handleStart}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-slate-900 text-sm font-bold border-t border-gray-100 transition-colors"
                >
                    돌려돌려 돌림판 시작!
                </button>
            )}

            {status === 'finished' && (
                <div className="w-full py-2 bg-gray-50 text-center text-xs text-gray-400 font-medium border-t border-gray-100">
                    게임 종료
                </div>
            )}
        </div>
    );
}
