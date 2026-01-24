"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, serverTimestamp, orderBy, Timestamp, getDoc, limit, startAfter, getDocs, where } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import {
    X, MapPin, MessageCircle, Check, Loader2, Image as ImageIcon, Trash2, Plus,
    PenLine, ListTodo, Heart, NotebookPen, LayoutGrid, CheckSquare, Gift, Filter, CalendarDays, Archive
} from "lucide-react";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ImageCropModal from "./ImageCropModal";

const MemoComments = dynamic(() => import("./MemoComments"), { ssr: false });

type TabType = "board" | "todo" | "wish";

const TRIP_DATES = [
    "2026-02-06", "2026-02-07", "2026-02-08", "2026-02-09", "2026-02-10",
    "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15", "2026-02-16"
];
const WEEKDAYS = ["금", "토", "일", "월", "화", "수", "목", "금", "토", "일", "월"];

interface MemoItem {
    id: string;
    text: string;
    content?: string;
    lat?: number;
    lng?: number;
    completed: boolean;
    category: TabType;
    imageUrl?: string;
    uid: string;
    nickname: string;
    flagColor?: string;
    targetDate?: string | null; // For Todo (YYYY-MM-DD or null for Temp)
    createdAt: Timestamp | null;
}

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function MemoPad() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("board");

    // --- State Separation ---
    const [boardItems, setBoardItems] = useState<MemoItem[]>([]);
    const [todoItems, setTodoItems] = useState<MemoItem[]>([]);
    const [wishItems, setWishItems] = useState<MemoItem[]>([]);

    // Pagination State (Board)
    const [lastBoardDoc, setLastBoardDoc] = useState<any>(null);
    const [hasMoreBoard, setHasMoreBoard] = useState(true);
    const [isLoadingBoard, setIsLoadingBoard] = useState(false);

    // Todo State
    const [todoDate, setTodoDate] = useState<string | "temp">(() => {
        const today = new Date().toISOString().split("T")[0];
        return TRIP_DATES.includes(today) ? today : TRIP_DATES[0];
    });

    // Cache user flags
    const [userFlags, setUserFlags] = useState<{ [uid: string]: string }>({});

    // Filter State (Board Only)
    const [filterMember, setFilterMember] = useState<string>("all");

    // Modal & Inputs
    const [simpleInput, setSimpleInput] = useState("");
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardContent, setBoardContent] = useState("");
    const [boardLocation, setBoardLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [boardImage, setBoardImage] = useState<string>("");
    const [originalImg, setOriginalImg] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedBoardItem, setSelectedBoardItem] = useState<MemoItem | null>(null);

    // --- Helper: Sync Flags ---
    const syncFlags = async (items: MemoItem[]) => {
        const uids = Array.from(new Set(items.map(i => i.uid)));
        const newFlags = { ...userFlags };
        let needUpdate = false;

        for (const uid of uids) {
            if (!newFlags[uid]) {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    newFlags[uid] = userSnap.data().flag || "#000000";
                    needUpdate = true;
                }
            }
        }
        if (needUpdate) setUserFlags(newFlags);
        return items.map(item => ({ ...item, flagColor: newFlags[item.uid] || "#000000" }));
    };

    // --- 1. Fetch Board (Paginated) ---
    const fetchBoard = async (isLoadMore = false) => {
        if (!hasMoreBoard && isLoadMore) return;
        setIsLoadingBoard(true);
        try {
            let q = query(
                collection(db, "memos"),
                where("category", "==", "board"),
                orderBy("createdAt", "desc"),
                limit(10)
            );

            if (isLoadMore && lastBoardDoc) {
                q = query(q, startAfter(lastBoardDoc));
            }

            const snap = await getDocs(q);
            const newItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MemoItem[];

            const merged = await syncFlags(newItems);

            if (isLoadMore) {
                setBoardItems(prev => [...prev, ...merged]);
            } else {
                setBoardItems(merged);
            }

            setLastBoardDoc(snap.docs[snap.docs.length - 1]);
            setHasMoreBoard(snap.docs.length === 10);
        } catch (e) {
            console.error("Board fetch error:", e);
        } finally {
            setIsLoadingBoard(false);
        }
    };

    useEffect(() => {
        if (activeTab === "board") {
            setBoardItems([]);
            setLastBoardDoc(null);
            setHasMoreBoard(true);
            fetchBoard(false);
        }
    }, [activeTab]); // Refetch on tab switch (simple approach)

    // --- 2. Fetch Todo (Realtime, Date filtered) ---
    useEffect(() => {
        if (activeTab !== "todo") return;

        let q;
        if (todoDate === "temp") {
            // Temp items (no targetDate)
            q = query(
                collection(db, "memos"),
                where("category", "==", "todo"),
                where("targetDate", "==", null), // or check for existence? null is easier if we save explicitly
                orderBy("createdAt", "desc")
            );
        } else {
            // Date items
            q = query(
                collection(db, "memos"),
                where("category", "==", "todo"),
                where("targetDate", "==", todoDate),
                orderBy("createdAt", "desc")
            );
        }

        const unsubscribe = onSnapshot(q, async (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MemoItem[];
            const merged = await syncFlags(list);
            setTodoItems(merged);
        });
        return () => unsubscribe();
    }, [activeTab, todoDate, userFlags]);

    // --- 3. Fetch Wish (Realtime, Simple Limit) ---
    useEffect(() => {
        if (activeTab !== "wish") return;
        const q = query(
            collection(db, "memos"),
            where("category", "==", "wish"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const unsubscribe = onSnapshot(q, async (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MemoItem[];
            const merged = await syncFlags(list);
            setWishItems(merged);
        });
        return () => unsubscribe();
    }, [activeTab, userFlags]);


    // Computed Members for Filter (Board Only)
    const members = useMemo(() => {
        const names = new Set(boardItems.map(i => i.nickname));
        return Array.from(names);
    }, [boardItems]);

    // Apply Filter to Board
    const filteredBoardItems = boardItems.filter(i => filterMember === "all" || i.nickname === filterMember);

    // Handling Lists for Todo/Wish
    const currentList = activeTab === "todo" ? todoItems : activeTab === "wish" ? wishItems : [];
    const activeSimpleItems = currentList.filter(i => !i.completed);
    const completedSimpleItems = currentList.filter(i => i.completed);

    // Handlers
    const handleSimpleAdd = async () => {
        if (!simpleInput.trim() || !user) return;
        try {
            const data: any = {
                text: simpleInput,
                completed: false,
                category: activeTab,
                uid: user.uid,
                nickname: userProfile?.nickname || "익명",
                createdAt: serverTimestamp()
            };
            if (activeTab === "todo") {
                data.targetDate = todoDate === "temp" ? null : todoDate;
            }
            await addDoc(collection(db, "memos"), data);
            setSimpleInput("");
        } catch (e) { console.error(e); }
    };

    const handleToggle = async (item: MemoItem) => {
        if (item.category === "wish" && item.uid !== user?.uid) {
            alert("위시리스트는 작성자만 완료 처리할 수 있습니다.");
            return;
        }
        await updateDoc(doc(db, "memos", item.id), { completed: !item.completed });
    };

    const handleDelete = async (id: string) => {
        if (confirm("삭제하시겠습니까?")) {
            await deleteDoc(doc(db, "memos", id));
            if (selectedBoardItem?.id === id) setSelectedBoardItem(null);
            // If board, remove directly from state to avoid re-fetch need (optional optimization)
            if (activeTab === "board") {
                setBoardItems(prev => prev.filter(i => i.id !== id));
            }
        }
    };

    // Board Add
    const handleBoardSubmit = async () => {
        if (!boardTitle.trim() || !user) return;
        setIsUploading(true);
        try {
            await addDoc(collection(db, "memos"), {
                text: boardTitle,
                content: boardContent,
                lat: boardLocation?.lat ?? null,
                lng: boardLocation?.lng ?? null,
                imageUrl: boardImage,
                completed: false,
                category: "board",
                uid: user.uid,
                nickname: userProfile?.nickname || "익명",
                createdAt: serverTimestamp()
            });
            resetBoardForm();
            // Refresh board
            setLastBoardDoc(null);
            setHasMoreBoard(true);
            fetchBoard(false);
        } catch (e) { console.error(e); } finally { setIsUploading(false); }
    };

    const resetBoardForm = () => {
        setIsBoardModalOpen(false);
        setBoardTitle("");
        setBoardContent("");
        setBoardLocation(null);
        setBoardImage("");
        setOriginalImg(null);
    };

    const handleLocation = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setBoardLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
            },
            () => { alert("위치 확인 실패"); setIsLocating(false); }
        );
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setOriginalImg(reader.result as string);
                e.target.value = "";
            };
        }
    };

    return (
        <div className="w-full max-w-md mx-auto min-h-[600px] pb-24">

            {/* Header & Tabs */}
            <div className="flex flex-col gap-5 mb-6 px-1">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md">
                        <NotebookPen size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-none">Memo Pad</h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            <span className="text-slate-900 font-bold">
                                {activeTab === 'board' ? boardItems.length : currentList.length}
                            </span>개의 메모
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 bg-gray-50 p-1.5 rounded-2xl gap-1 border border-gray-100">
                    {[
                        { id: "board", label: "게시판", icon: <LayoutGrid size={14} /> },
                        { id: "todo", label: "할 일", icon: <CheckSquare size={14} /> },
                        { id: "wish", label: "위시", icon: <Gift size={14} /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- Filters (Contextual) --- */}

                {/* 1. Board: Member Filter */}
                {activeTab === "board" && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <button onClick={() => setFilterMember("all")} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${filterMember === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-500 border-gray-200"}`}>
                            전체 보기
                        </button>
                        {members.map(m => (
                            <button key={m} onClick={() => setFilterMember(m)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${filterMember === m ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-500 border-gray-200"}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                )}

                {/* 2. Todo: Date Filter */}
                {activeTab === "todo" && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-2">
                        <button
                            onClick={() => setTodoDate("temp")}
                            className={`flex flex-col items-center justify-center min-w-[50px] h-[60px] rounded-xl snap-start transition-all border ${todoDate === "temp"
                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                : "bg-white text-gray-400 border-gray-100"
                                }`}
                        >
                            <Archive size={18} className="mb-1" />
                            <span className="text-[10px] font-bold">임시</span>
                        </button>
                        {TRIP_DATES.map((date, idx) => {
                            const isSelected = date === todoDate;
                            const day = date.split("-")[2];
                            return (
                                <button
                                    key={date}
                                    onClick={() => setTodoDate(date)}
                                    className={`flex flex-col items-center justify-center min-w-[50px] h-[60px] rounded-xl snap-start transition-all border ${isSelected
                                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                        : "bg-white text-gray-400 border-gray-100"
                                        }`}
                                >
                                    <span className="text-[10px] font-bold mb-0.5">{WEEKDAYS[idx]}</span>
                                    <span className="text-lg font-bold">{day}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* --- Content Area --- */}

            {/* VIEW: BOARD */}
            {activeTab === "board" && (
                <div className="space-y-4">
                    <button
                        onClick={() => setIsBoardModalOpen(true)}
                        className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-2 group bg-gray-50/50"
                    >
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Plus size={16} />
                        </div>
                        새로운 글 쓰기
                    </button>

                    <div className="grid gap-3">
                        {filteredBoardItems.map(item => (
                            <motion.div
                                layoutId={item.id}
                                key={item.id}
                                onClick={() => setSelectedBoardItem(item)}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.flagColor || '#000' }} />
                                <div className="flex gap-4 pl-2">
                                    {item.imageUrl && (
                                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 py-0.5">
                                        <h3 className="font-bold text-slate-900 text-base line-clamp-1 mb-1">{item.text}</h3>
                                        <p className="text-gray-500 text-xs line-clamp-2 mb-2 leading-relaxed">{item.content}</p>
                                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                                            <span>{item.nickname}</span>
                                            {item.lat && <MapPin size={12} className="text-gray-300" />}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {hasMoreBoard && (
                        <button
                            onClick={() => fetchBoard(true)}
                            disabled={isLoadingBoard}
                            className="w-full py-4 text-xs font-bold text-gray-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoadingBoard ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            더 보기
                        </button>
                    )}
                </div>
            )}

            {/* VIEW: TODO / WISH */}
            {(activeTab === "todo" || activeTab === "wish") && (
                <div className="space-y-6">
                    {/* Input Bar */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-1.5 flex gap-2 shadow-sm focus-within:ring-2 focus-within:ring-slate-900/10 transition-all sticky top-20 z-10">
                        <input
                            type="text"
                            value={simpleInput}
                            onChange={(e) => setSimpleInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSimpleAdd()}
                            placeholder={activeTab === "todo"
                                ? (todoDate === "temp" ? "임시 할 일을 입력하세요" : `${todoDate.split('-')[2]}일 할 일을 입력하세요`)
                                : "위시리스트에 추가할 것"}
                            className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSimpleAdd}
                            disabled={!simpleInput.trim()}
                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black disabled:opacity-50 transition-colors"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Active Items */}
                    <ul className="space-y-3">
                        {activeSimpleItems.map(item => (
                            <motion.li
                                layout
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden transition-colors"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.flagColor || '#000' }} />
                                <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
                                    <button
                                        onClick={() => handleToggle(item)}
                                        className="w-5 h-5 rounded-md border-2 border-gray-300 hover:border-slate-400 bg-white flex items-center justify-center transition-all flex-shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{item.text}</span>
                                        <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{item.nickname}</span>
                                    </div>
                                </div>
                                {user?.uid === item.uid && (
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </motion.li>
                        ))}
                    </ul>

                    {/* Completed Items */}
                    {completedSimpleItems.length > 0 && (
                        <div className="pt-4 border-t border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 mb-3 px-1">완료됨 ({completedSimpleItems.length})</p>
                            <ul className="space-y-2">
                                {completedSimpleItems.map(item => (
                                    <motion.li
                                        layout
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 relative overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: item.flagColor || '#000' }} />
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
                                            <button
                                                onClick={() => handleToggle(item)}
                                                className="w-4 h-4 rounded-md bg-slate-900 border border-slate-900 text-white flex items-center justify-center transition-all flex-shrink-0"
                                            >
                                                <Check size={10} strokeWidth={4} />
                                            </button>
                                            <span className="text-sm font-medium text-gray-500 line-through decoration-gray-400">
                                                {item.text}
                                            </span>
                                        </div>
                                        {user?.uid === item.uid && (
                                            <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 transition-colors">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {currentList.length === 0 && (
                        <div className="py-16 text-center text-gray-300 flex flex-col items-center gap-2 border-2 border-dashed border-gray-100 rounded-3xl">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                {activeTab === "todo" ? <ListTodo size={20} /> : <Heart size={20} />}
                            </div>
                            <span className="text-xs font-bold">아직 기록이 없어요</span>
                        </div>
                    )}
                </div>
            )}

            {/* --- Modals (Write, Detail, Cropper) --- */}
            {/* Board Write Modal */}
            <AnimatePresence>
                {isBoardModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">글 쓰기</h3>
                                <button onClick={resetBoardForm}><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <input type="text" placeholder="제목" value={boardTitle} onChange={e => setBoardTitle(e.target.value)} className="w-full text-lg font-bold outline-none placeholder:text-gray-300" />
                                <textarea placeholder="내용을 입력하세요" value={boardContent} onChange={e => setBoardContent(e.target.value)} className="w-full h-32 resize-none text-sm outline-none placeholder:text-gray-300" />
                                <div className="flex gap-2">
                                    <button onClick={handleLocation} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors ${boardLocation ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}>
                                        {isLocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />} 위치
                                    </button>
                                    <label className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-colors ${boardImage ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-500"}`}>
                                        <ImageIcon size={14} /> 사진
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                    </label>
                                </div>
                                <button onClick={handleBoardSubmit} disabled={!boardTitle || isUploading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50">
                                    {isUploading ? "업로드 중..." : "등록하기"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Cropper */}
            <AnimatePresence>
                {originalImg && (
                    <ImageCropModal
                        imageSrc={originalImg}
                        aspect={4 / 3}
                        onCancel={() => setOriginalImg(null)}
                        onCropComplete={(cropped) => {
                            setBoardImage(cropped);
                            setOriginalImg(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Board Detail Modal */}
            <AnimatePresence>
                {selectedBoardItem && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div layoutId={selectedBoardItem.id} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-extrabold mb-1">{selectedBoardItem.text}</h3>
                                    <span className="text-xs text-gray-400">by {selectedBoardItem.nickname}</span>
                                </div>
                                <div className="flex gap-2">
                                    {user?.uid === selectedBoardItem.uid && (
                                        <button onClick={() => handleDelete(selectedBoardItem.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={20} /></button>
                                    )}
                                    <button onClick={() => setSelectedBoardItem(null)} className="bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedBoardItem.imageUrl && (
                                    <div className="rounded-xl overflow-hidden mb-6 bg-gray-50 border border-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selectedBoardItem.imageUrl} alt="" className="w-full h-auto" />
                                    </div>
                                )}
                                <p className="text-gray-700 text-sm leading-relaxed mb-8 whitespace-pre-wrap">{selectedBoardItem.content}</p>

                                {selectedBoardItem.lat && (
                                    <div className="h-40 rounded-xl overflow-hidden mb-8 border border-gray-100 shadow-inner">
                                        <MapContainer center={[selectedBoardItem.lat, selectedBoardItem.lng!]} zoom={14} zoomControl={false} className="w-full h-full">
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <Marker position={[selectedBoardItem.lat, selectedBoardItem.lng!]} icon={icon} />
                                        </MapContainer>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><MessageCircle size={16} /> 댓글</h4>
                                    <MemoComments memoId={selectedBoardItem.id} />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}