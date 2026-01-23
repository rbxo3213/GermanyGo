"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase"; // Ensure auth is imported to associate memos with users if needed
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    where
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type MemoTab = "todo" | "wish" | "goals";

interface MemoItem {
    id: string;
    text: string;
    completed: boolean;
    category: MemoTab;
    userId?: string;
}

export default function MemoPad() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<MemoTab>("todo");
    const [memos, setMemos] = useState<MemoItem[]>([]);
    const [inputText, setInputText] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Real-time Firestore Subscription with LocalStorage Backup
    useEffect(() => {
        if (!user) return;

        // 1. Load from LocalStorage first for instant offline view
        const cached = localStorage.getItem("memo_cache");
        if (cached) {
            setMemos(JSON.parse(cached));
        }

        const q = query(
            collection(db, "memos"),
            // orderBy("createdAt", "desc") 
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MemoItem[];

            // 2. Update state and cache to LocalStorage
            setMemos(ms);
            localStorage.setItem("memo_cache", JSON.stringify(ms));
        }, (error) => {
            console.error("Firestore Listen Error:", error);
            // If offline, we stay with cached data
        });

        return () => unsubscribe();
    }, [user]);

    const filteredMemos = memos.filter((m) => m.category === activeTab);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user) return;

        setIsAdding(true);
        try {
            await addDoc(collection(db, "memos"), {
                text: inputText,
                completed: false,
                category: activeTab,
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0],
                createdAt: serverTimestamp()
            });
            setInputText("");
        } catch (error) {
            console.error("Error adding memo:", error);
            alert("저장 권한이 없습니다. Firebase Console Rules를 확인하세요.");
        } finally {
            setIsAdding(false);
        }
    };

    const toggleComplete = async (id: string, currentStatus: boolean) => {
        try {
            const ref = doc(db, "memos", id);
            await updateDoc(ref, { completed: !currentStatus });
        } catch (error) {
            console.error("Error updating memo:", error);
        }
    };

    const deleteMemo = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "memos", id));
        } catch (error) {
            console.error("Error deleting memo:", error);
        }
    };

    const tabs: { id: MemoTab; label: string; color: string }[] = [
        { id: "todo", label: "✅ 할 일", color: "bg-yellow-100" },
        { id: "wish", label: "🎁 위시리스트", color: "bg-pink-100" },
        { id: "goals", label: "🏆 여행 목표", color: "bg-blue-100" },
    ];

    return (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-slate-900 overflow-hidden relative min-h-[500px]">
            {/* Binder Rings */}
            <div className="absolute top-0 left-8 flex space-x-6 -mt-3 z-10">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-4 h-12 bg-slate-300 rounded-full border-2 border-slate-400 shadow-inner"></div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 mt-6 ml-2 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === tab.id
                                ? `${tab.color} text-slate-800 scale-105 shadow-md border-2 border-slate-900`
                                : "bg-gray-50 text-gray-400 border-2 border-transparent hover:bg-gray-100"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Add Input */}
            <form onSubmit={handleAdd} className="mb-6 relative">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isAdding}
                    placeholder={activeTab === 'todo' ? "할 일을 추가하세요..." : activeTab === 'wish' ? "사고 싶은 것은?" : "이번 여행의 목표는?"}
                    className="w-full bg-slate-50 rounded-2xl py-4 pl-5 pr-12 font-medium border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all outline-none"
                />
                <button
                    type="submit"
                    disabled={isAdding}
                    className="absolute right-2 top-2 bottom-2 bg-black text-white rounded-xl px-4 font-bold text-xl hover:scale-95 transition-transform disabled:opacity-50"
                >
                    +
                </button>
            </form>

            {/* Content Area */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {filteredMemos.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center text-gray-300 font-bold mt-10"
                        >
                            아직 기록된 내용이 없습니다.<br />첫 메모를 남겨보세요!
                        </motion.div>
                    )}
                    {filteredMemos.map((memo) => (
                        <motion.div
                            key={memo.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-4 rounded-2xl flex items-center justify-between group cursor-pointer border-2 transition-colors
                    ${memo.completed ? 'bg-gray-100 border-gray-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div onClick={() => toggleComplete(memo.id, memo.completed)} className="flex items-center gap-3 flex-1">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                        ${memo.completed ? 'bg-black border-black' : 'border-gray-300'}`}>
                                    {memo.completed && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className={`font-medium text-lg transition-all ${memo.completed ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                                    {memo.text}
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteMemo(memo.id); }}
                                className="opacity-40 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-3 -mr-2"
                            >
                                ✕
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Decorative Tape */}
            <div className="absolute -top-3 right-10 w-24 h-8 bg-yellow-200/50 rotate-3 z-0"></div>
        </div>
    );
}
