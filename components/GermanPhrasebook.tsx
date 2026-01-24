
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronDown, ChevronUp, Search, Bookmark, X } from "lucide-react";

type Category = "greeting" | "dining" | "shopping" | "transport" | "hotel" | "number" | "emergency";

const PHRASES: { [key in Category]: { de: string; ko: string; pron: string }[] } = {
    greeting: [
        { de: "Hallo", ko: "안녕하세요", pron: "할로" },
        { de: "Guten Morgen", ko: "좋은 아침입니다", pron: "구텐 모르겐" },
        { de: "Guten Tag", ko: "안녕하세요 (낮)", pron: "구텐 탁" },
        { de: "Guten Abend", ko: "안녕하세요 (저녁)", pron: "구텐 아벤트" },
        { de: "Danke schön", ko: "감사합니다", pron: "당케 쉔" },
        { de: "Bitte sehr", ko: "천만에요 / 여기요", pron: "비테 제어" },
        { de: "Entschuldigung", ko: "실례합니다", pron: "엔트슐디궁" },
        { de: "Es tut mir leid", ko: "미안합니다", pron: "에스 투트 미어 라이트" },
        { de: "Tschüss", ko: "안녕히 가세요 (캐주얼)", pron: "츄-스" },
        { de: "Auf Wiedersehen", ko: "안녕히 계세요 (격식)", pron: "아우프 비더젠" },
        { de: "Ja / Nein", ko: "네 / 아니요", pron: "야 / 나인" },
        { de: "Ich heiße...", ko: "제 이름은 ...입니다", pron: "이히 하이쎄..." },
        { de: "Freut mich", ko: "반갑습니다", pron: "프로이트 미히" },
    ],
    dining: [
        { de: "Einen Tisch für zwei, bitte", ko: "두 명 자리 주세요", pron: "아이넨 티슈 퓌어 쯔바이 비테" },
        { de: "Die Speisekarte, bitte", ko: "메뉴판 주세요", pron: "디 슈파이제카르테 비테" },
        { de: "Ich hätte gern...", ko: "...를 주세요", pron: "이히 헤테 게른..." },
        { de: "Haben Sie eine englische Karte?", ko: "영어 메뉴판 있나요?", pron: "하벤 지 아이네 엥글리쉐 카르테?" },
        { de: "Wasser ohne Kohlensäure", ko: "탄산 없는 물 주세요", pron: "바서 오네 콜렌조이레" },
        { de: "Leitungswasser", ko: "수돗물 (무료 물)", pron: "라이퉁스바서" },
        { de: "Bier vom Fass", ko: "생맥주", pron: "비어 폼 파스" },
        { de: "Die Rechnung, bitte", ko: "계산서 주세요", pron: "디 레히눙 비테" },
        { de: "Zusammen / Getrennt", ko: "같이 / 따로 계산할게요", pron: "쭈잠멘 / 게트렌트" },
        { de: "Ist das scharf?", ko: "이거 매운가요?", pron: "이스트 다스 샤르프?" },
        { de: "Lecker!", ko: "맛있어요!", pron: "레커!" },
        { de: "Guten Appetit", ko: "맛있게 드세요", pron: "구텐 아페티트" },
        { de: "Wo ist die Toilette?", ko: "화장실이 어디인가요?", pron: "보 이스트 디 토일레테?" },
    ],
    shopping: [
        { de: "Wie viel kostet das?", ko: "얼마인가요?", pron: "비 필 코스테트 다스?" },
        { de: "Kann ich mit Karte zahlen?", ko: "카드로 계산되나요?", pron: "칸 이히 미트 카르테 짤렌?" },
        { de: "Nur Bargeld", ko: "현금만 가능합니다", pron: "누어 바르겔트" },
        { de: "Haben Sie...", ko: "...있나요?", pron: "하벤 지...?" },
        { de: "Ich schaue nur", ko: "그냥 구경하는 중이에요", pron: "이히 샤우어 누어" },
        { de: "Das ist zu teuer", ko: "너무 비싸요", pron: "다스 이스트 쭈 토이어" },
        { de: "Haben Sie das in einer anderen Größe?", ko: "다른 사이즈 있나요?", pron: "하벤 지 다스 인 아이너 안데렌 그뢰쎄?" },
        { de: "Öffnungszeiten", ko: "운영 시간", pron: "외프눙스짜이텐" },
        { de: "Ausverkauf", ko: "세일 / 품절", pron: "아우스페어카우프" },
    ],
    transport: [
        { de: "Wo ist der Bahnhof?", ko: "기차역이 어디인가요?", pron: "보 이스트 데어 반호프?" },
        { de: "Eine Fahrkarte nach...", ko: "...행 표 한 장 주세요", pron: "아이나 파르카르테 나흐..." },
        { de: "Wann fährt der Zug?", ko: "기차 언제 출발하나요?", pron: "반 페어트 데어 쭉?" },
        { de: "Hält dieser Zug in...?", ko: "이 기차가 ...에 서나요?", pron: "헬트 디저 쭉 인...?" },
        { de: "Eingang / Ausgang", ko: "입구 / 출구", pron: "아인강 / 아우스강" },
        { de: "S-Bahn / U-Bahn", ko: "지상철 / 지하철", pron: "에스반 / 우반" },
        { de: "Haltestelle", ko: "정류장", pron: "할테슈텔레" },
        { de: "Geradeaus", ko: "직진", pron: "게라데아우스" },
        { de: "Links / Rechts", ko: "왼쪽 / 오른쪽", pron: "링크스 / 레흐츠" },
    ],
    hotel: [
        { de: "Ich habe eine Reservierung", ko: "예약했습니다", pron: "이히 하베 아이네 레저비어룽" },
        { de: "Haben Sie ein Zimmer frei?", ko: "빈 방 있나요?", pron: "하벤 지 아인 찜머 프라이?" },
        { de: "Frühstück inklusive?", ko: "아침 식사 포함인가요?", pron: "프류슈튁 인클루지브?" },
        { de: "WLAN Passwort", ko: "와이파이 비밀번호", pron: "베-란 파스보르트" },
        { de: "Können Sie ein Taxi rufen?", ko: "택시 불러주실 수 있나요?", pron: "쾨넨 지 아인 택시 루펜?" },
        { de: "Gepäck aufbewahren", ko: "짐 보관", pron: "게펙 아우프베바렌" },
    ],
    number: [
        { de: "Eins", ko: "1", pron: "아인스" },
        { de: "Zwei", ko: "2", pron: "쯔바이" },
        { de: "Drei", ko: "3", pron: "드라이" },
        { de: "Vier", ko: "4", pron: "피어" },
        { de: "Fünf", ko: "5", pron: "퓐프" },
        { de: "Sechs", ko: "6", pron: "젝스" },
        { de: "Sieben", ko: "7", pron: "지벤" },
        { de: "Acht", ko: "8", pron: "아흐트" },
        { de: "Neun", ko: "9", pron: "노인" },
        { de: "Zehn", ko: "10", pron: "쩬" },
        { de: "Zwanzig", ko: "20", pron: "쯔반찌히" },
        { de: "Hundert", ko: "100", pron: "훈데르트" },
    ],
    emergency: [
        { de: "Hilfe!", ko: "도와주세요!", pron: "힐페!" },
        { de: "Ich brauche einen Arzt", ko: "의사가 필요해요", pron: "이히 브라우헤 아이넨 아르츠트" },
        { de: "Rufen Sie die Polizei", ko: "경찰을 불러주세요", pron: "루펜 지 디 폴리짜이" },
        { de: "Ich habe mich verlaufen", ko: "길을 잃었어요", pron: "이히 하베 미히 페어라우펜" },
        { de: "Ich habe meinen Pass verloren", ko: "여권을 잃어버렸어요", pron: "이히 하베 마이넨 파스 페어로렌" },
        { de: "Apotheke", ko: "약국", pron: "아포테케" },
        { de: "Krankenhaus", ko: "병원", pron: "크랑켄하우스" },
    ],
};

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
    { id: "greeting", label: "인사", icon: "👋" },
    { id: "dining", label: "식당", icon: "🍽️" },
    { id: "shopping", label: "쇼핑", icon: "🛍️" },
    { id: "transport", label: "교통", icon: "🚌" },
    { id: "hotel", label: "숙소", icon: "🛏️" },
    { id: "number", label: "숫자", icon: "🔢" },
    { id: "emergency", label: "응급", icon: "🚨" },
];

