"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Volume2, Search, X, Hand, Utensils, ShoppingBag,
    Bus, BedDouble, Binary, AlertTriangle, Plus, PenLine, Languages, Mic, Trash2, Pencil, Keyboard
} from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

type Category = "greeting" | "dining" | "shopping" | "transport" | "hotel" | "number" | "emergency" | "custom";

interface Phrase {
    id?: string;
    de: string;
    ko: string;
    pron: string;
    category: Category;
    isCustom?: boolean;
    uid?: string;
}

// --- 기본 데이터 (대폭 보강됨) ---
const STATIC_PHRASES: Phrase[] = [
    // 1. 인사 (Greeting)
    { de: "Hallo", ko: "안녕하세요", pron: "할로", category: "greeting" },
    { de: "Guten Morgen", ko: "좋은 아침입니다", pron: "구텐 모르겐", category: "greeting" },
    { de: "Guten Tag", ko: "안녕하세요 (낮)", pron: "구텐 탁", category: "greeting" },
    { de: "Guten Abend", ko: "안녕하세요 (저녁)", pron: "구텐 아벤트", category: "greeting" },
    { de: "Danke schön", ko: "감사합니다", pron: "당케 쉔", category: "greeting" },
    { de: "Auf Wiedersehen", ko: "안녕히 계세요 (격식)", pron: "아우프 비더젠", category: "greeting" },
    { de: "Können Sie ein Foto von uns machen?", ko: "사진 좀 찍어주실래요?", pron: "쾨넨 지 아인 포토 폰 운스 마헨?", category: "greeting" },
    { de: "Bitte sehr", ko: "천만에요 / 여기요", pron: "비테 제어", category: "greeting" },
    { de: "Entschuldigung", ko: "실례합니다", pron: "엔트슐디궁", category: "greeting" },
    { de: "Es tut mir leid", ko: "미안합니다", pron: "에스 투트 미어 라이트", category: "greeting" },
    { de: "Sprechen Sie Englisch?", ko: "영어 할 줄 아세요?", pron: "슈프레헨 지 엥글리쉬?", category: "greeting" },
    { de: "Ich verstehe nicht", ko: "이해가 안 돼요", pron: "이히 페어슈테에 니히트", category: "greeting" },
    { de: "Tschüss", ko: "안녕히 가세요 (캐주얼)", pron: "츄-스", category: "greeting" },


    // 2. 식당 (Dining) - 3인 여행 맞춤
    { de: "Haben Sie einen Tisch für drei?", ko: "3명 자리 있나요?", pron: "하벤 지 아이넨 티슈 퓌어 드라이?", category: "dining" },
    { de: "Die Speisekarte, bitte", ko: "메뉴판 주세요", pron: "디 슈파이제카르테 비테", category: "dining" },
    { de: "Wir möchten bestellen", ko: "주문할게요", pron: "비어 뫼히텐 베슈텔렌", category: "dining" },
    { de: "Drei Bier, bitte", ko: "맥주 3잔 주세요", pron: "드라이 비어 비테", category: "dining" },
    { de: "Leitungswasser, bitte", ko: "수돗물(무료 물) 주세요", pron: "라이퉁스바서 비테", category: "dining" },
    { de: "Wasser ohne Kohlensäure", ko: "탄산 없는 물 주세요", pron: "바서 오네 콜렌조이레", category: "dining" },
    { de: "Ist das sehr scharf?", ko: "이거 많이 매운가요?", pron: "이스트 다스 제어 샤르프?", category: "dining" },
    { de: "Die Rechnung, bitte", ko: "계산서 주세요", pron: "디 레히눙 비테", category: "dining" },
    { de: "Zusammen oder getrennt?", ko: "같이요 아니면 따로요?", pron: "쭈잠멘 오더 게트렌트?", category: "dining" },
    { de: "Getrennt, bitte", ko: "따로 계산할게요", pron: "게트렌트 비테", category: "dining" },
    { de: "Es war sehr lecker", ko: "정말 맛있었어요", pron: "에스 바 제어 레커", category: "dining" },
    { de: "Wo ist die Toilette?", ko: "화장실이 어디인가요?", pron: "보 이스트 디 토일레테?", category: "dining" },

    // 3. 쇼핑 (Shopping)
    { de: "Wie viel kostet das?", ko: "얼마인가요?", pron: "비 필 코스테트 다스?", category: "shopping" },
    { de: "Kann ich mit Karte zahlen?", ko: "카드로 계산되나요?", pron: "칸 이히 미트 카르테 짤렌?", category: "shopping" },
    { de: "Nur Bargeld", ko: "현금만 받아요", pron: "누어 바르겔트", category: "shopping" },
    { de: "Haben Sie das in einer anderen Größe?", ko: "다른 사이즈 있나요?", pron: "하벤 지 다스 인 아이너 안데렌 그뢰쎄?", category: "shopping" },
    { de: "Kann ich das anprobieren?", ko: "입어봐도 될까요?", pron: "칸 이히 다스 안프로비어렌?", category: "shopping" },
    { de: "Das ist zu teuer", ko: "너무 비싸요", pron: "다스 이스트 쭈 토이어", category: "shopping" },
    { de: "Eine Tüte, bitte", ko: "봉투 하나 주세요", pron: "아이네 튀테 비테", category: "shopping" },
    { de: "Öffnungszeiten", ko: "영업 시간", pron: "외프눙스짜이텐", category: "shopping" },

    // 4. 교통 (Transport)
    { de: "Wo ist der Bahnhof?", ko: "기차역이 어디인가요?", pron: "보 이스트 데어 반호프?", category: "transport" },
    { de: "Drei Fahrkarten nach..., bitte", ko: "...행 표 3장 주세요", pron: "드라이 파르카르텐 나흐... 비테", category: "transport" },
    { de: "Fährt dieser Zug nach...?", ko: "이 기차 ...로 가나요?", pron: "페어트 디저 쭉 나흐...?", category: "transport" },
    { de: "Muss ich umsteigen?", ko: "갈아타야 하나요?", pron: "무스 이히 움슈타이겐?", category: "transport" },
    { de: "Bitte hier anhalten", ko: "여기서 세워주세요", pron: "비테 히어 안할텐", category: "transport" },
    { de: "Eingang / Ausgang", ko: "입구 / 출구", pron: "아인강 / 아우스강", category: "transport" },
    { de: "Geradeaus", ko: "직진", pron: "게라데아우스", category: "transport" },
    { de: "Links / Rechts", ko: "왼쪽 / 오른쪽", pron: "링크스 / 레흐츠", category: "transport" },

    // 5. 숙소 (Hotel)
    { de: "Wir haben eine Reservierung", ko: "저희 예약했습니다", pron: "비어 하벤 아이네 레저비어룽", category: "hotel" },
    { de: "Können wir das Gepäck hier lassen?", ko: "짐을 여기에 맡길 수 있나요?", pron: "쾨넨 비어 다스 게펙 히어 라쎈?", category: "hotel" },
    { de: "Wann gibt es Frühstück?", ko: "조식은 언제인가요?", pron: "반 깁트 에스 프류슈튁?", category: "hotel" },
    { de: "Das WLAN funktioniert nicht", ko: "와이파이가 안 돼요", pron: "다스 베란 펑크티오니어트 니히트", category: "hotel" },
    { de: "Könnten Sie ein Taxi rufen?", ko: "택시 좀 불러주시겠어요?", pron: "쾨넨 지 아인 택시 루펜?", category: "hotel" },
    { de: "Check-out, bitte", ko: "체크아웃 할게요", pron: "체크아웃 비테", category: "hotel" },

    // 6. 숫자 (Numbers)
    { de: "Null", ko: "0", pron: "눌", category: "number" },
    { de: "Eins", ko: "1", pron: "아인스", category: "number" },
    { de: "Zwei", ko: "2", pron: "쯔바이", category: "number" },
    { de: "Drei", ko: "3", pron: "드라이", category: "number" },
    { de: "Vier", ko: "4", pron: "피어", category: "number" },
    { de: "Fünf", ko: "5", pron: "퓐프", category: "number" },
    { de: "Sechs", ko: "6", pron: "젝스", category: "number" },
    { de: "Sieben", ko: "7", pron: "지벤", category: "number" },
    { de: "Acht", ko: "8", pron: "아흐트", category: "number" },
    { de: "Neun", ko: "9", pron: "노인", category: "number" },
    { de: "Zehn", ko: "10", pron: "쩬", category: "number" },
    { de: "Zwanzig", ko: "20", pron: "쯔반찌히", category: "number" },
    { de: "Fünfzig", ko: "50", pron: "퓐프찌히", category: "number" },
    { de: "Hundert", ko: "100", pron: "훈데르트", category: "number" },
    { de: "Tausend", ko: "1000", pron: "타우젠트", category: "number" },

    // 7. 응급/기타 (Emergency)
    { de: "Hilfe!", ko: "도와주세요!", pron: "힐페!", category: "emergency" },
    { de: "Ich brauche einen Arzt", ko: "의사가 필요해요", pron: "이히 브라우헤 아이넨 아르츠트", category: "emergency" },
    { de: "Rufen Sie die Polizei", ko: "경찰을 불러주세요", pron: "루펜 지 디 폴리짜이", category: "emergency" },
    { de: "Apotheke", ko: "약국", pron: "아포테케", category: "emergency" },
];

