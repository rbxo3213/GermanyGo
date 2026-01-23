"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, query, getDocs } from "firebase/firestore";

interface Member {
    id: string;
    nickname?: string;
    email?: string;
}

export default function MemberInfo({ onClose }: { onClose: () => void }) {
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMembers(list);
        };
        fetchMembers();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>👥</span> 멤버 목록 ({members.length})
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        ✕
                    </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                    {members.map((member, idx) => (
                        <div key={member.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm
                                ${idx % 3 === 0 ? 'bg-black' : idx % 3 === 1 ? 'bg-[#DD0000]' : 'bg-[#FFCE00]'}`}>
                                {member.nickname?.[0] || 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">{member.nickname || "익명"}</div>
                                <div className="text-xs text-gray-400">{member.email}</div>
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && <p className="text-center text-gray-400">멤버를 불러오는 중...</p>}
                </div>
            </motion.div>
        </motion.div>
    );
}
