"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, updateDoc, doc, getDocs, getDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { X, ArrowRight, Plus, Trophy, Trash2, Image as ImageIcon } from "lucide-react";
import GameRoulette from "./GameRoulette";
import ImageCropModal from "./ImageCropModal"; // New

interface Message {
    id: string;
    text?: string;
    imageUrl?: string;
    type: 'text' | 'image' | 'game_roulette';
    uid: string;
    nickname: string;
    readBy: string[];
    createdAt: Timestamp | null;
    status?: 'waiting' | 'spinning' | 'finished';
    participants?: string[];
    candidates?: string[]; // New
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

    // Image Upload State
    const [selectedImg, setSelectedImg] = useState<string | null>(null); // To show in crop modal
    const [isUploading, setIsUploading] = useState(false);

    // For Composition (IME) handling
    const [isComposing, setIsComposing] = useState(false);

    const [userNickname, setUserNickname] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null); // For raw scroll manipulation
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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

    // 0. Fetch Total Members Count
    useEffect(() => {
        const fetchMemberCount = async () => {
            const q = query(collection(db, "users"));
            const snap = await getDocs(q);
            setTotalMembers(snap.size);
        };
        fetchMemberCount();
    }, []);

    // 1. Subscribe to Messages
    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.docs.forEach(d => {
                const data = d.data();
                const m = { id: d.id, ...data } as Message;
                msgs.push(m);
                // Mark as read
                if (user && user.uid && (!m.readBy || !m.readBy.includes(user.uid))) {
                    updateDoc(doc(db, "messages", d.id), {
                        readBy: [...(m.readBy || []), user.uid]
                    }).catch(e => console.error("Read update error", e));
                }
            });
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [user]);

    // 2. Scroll Logic (Instant Bottom)
    useLayoutEffect(() => {
        if (messages.length > 0) {
            if (isInitialLoad) {
                // First load: Instant jump
                scrollRef.current?.scrollIntoView({ behavior: "auto" });
                setIsInitialLoad(false);
            } else {
                // Subsequent: Smooth scroll
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
        }
    }, [messages, isInitialLoad]);

    // 3. Send Text
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !user || isComposing) return;

        const textToSend = inputText;
        setInputText("");

        try {
            await addDoc(collection(db, "messages"), {
                text: textToSend,
                type: 'text',
                uid: user.uid,
                nickname: userNickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });
            setIsMenuOpen(false);
        } catch (err) {
            console.error(err);
            setInputText(textToSend);
        }
    };

    // 4. Send Game
    const handleStartGame = async () => {
        if (!user) return;
        try {
            await addDoc(collection(db, "messages"), {
                type: 'game_roulette',
                status: 'waiting',
                participants: [userNickname],
                candidates: [], // New Field
                result: null,
                uid: user.uid,
                nickname: userNickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });
            setIsMenuOpen(false);
        } catch (err) { console.error(err); }
    };

    // 5. Image Select & Upload
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setSelectedImg(reader.result as string);
                // Don't close menu yet, wait for crop
            };
        }
    };

    const handleImageUpload = async (croppedBase64: string) => {
        if (!user) return;
        setIsUploading(true);
        try {
            await addDoc(collection(db, "messages"), {
                imageUrl: croppedBase64,
                type: 'image',
                uid: user.uid,
                nickname: userNickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });
            setSelectedImg(null); // Close modal
            setIsMenuOpen(false);
        } catch (e) {
            console.error(e);
            alert("사진 전송 실패");
        } finally {
            setIsUploading(false);
        }
    };

    // 6. Delete Message
    const handleDelete = async (msgId: string) => {
        if (!confirm("메시지를 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "messages", msgId));
        } catch (e) { console.error(e); }
    };

    // Helpers
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
        h = h % 12; h = h ? h : 12;
        const mm = m < 10 ? '0' + m : m;
        return `${ampm} ${h}:${mm}`;
    };

    return (
        <motion.div
            initial={{ opacity: 1, y: 0 }} // Changed to no slide-in for instant feel, or simple fade
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[5000] bg-[#F2F4F6] flex flex-col pt-safe-top"
        >
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-5 py-4 flex justify-between items-center z-20 border-b border-gray-200/50 sticky top-0 shadow-sm">
                <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                        Chat Room
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{totalMembers}</span>
                    </h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 hover:bg-gray-100/50 rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>

            {/* Message List */}
            <div ref={listRef} className={`flex-1 overflow-y-auto p-4 space-y-2 bg-[#F2F4F6] ${isInitialLoad ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}>
                {messages.map((msg, idx) => {
                    const isMe = msg.uid === user?.uid;
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];
                    const showDate = isNewDay(msg, prevMsg);

                    // Grouping logic
                    const isSequence = prevMsg && prevMsg.uid === msg.uid && !showDate;
                    const isLastInSequence = !nextMsg || nextMsg.uid !== msg.uid || isNewDay(nextMsg, msg);
                    const unreadCount = totalMembers - (msg.readBy?.length || 0);

                    return (
                        <div key={msg.id} className="flex flex-col">
                            {showDate && (
                                <div className="flex justify-center my-6">
                                    <span className="bg-gray-200/60 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                        {formatDate(msg.createdAt)}
                                    </span>
                                </div>
                            )}

                            <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isSequence ? "mt-1" : "mt-3"} group`}>
                                {!isMe && (
                                    <div className="flex-shrink-0 w-8 flex flex-col items-center">
                                        {!isSequence ? (
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-gray-100 text-xs font-black text-slate-700 shadow-sm">
                                                {msg.nickname?.[0] || "?"}
                                            </div>
                                        ) : <div className="w-8" />}
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                    {!isMe && !isSequence && (
                                        <span className="text-[11px] text-gray-500 ml-1 mb-1 font-medium">{msg.nickname}</span>
                                    )}

                                    <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* Message Bubble */}
                                        {msg.type === 'text' && (
                                            <div className={`px-3.5 py-2.5 text-[15px] shadow-sm leading-relaxed break-all whitespace-pre-wrap relative
                                                ${isMe
                                                    ? "bg-slate-900 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-gray-100"
                                                }
                                            `}>
                                                {msg.text}
                                            </div>
                                        )}

                                        {msg.type === 'game_roulette' && (
                                            <GameRoulette
                                                messageId={msg.id}
                                                participants={msg.participants || []}
                                                candidates={msg.candidates || []}
                                                result={msg.result || null}
                                                status={msg.status || 'waiting'}
                                                currentUserNickname={userNickname}
                                                isSender={isMe}
                                            />
                                        )}

                                        {msg.type === 'image' && msg.imageUrl && (
                                            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white max-w-[200px]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={msg.imageUrl} alt="img" className="w-full h-auto object-cover" />
                                            </div>
                                        )}

                                        {/* Meta */}
                                        <div className={`flex flex-col text-[10px] text-gray-400 font-medium leading-none mb-0.5 gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                                            {isMe && (
                                                <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 -mr-1 hover:text-red-500 transition-opacity">
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                            {unreadCount > 0 && <span className="text-[#DD0000] font-bold">{unreadCount}</span>}
                                            {isLastInSequence && <span>{formatTime(msg.createdAt)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Menu (Game + Image) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-t border-gray-100 overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative z-20"
                    >
                        <div className="p-4 flex gap-4 overflow-x-auto">
                            {/* Game Button */}
                            <button
                                onClick={handleStartGame}
                                className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-[#FFF9C4] hover:border-[#FFCE00] active:scale-95 transition-all min-w-[90px]"
                            >
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm border border-gray-100">
                                    <Trophy size={20} className="text-[#FFCE00]" fill="currentColor" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">돌림판</span>
                            </button>

                            {/* Image Button (New) */}
                            <label className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition-all min-w-[90px] cursor-pointer">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm border border-gray-100">
                                    <ImageIcon size={20} className="text-blue-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">사진</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </label>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="bg-white px-3 py-3 pb-safe border-t border-gray-200 flex items-center gap-2 z-20">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2.5 rounded-full transition-all ${isMenuOpen ? "bg-slate-100 text-slate-900 rotate-90" : "text-gray-400 hover:bg-gray-50 hover:text-slate-900"}`}
                >
                    <Plus size={24} />
                </button>

                <form onSubmit={handleSend} className="flex-1 flex gap-2 bg-gray-100 rounded-[24px] px-2 py-1.5 items-center focus-within:ring-2 focus-within:ring-slate-900/10 transition-all border border-transparent focus-within:bg-white focus-within:border-gray-200">
                    <input
                        type="text"
                        value={inputText}
                        onFocus={() => setIsMenuOpen(false)}
                        onChange={(e) => setInputText(e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="메시지 입력..."
                        className="flex-1 bg-transparent border-none px-3 text-[15px] focus:outline-none placeholder:text-gray-400 text-slate-900 min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className={`p-2 rounded-full transition-all flex-shrink-0
                            ${inputText.trim()
                                ? "bg-slate-900 text-white shadow-md transform active:scale-90 hover:bg-black"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        <ArrowRight size={18} strokeWidth={3} />
                    </button>
                </form>
            </div>

            {/* Crop Modal */}
            <AnimatePresence>
                {selectedImg && (
                    <ImageCropModal
                        imageSrc={selectedImg}
                        aspect={4 / 3} // Default photo aspect
                        onCancel={() => setSelectedImg(null)}
                        onCropComplete={handleImageUpload}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}