const CATEGORIES_CONFIG: { id: Category; label: string; icon: any }[] = [
    { id: "greeting", label: "인사", icon: Hand },
    { id: "dining", label: "식당", icon: Utensils },
    { id: "shopping", label: "쇼핑", icon: ShoppingBag },
    { id: "transport", label: "교통", icon: Bus },
    { id: "hotel", label: "숙소", icon: BedDouble },
    { id: "number", label: "숫자", icon: Binary },
    { id: "emergency", label: "기타", icon: AlertTriangle },
    { id: "custom", label: "MY", icon: PenLine },
];

export default function GermanPhrasebook() {
    const { user } = useAuth();
    const [activeCat, setActiveCat] = useState<Category>("greeting");
    const [searchTerm, setSearchTerm] = useState("");
    const [customPhrases, setCustomPhrases] = useState<Phrase[]>([]);

    // Add/Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [newDe, setNewDe] = useState("");
    const [newKo, setNewKo] = useState("");
    const [newPron, setNewPron] = useState(""); // 발음 입력 상태 추가

    // 1. Load Custom Phrases
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "phrases"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isCustom: true
            })) as Phrase[];
            setCustomPhrases(loaded);
        });
        return () => unsubscribe();
    }, [user]);

    // 2. TTS
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "de-DE";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // 3. Open Modal
    const openAddModal = () => {
        setEditId(null);
        setNewDe("");
        setNewKo("");
        setNewPron("");
        setIsModalOpen(true);
    };

    const openEditModal = (phrase: Phrase) => {
        if (!phrase.id) return;
        setEditId(phrase.id);
        setNewDe(phrase.de);
        setNewKo(phrase.ko);
        setNewPron(phrase.pron.replace("🔊 ", "")); // 아이콘 제거 후 텍스트만
        setIsModalOpen(true);
    };

    // 4. Save Phrase
    const handleSavePhrase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newDe.trim() || !newKo.trim()) return;

        const pronText = newPron.trim() ? newPron.trim() : "🔊 직접 들어보세요";

        try {
            if (editId) {
                await updateDoc(doc(db, "phrases", editId), {
                    de: newDe,
                    ko: newKo,
                    pron: pronText,
                });
            } else {
                await addDoc(collection(db, "phrases"), {
                    de: newDe,
                    ko: newKo,
                    pron: pronText,
                    category: "custom",
                    uid: user.uid,
                    createdAt: serverTimestamp()
                });
                setActiveCat("custom");
            }
            setIsModalOpen(false);
            setEditId(null);
        } catch (e) {
            console.error(e);
            alert("저장 실패");
        }
    };

    // 5. Delete Phrase
    const handleDeletePhrase = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await deleteDoc(doc(db, "phrases", id));
        }
    };

    // 6. Filtering Logic
    const allPhrases = [...customPhrases, ...STATIC_PHRASES];

    const getFilteredPhrases = () => {
        const query = searchTerm.toLowerCase();
        if (query.trim().length > 0) {
            return allPhrases.filter(p =>
                p.de.toLowerCase().includes(query) ||
                p.ko.includes(query) ||
                p.pron.includes(query)
            ).map(p => {
                const label = CATEGORIES_CONFIG.find(c => c.id === p.category)?.label || "";
                return { ...p, categoryLabel: label };
            });
        }
        return allPhrases.filter(p => p.category === activeCat);
    };

    const displayPhrases = getFilteredPhrases();

    return (
        <div className="w-full max-w-md mx-auto pb-24 min-h-screen relative">

            {/* Header */}
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-2">
                <div className="px-1 mb-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                            🇩🇪 여행 독일어
                            <span className="text-xs font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Tap to Speak</span>
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="검색 (예: 화장실, 맥주)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-gray-400"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3 text-gray-400 hover:text-slate-900">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <AnimatePresence>
                    {!searchTerm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-gray-100 pb-2 mb-2"
                        >
                            <div className="overflow-x-auto px-1 scrollbar-hide">
                                <div className="flex px-1 gap-2 w-max">
                                    {CATEGORIES_CONFIG.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCat(cat.id)}
                                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border
                                                ${activeCat === cat.id
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                    : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"}`}
                                        >
                                            <cat.icon size={14} />
                                            <span>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* List Content */}
            <div className="space-y-2.5 px-1">
                {/* 1. AnimatePresence는 리스트 전체의 교체를 감지합니다 */}
                <AnimatePresence mode="wait">
                    <motion.div
                        // 2. 중요: 카테고리나 검색어가 바뀔 때마다 이 'div' 자체가 새로 그려집니다.
                        key={activeCat + searchTerm}

                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* 3. 내부는 일반 div로 렌더링 (map을 여기서 돌립니다) */}
                        {displayPhrases.map((phrase, idx) => (
                            <div
                                key={(phrase.id || phrase.de) + idx}
                                onClick={() => speak(phrase.de)}
                                className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 active:scale-[0.98] transition-all cursor-pointer group hover:border-slate-300 relative overflow-hidden mb-2.5"
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-black text-slate-800 leading-tight truncate">{phrase.de}</h3>
                                            {(phrase as any).categoryLabel && (
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                                                    {(phrase as any).categoryLabel}
                                                </span>
                                            )}
                                            {phrase.isCustom && (
                                                <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold flex-shrink-0">MY</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className={`text-xs font-bold ${phrase.isCustom && !phrase.pron.includes('🔊') ? "text-blue-500" : "text-[#FFB700]"}`}>
                                                {phrase.pron}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium">{phrase.ko}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {phrase.isCustom && phrase.uid === user?.uid && (
                                            <div className="flex gap-1 mr-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openEditModal(phrase)}
                                                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => phrase.id && handleDeletePhrase(phrase.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 group-hover:text-slate-900 group-hover:bg-[#FFCE00] transition-colors shadow-sm flex-shrink-0">
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {displayPhrases.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <Search size={24} />
                        </div>
                        <p className="text-sm text-gray-400 font-bold">찾으시는 표현이 없나요?<br />직접 추가해보세요!</p>
                    </div>
                )}
            </div>

            {/* Floating Add Button */}
            <div className="fixed bottom-24 right-6 z-40">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAddModal}
                    className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-black transition-colors"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </motion.button>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={18} className="text-gray-500" />
                            </button>

                            <div className="text-center mb-6 mt-2">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <Languages size={24} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {editId ? "표현 수정" : "새 표현 추가"}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">나만의 여행 독일어를 저장하세요</p>
                            </div>

                            <form onSubmit={handleSavePhrase} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">German</label>
                                    <div className="bg-gray-50 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                                        <input
                                            type="text" value={newDe} onChange={e => setNewDe(e.target.value)}
                                            placeholder="예: Currywurst bitte"
                                            className="w-full bg-transparent border-none px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-gray-300 placeholder:font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Korean</label>
                                    <div className="bg-gray-50 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                                        <input
                                            type="text" value={newKo} onChange={e => setNewKo(e.target.value)}
                                            placeholder="예: 커리부어스트 주세요"
                                            className="w-full bg-transparent border-none px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-gray-300 placeholder:font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Pronunciation (Optional)</label>
                                    <div className="bg-gray-50 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                                        <div className="flex items-center px-4">
                                            <Keyboard size={16} className="text-gray-400 mr-2" />
                                            <input
                                                type="text" value={newPron} onChange={e => setNewPron(e.target.value)}
                                                placeholder="예: 커리부어스트 비테 (비워두면 듣기 전용)"
                                                className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-gray-300 placeholder:font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                                >
                                    {editId ? <Pencil size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                                    {editId ? "수정 완료" : "저장하기"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}