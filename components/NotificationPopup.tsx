import { AnimatePresence, motion, useAnimation, PanInfo } from "framer-motion";
import { useNotification, NotificationItem } from "../contexts/NotificationContext";
import { X, Check, Trash2, CheckCheck } from "lucide-react";
import { useState } from "react";

interface Props {
    onClose: () => void;
    onItemClick: (item: NotificationItem) => void;
}

export default function NotificationPopup({ onClose, onItemClick }: Props) {
    const { notifications, markAllAsRead, deleteNotification } = useNotification();

    const handleClearAll = async () => {
        if (confirm("모든 알림을 읽음 처리하시겠습니까?")) {
            await markAllAsRead();
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[49]" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-14 right-4 z-[50] w-[320px] sm:w-[360px] max-h-[60vh] flex flex-col origin-top-right"
            >
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-black/5 flex justify-between items-center bg-white/20 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-[15px] tracking-tight">알림 센터</h3>
                            <span className="text-[10px] bg-slate-900/10 px-2 py-0.5 rounded-full font-bold text-slate-600">
                                {notifications.length}
                            </span>
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-slate-900 transition-colors px-2 py-1 rounded-full hover:bg-black/5"
                            >
                                <CheckCheck size={12} /> 전체 읽음
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto p-2 scrollbar-hide max-h-[400px] overflow-x-hidden">
                        {notifications.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
                                <div className="w-10 h-10 bg-gray-100/50 rounded-full flex items-center justify-center">
                                    <Check size={18} className="opacity-30" />
                                </div>
                                <span className="text-xs font-medium text-gray-500/80">새로운 알림이 없습니다</span>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {notifications.map((item) => (
                                        <SwipeableItem
                                            key={item.id}
                                            item={item}
                                            onDismiss={() => deleteNotification(item.id)}
                                            onClick={() => onItemClick(item)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}

function SwipeableItem({ item, onDismiss, onClick }: { item: NotificationItem, onDismiss: () => void, onClick: () => void }) {
    const isUnread = !item.readBy?.includes(localStorage.getItem('uid') || '');
    const controls = useAnimation();

    const handleDragEnd = async (event: any, info: PanInfo) => {
        if (info.offset.x < -100) {
            await controls.start({ x: -500, opacity: 0 });
            onDismiss();
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="relative"
        >
            {/* Delete Background Layer (Visible when swiping) */}
            <div className="absolute inset-y-0 right-0 w-full bg-red-500 rounded-2xl flex items-center justify-end px-4 mb-1">
                <Trash2 size={18} className="text-white" />
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.7, right: 0.1 }}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ touchAction: "none" }}
                onClick={onClick}
                className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex gap-3 items-start border border-transparent bg-white ${isUnread ? "shadow-sm border-white/40" : "hover:bg-gray-50"}`}
            >
                {/* Dot Indicator */}
                <div className={`w-2 h-2 mt-1.5 rounded-full shadow-sm flex-shrink-0 ${item.type === 'todo' ? 'bg-[#007AFF]' :
                    item.type === 'board' ? 'bg-[#1D1D1F]' :
                        item.type === 'wish' ? 'bg-[#FF2D55]' :
                            item.type === 'expense' ? 'bg-[#34C759]' : 'bg-[#8E8E93]'
                    }`} />

                <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug mb-1 tracking-tight ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                        {item.message}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 block tracking-tight">
                        {item.createdAt?.toDate ?
                            (() => {
                                const date = item.createdAt.toDate();
                                const now = new Date();
                                const diff = now.getTime() - date.getTime();
                                if (diff < 60000) return "지금";
                                if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
                                if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
                                return `${date.getMonth() + 1}월 ${date.getDate()}일`;
                            })()
                            : '지금'}
                    </span>
                </div>
                {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] absolute top-4 right-4" />}
            </motion.div>
        </motion.li>
    );
}
