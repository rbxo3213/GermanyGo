"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

export default function NicknameSetup() {
    const { user } = useAuth();
    const [nickname, setNickname] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !nickname.trim()) return;

        setLoading(true);
        try {
            // Save Profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email || "",
                nickname: nickname.trim(),
                createdAt: serverTimestamp(),
                role: 'member',
                flag: null // Will act as trigger for Flag Selection later
            });
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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">반가워요! 👋</h1>
                        <p className="text-gray-500">여행 멤버들에게 보여질<br />닉네임을 정해주세요.</p>
                    </motion.div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임 입력"
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none text-center"
                            autoFocus
                        />
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        type="submit"
                        disabled={!nickname.trim() || loading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black transition-all disabled:opacity-50"
                    >
                        {loading ? "저장 중..." : "독일 여행 시작하기"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
