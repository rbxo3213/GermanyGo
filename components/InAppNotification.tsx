"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth"; // Assume hook exists
import { MessageCircle } from "lucide-react";

interface NotificationProps {
    onOpenChat: () => void;
}

export default function InAppNotification({ onOpenChat }: NotificationProps) {
    const { user } = useAuth();
    const [notification, setNotification] = useState<{ id: string; nickname: string; text: string } | null>(null);
    const [lastMsgId, setLastMsgId] = useState<string | null>(null);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Listen for newest message
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const msgId = doc.id;

                // Skip own messages
                if (data.uid === user.uid) return;

                // First load check: Don't show notification for existing messages
                if (isFirstLoad) {
                    setLastMsgId(msgId);
                    setIsFirstLoad(false);
                    return;
                }

                // If new message (different ID than last seen)
                if (msgId !== lastMsgId) {
                    // Check if recent (within 5s) to avoid stale alerts on reload
                    const now = new Date();
                    const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
                    const diff = (now.getTime() - created.getTime()) / 1000;

                    if (diff < 10) { // 10s window
                        setNotification({
                            id: msgId,
                            nickname: data.nickname || "멤버",
                            text: data.type === 'image' ? '사진을 보냈습니다.' : data.text
                        });
                        setLastMsgId(msgId);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user, lastMsgId, isFirstLoad]);

    // Auto dismiss
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 4000); // 4s display
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => {
                        onOpenChat();
                        setNotification(null);
                    }}
                    className="fixed top-4 left-4 right-4 z-[9999] flex justify-center cursor-pointer"
                >
                    <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-gray-100 rounded-full px-5 py-3 flex items-center gap-3 max-w-sm w-full relative overflow-hidden">
                        {/* Status Indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FEE500]"></div>

                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <MessageCircle size={20} className="text-slate-900" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-500 mb-0.5">{notification.nickname}</h4>
                            <p className="text-sm font-bold text-slate-900 truncate">{notification.text}</p>
                        </div>

                        <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">지금</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
