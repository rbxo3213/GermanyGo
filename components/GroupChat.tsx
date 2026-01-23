"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, updateDoc, doc, getDocs, where, getDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../hooks/useAuth";
import { Image as ImageIcon, Smile, Plus, X, Send, Loader2, Gamepad2, Trash2, Trophy } from "lucide-react";
import GameRoulette from "./GameRoulette";

interface Message {
    id: string;
    text?: string;
    imageUrl?: string;
    type: 'text' | 'image' | 'game_roulette';
    uid: string;
    nickname: string;
    readBy: string[];
    createdAt: Timestamp | null;
    // Game Specific Fields
    status?: 'waiting' | 'spinning' | 'finished';
    participants?: string[];
    result?: string | null;
}

interface GroupChatProps {
    onClose: () => void;
}

export default function GroupChat({ onClose }: GroupChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [totalMembers, setTotalMembers] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [userNickname, setUserNickname] = useState<string>("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 0. Fetch Current User's Nickname
    useEffect(() => {
        if (!user) return;
        const fetchMyProfile = async () => {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                setUserNickname(snap.data().nickname || "멤버");
            }
        };
        fetchMyProfile();
    }, [user]);

    // 0. Fetch Total Members Count (for Unread Calc)
    useEffect(() => {
        const fetchMemberCount = async () => {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            setTotalMembers(snap.size);
        };
        fetchMemberCount();
    }, []);

    // 1. Subscribe to Messages & Update Read Status
    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];

            snapshot.docs.forEach(d => {
                const data = d.data();
                const m = { id: d.id, ...data } as Message;
                msgs.push(m);

                // Mark as read if I haven't read it yet
                if (user && user.uid && (!m.readBy || !m.readBy.includes(user.uid))) {
                    updateDoc(doc(db, "messages", d.id), {
                        readBy: [...(m.readBy || []), user.uid]
                    }).catch(e => console.error("Read status update error", e));
                }
            });

            setMessages(msgs);
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "auto" });
            }, 100);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Send Text
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !user) return;

        try {
            await addDoc(collection(db, "messages"), {
                text: inputText,
                type: 'text',
                uid: user.uid,
                nickname: userNickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });
            setInputText("");
            setIsMenuOpen(false);
        } catch (err) { console.error(err); }
    };

    // 3. Send Game (Roulette)
    const handleStartGame = async () => {
        if (!user) return;
        try {
            await addDoc(collection(db, "messages"), {
                type: 'game_roulette',
                status: 'waiting',
                participants: [userNickname], // Host auto-joined
                result: null,
                uid: user.uid,
                nickname: userNickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });
            setIsMenuOpen(false);
        } catch (err) { console.error(err); }
    };

    // 4. Delete Message
    const handleDelete = async (msgId: string) => {
        if (!confirm("메시지를 삭제하시겠습니까? (나에게만 삭제되는 것이 아니라 모두에게 삭제됩니다)")) return;
        try {
            await deleteDoc(doc(db, "messages", msgId));
        } catch (e) {
            console.error(e);
            alert("삭제 실패");
        }
    };

    // Helper: Date Logic
    const isNewDay = (current: Message, prev?: Message) => {
        const curDate = current.createdAt ? current.createdAt.toDate().toDateString() : new Date().toDateString();
        if (!prev) return true;
        const prevDate = prev.createdAt ? prev.createdAt.toDate().toDateString() : new Date().toDateString();
        return curDate !== prevDate;
    };

    const formatDate = (ts: Timestamp | null) => {
        const d = ts ? ts.toDate() : new Date();
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    const formatTime = (ts: Timestamp | null) => {
        const d = ts ? ts.toDate() : new Date();
        let h = d.getHours();
        let m = d.getMinutes();
        const ampm = h >= 12 ? '오후' : '오전';
        h = h % 12;
        h = h ? h : 12;
        const mm = m < 10 ? '0' + m : m;
        return `${ampm} ${h}:${mm}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[5000] bg-white flex flex-col pt-safe-top"
        >
            {/* Header */}
            <div className="bg-white px-4 py-4 flex justify-between items-center z-10 border-b border-gray-100 sticky top-0">
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-1 text-slate-900">
                    <span>여행 수다방</span>
                    <span className="text-sm font-bold text-gray-400 align-top">({totalMembers})</span>
                </h2>
                <button onClick={onClose} className="p-2 text-slate-900 hover:bg-gray-50 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                {messages.map((msg, idx) => {
                    const isMe = msg.uid === user?.uid;
                    const prevMsg = messages[idx - 1];
                    const showDate = isNewDay(msg, prevMsg);
                    const unreadCount = totalMembers - (msg.readBy?.length || 0);

                    return (
                        <div key={msg.id} className="flex flex-col">
                            {showDate && (
                                <div className="flex items-center gap-4 my-8 opacity-50">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                                        {formatDate(msg.createdAt)}
                                    </span>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                </div>
                            )}

                            <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} items-end group`}>
                                {!isMe && (
                                    <div className="flex-shrink-0 flex flex-col items-center pb-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-100 text-xs text-gray-600 font-extrabold shadow-sm">
                                            {msg.nickname?.[0] || "?"}
                                        </div>
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%]`}>
                                    {!isMe && <span className="text-[11px] font-bold text-gray-400 ml-1 mb-1">{msg.nickname || "멤버"}</span>}

                                    <div className="flex items-end gap-1.5">
                                        {isMe && (
                                            <div className="flex flex-col items-end text-[10px] text-gray-300 font-medium leading-none mb-1 gap-1">
                                                {/* Delete Button (Only visible on hover/active or simple tap logic) */}
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                                {unreadCount > 0 && <span className="text-[#DD0000] font-bold">{unreadCount}</span>}
                                                <span>{formatTime(msg.createdAt)}</span>
                                            </div>
                                        )}

                                        {/* Message Content */}
                                        {msg.type === 'text' && (
                                            <div className={`px-4 py-3 rounded-2xl text-[15px] font-medium shadow-sm relative break-all whitespace-pre-wrap leading-relaxed
                                                ${isMe
                                                    ? "bg-slate-900 text-white rounded-br-none"
                                                    : "bg-gray-100 text-slate-800 rounded-bl-none border border-gray-100"
                                                }`}>
                                                {msg.text}
                                            </div>
                                        )}
                                        {msg.type === 'game_roulette' && (
                                            <GameRoulette
                                                messageId={msg.id}
                                                participants={msg.participants || []}
                                                result={msg.result || null}
                                                status={msg.status || 'waiting'}
                                                currentUserNickname={userNickname}
                                                isSender={isMe}
                                            />
                                        )}
                                        {msg.type === 'image' && (
                                            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 max-w-[200px]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={msg.imageUrl} alt="전송된 이미지" className="w-full h-auto bg-gray-50" />
                                            </div>
                                        )}

                                        {!isMe && (
                                            <div className="flex flex-col items-start text-[10px] text-gray-300 font-medium leading-none mb-1 gap-0.5">
                                                {unreadCount > 0 && <span className="text-[#DD0000] font-bold">{unreadCount}</span>}
                                                <span>{formatTime(msg.createdAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Menu (Game) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 flex gap-4 overflow-x-auto">
                            <button
                                onClick={handleStartGame}
                                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:bg-yellow-50 active:scale-95 transition-all min-w-[100px]"
                            >
                                <div className="w-12 h-12 bg-[#FFCE00] rounded-full flex items-center justify-center text-slate-900">
                                    <Trophy size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-900">돌림판 게임</span>
                            </button>

                            {/* Placeholder for future games */}
                            <button
                                disabled
                                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm opacity-50 min-w-[100px]"
                            >
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                    <Gamepad2 size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-400">준비중</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="bg-white px-4 py-3 flex items-center gap-3 pb-safe border-t border-gray-100">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-full transition-all ${isMenuOpen ? "bg-slate-900 text-[#FFCE00]" : "text-gray-400 hover:text-slate-900"}`}
                >
                    <Gamepad2 size={24} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-12" : ""}`} />
                </button>

                <form onSubmit={handleSend} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onFocus={() => setIsMenuOpen(false)}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="메시지 보내기..."
                        className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className={`p-3 rounded-full transition-all flex items-center justify-center shadow-sm
                            ${inputText.trim() ? "bg-slate-900 text-white hover:bg-black" : "bg-gray-100 text-gray-300"}`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