export default function GermanPhrasebook() {
    const [activeCat, setActiveCat] = useState<Category>("greeting");
    const [searchTerm, setSearchTerm] = useState("");

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "de-DE";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // Flatten logic for search
    const getFilteredPhrases = () => {
        const query = searchTerm.toLowerCase();

        // 1. Search Mode: Search ALL categories
        if (query.trim().length > 0) {
            const results: { category: string; de: string; ko: string; pron: string }[] = [];

            (Object.keys(PHRASES) as Category[]).forEach(cat => {
                const matches = PHRASES[cat].filter(p =>
                    p.de.toLowerCase().includes(query) ||
                    p.ko.includes(query) ||
                    p.pron.includes(query)
                );
                // Add simplified category label
                const label = CATEGORIES.find(c => c.id === cat)?.label || "";
                matches.forEach(m => results.push({ ...m, category: label }));
            });
            return results;
        }

        // 2. Category Mode
        return PHRASES[activeCat].map(p => ({ ...p, category: "" }));
    };

    const displayPhrases = getFilteredPhrases();

    return (
        <div className="w-full max-w-md mx-auto pb-24 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-slate-900 mb-2">🇩🇪 여행 독일어</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="표현 검색 (예: 화장실, 맥주)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 rounded-2xl pl-11 pr-10 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:font-medium"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3.5 text-gray-400 hover:text-slate-900">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories (Hide in Search Mode) */}
            <AnimatePresence>
                {!searchTerm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="overflow-x-auto px-1 -mx-4 pb-2 scrollbar-hide">
                            <div className="flex px-4 gap-3 w-max">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCat(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border
                                            ${activeCat === cat.id
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"}`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Result Info */}
            {searchTerm && (
                <div className="px-2 text-xs font-bold text-gray-400 flex justify-between items-center">
                    <span>전체 카테고리 검색 결과</span>
                    <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full">{displayPhrases.length}개</span>
                </div>
            )}

            {/* List */}
            <div className="space-y-3 px-1">
                <AnimatePresence mode="popLayout">
                    {displayPhrases.map((phrase, idx) => (
                        <motion.div
                            layout
                            key={phrase.de + idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }} // Faster stagger
                            onClick={() => speak(phrase.de)}
                            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer group hover:border-slate-300 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{phrase.de}</h3>
                                        {phrase.category && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                                                {phrase.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-[#FFCE00] mb-2">{phrase.pron}</p>
                                    <p className="text-sm text-gray-500 font-medium">{phrase.ko}</p>
                                </div>
                                <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 group-hover:text-slate-900 group-hover:bg-[#FFCE00] transition-colors shadow-sm">
                                    <Volume2 size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {displayPhrases.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <Search size={32} />
                        </div>
                        <p className="text-gray-400 font-bold">검색 결과가 없습니다 😢</p>
                    </div>
                )}
            </div>
        </div>
    );
}
