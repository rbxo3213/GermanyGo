"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Send, Trash2 } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

interface Comment {
    id: string;
    text: string;
    uid: string;
    nickname: string;
    createdAt: Timestamp | null;
}

interface MemoCommentsProps {
    memoId: string;
    memoTitle: string;
}

export default function MemoComments({ memoId, memoTitle }: MemoCommentsProps) {
    const { user, userProfile } = useAuth();
    const { sendNotification } = useNotification();
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!memoId) return;
        const q = query(
            collection(db, "memos", memoId, "comments"),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Comment[];
            setComments(data);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsubscribe();
    }, [memoId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user) return;

        try {
            await addDoc(collection(db, "memos", memoId, "comments"), {
                text: text,
                uid: user.uid,
                nickname: userProfile?.nickname || user.displayName || "여행자",
                createdAt: serverTimestamp()
            });

            // Send Notification
            // Truncate comment if too long
            const preview = text.length > 20 ? text.substring(0, 20) + "..." : text;
            await sendNotification('board', `${userProfile?.nickname || "익명"}님이 "${memoTitle}"에 댓글: "${preview}"`);

            setText("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("댓글을 삭제할까요?")) {
            await deleteDoc(doc(db, "memos", memoId, "comments", id));
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mt-4">
            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px] max-h-[250px]">
                {comments.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-4">첫 번째 댓글을 남겨보세요!</p>
                )}
                {comments.map((c) => (
                    <div key={c.id} className="flex gap-2 items-start">
                        <div className="flex-1 bg-white p-2.5 rounded-xl rounded-tl-none border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-800">{c.nickname}</span>
                                {user?.uid === c.uid && (
                                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 break-all">{c.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-2 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="댓글 입력..."
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button type="submit" disabled={!text.trim()} className="p-2 bg-slate-900 text-white rounded-lg disabled:opacity-50">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
