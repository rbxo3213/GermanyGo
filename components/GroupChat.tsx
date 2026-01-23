"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

interface Message {
    id: string;
    text: string;
    uid: string;
    nickname: string;
    createdAt: Timestamp | null;
}

interface GroupChatProps {
    onClose: () => void;
}

export default function GroupChat({ onClose }: GroupChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Subscribe to Messages
    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);

            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, []);

    // 2. Send Message
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user) return;

        try {
            await addDoc(collection(db, "messages"), {
                text: inputText,
                uid: user.uid,
                nickname: user.displayName || "익명",
                createdAt: serverTimestamp()
            });
            setInputText("");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[5000] bg-slate-50 flex flex-col pt-safe-top"
        >
            <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm flex justify-between items-center z-10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <span>여행 수다방</span>
                    <span className="text-xs bg-slate-100 text-gray-500 px-2 py-0.5 rounded-full">{messages.length}</span>
                </h2>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    👇 닫기
                </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f2f4f6]">
                {messages.map((msg) => {
                    const isMe = msg.uid === user?.uid;
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Avatar */}
                            {!isMe && (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                                        {msg.nickname ? msg.nickname[0] : '?'}
                                    </div>
                                </div>
                            )}

                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                {!isMe && <span className="text-[10px] text-gray-400 ml-1 mb-1">{msg.nickname}</span>}
                                <div className={`px-4 py-2.5 rounded-2xl break-words text-sm shadow-sm relative
                                    ${isMe
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 pb-safe">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="메시지 입력..."
                        className="flex-1 bg-gray-100 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="bg-slate-900 text-white w-12 h-12 rounded-full shadow-lg disabled:opacity-50 hover:bg-black transition-colors flex items-center justify-center"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
