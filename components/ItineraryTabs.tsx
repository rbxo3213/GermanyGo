"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Upload, X, Loader2, Image as ImageIcon, QrCode, Clock, Train } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, query } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

// New 12-Day Schedule Data
const itinerarySegments = [
    {
        id: "leg1",
        period: "2/6 (금) - 2/8 (일)",
        route: "Frankfurt → Nuremberg",
        transport: "ICE 927",
        duration: "18:17 - 20:45",
        description: "독일 도착 후 첫 이동입니다. 프랑크푸르트 공항 장거리 역(Fernbf)에서 탑승하여 뉘른베르크 중앙역으로 이동합니다.",
        tip: "예약 번호: 319008601019 | 공항역 플랫폼 확인 필수",
        link: "https://bahn.com",
        recommended: true,
    },
    {
        id: "leg2",
        period: "2/8 (일) - 2/10 (화)",
        route: "Nuremberg → Prague",
        transport: "FlixBus N109",
        duration: "09:10 - 12:45",
        description: "뉘른베르크 ZOB에서 출발하여 프라하 Na Knížecí로 이동합니다. 버스 여행입니다.",
        tip: "예약 번호: 332 403 1092 | 도착역: Na Knížecí",
        link: "https://flixbus.com",
        recommended: true,
    },
    {
        id: "leg3",
        period: "2/10 (화) - 2/12 (목)",
        route: "Prague → Berlin",
        transport: "RegioJet Bus",
        duration: "08:30 - 13:00",
        description: "프라하 플로렌스(Florenc) 터미널 출발, 베를린 ZOB 도착.",
        tip: "티켓 번호: 6087503310 | 베를린 ZOB 하차",
        link: "https://regiojet.com",
        recommended: true,
    },
    {
        id: "leg4",
        period: "2/12 (목) - 2/14 (토)",
        route: "Berlin → Hamburg",
        transport: "FlixBus 050",
        duration: "08:15 - 11:30",
        description: "베를린 ZOB에서 출발하여 함부르크 ZOB로 이동합니다.",
        tip: "예약 번호: 332 415 8061 | 약 3시간 15분 소요",
        link: "https://flixbus.com",
        recommended: false,
    },
    {
        id: "leg5",
        period: "2/14 (토) - 2/16 (월)",
        route: "Hamburg → Dusseldorf",
        transport: "FlixTrain FLX20",
        duration: "08:50 - 12:30",
        description: "함부르크 중앙역 출발, 뒤셀도르프 중앙역 도착. 기차 여행입니다.",
        tip: "예약 번호: 332 402 6999 | 중앙역 승강장 확인",
        link: "https://flixtrain.com",
        recommended: false,
    },
    {
        id: "leg6",
        period: "2/16 (월) - 귀국",
        route: "Dusseldorf → Cologne → FRA",
        transport: "ICE 513 / ICE",
        duration: "07:26 - 18:00 (귀국)",
        description: "뒤셀도르프 → 쾰른(관광) → 프랑크푸르트 공항 → 인천 귀국 일정입니다.",
        tip: "쾰른행 예약: 928207388650 | 공항행 예약: 483759370948",
        link: "https://bahn.com",
        recommended: true,
    },
];

interface Props {
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function ItineraryTabs({ activeTab, onTabChange }: Props) {
    const { user } = useAuth();
    const activeSegment = itinerarySegments.find((seg) => seg.id === activeTab);

    // Ticket Logic
    const [tickets, setTickets] = useState<{ [key: string]: string }>({});
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [uploadingTicket, setUploadingTicket] = useState(false);

    useEffect(() => {
        if (!user) return;
        // Query only tickets belonging to the current user
        const q = query(collection(db, "personal_tickets")); // We will filter client side or use composite ID for simple fetching
        // actually for simplicity/speed let's just fetch all in collection and filter, 
        // OR better: since we want to show ALL segments' tickets for THIS user, let's query where uid == user.uid
        // But Firestroe requires index for that usually. 
        // Let's use specific listener for *this user's* tickets if possible? 
        // Easiest without index: Listen to collection, filter client side (assuming low volume) OR 
        // Use composite keys and just fetch? No we need real-time updates.
        // Let's try `where("uid", "==", user.uid)` - if index needed it will error in console, but for small app might be ok or we fix it.
        // SAFE BET: Listen to all, filter by ID pattern or uid field client side. 
        // Given existing code structure, let's stick to client filter for robustness without index generation steps.

        const unsubscribe = onSnapshot(collection(db, "personal_tickets"), (snapshot) => {
            const ticketMap: { [key: string]: string } = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Check if this ticket belongs to the user
                if (data.uid === user.uid) {
                    // doc.id is assumed to be `${user.uid}_${segmentId}`
                    // We need to extract segmentId to map it correctly
                    // Or we can store segmentId in the document.
                    if (data.segmentId) {
                        ticketMap[data.segmentId] = data.imageUrl;
                    }
                }
            });
            setTickets(ticketMap);
        });
        return () => unsubscribe();
    }, [user]);

    const handleTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !activeSegment) return;
        const file = e.target.files[0];
        setUploadingTicket(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                if (!user) return;

                const docId = `${user.uid}_${activeSegment.id}`;
                await setDoc(doc(db, "personal_tickets", docId), {
                    uid: user.uid,
                    segmentId: activeSegment.id,
                    imageUrl: base64,
                    updatedAt: new Date().toISOString()
                });
                setUploadingTicket(false);
            };
        } catch (error) {
            console.error("Ticket upload failed", error);
            setUploadingTicket(false);
        }
    };

    const activeTicket = activeSegment ? tickets[activeSegment.id] : null;

    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            {/* 2. Navigation Tabs */}
            <div className="flex overflow-x-auto no-scrollbar scroll-smooth border-b border-gray-200 touch-pan-x">
                {itinerarySegments.map((segment) => {
                    const isActive = activeTab === segment.id;
                    return (
                        <button
                            key={segment.id}
                            onClick={() => onTabChange(segment.id)}
                            className={`
                relative px-5 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap min-w-[140px]
                border-t border-l border-r rounded-t-xl -mb-[1px]
                ${isActive
                                    ? "bg-white border-gray-200 text-blue-600 z-10"
                                    : "bg-gray-50 border-transparent text-gray-400 hover:text-gray-600"
                                }
              `}
                        >
                            {/* Blue Top Highlight for Active Tab */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabHighlight"
                                    className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-xl"
                                />
                            )}
                            <span className="block text-xs font-normal opacity-80 mb-1">{segment.period}</span>
                            {segment.route.split("→")[1]?.trim()} 행
                        </button>
                    );
                })}
            </div>

            {/* 3. Content Card */}
            <div className="bg-white border border-gray-200 rounded-b-2xl rounded-tr-2xl shadow-sm p-6 md:p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeSegment && (
                        <motion.div
                            key={activeSegment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            {/* Left Column: Info */}
                            <div className="space-y-6">
                                {/* Badge */}
                                {activeSegment.recommended && (
                                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        RECOMMENDED
                                    </span>
                                )}

                                {/* Heading */}
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                        {activeSegment.route.split("→")[0]}
                                        <span className="text-gray-300">→</span>
                                        {activeSegment.route.split("→")[1]}
                                    </h3>
                                </div>

                                {/* Transport Info */}
                                <div className="flex items-center gap-6 text-gray-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        {/* Train Icon */}
                                        <Train className="w-5 h-5" />
                                        <span>{activeSegment.transport}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Clock Icon */}
                                        <Clock className="w-5 h-5" />
                                        <span>{activeSegment.duration}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {activeSegment.description}
                                </p>

                                {/* ★ The 'Travel Tip' Box (Crucial) */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        {/* Lightbulb Icon */}
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-yellow-800 text-sm mb-1">Travel Tip</h4>
                                        <p className="text-yellow-900 text-sm leading-snug opacity-90">
                                            {activeSegment.tip.replace("Travel Tip:", "").trim()}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setIsTicketModalOpen(true)}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                                    >
                                        <QrCode size={18} />
                                        {activeTicket ? "티켓/QR 확인" : "티켓 등록"}
                                    </button>

                                    <a
                                        href={activeSegment.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        <span>예매 사이트</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Right Column: Visual Placeholder or Ticket Preview */}
                            <div className="hidden md:block h-auto">
                                <div
                                    onClick={() => setIsTicketModalOpen(true)}
                                    className="bg-slate-100 rounded-xl h-full min-h-[300px] w-full flex items-center justify-center relative overflow-hidden group border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    {activeTicket ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={activeTicket} alt="Ticket" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <span className="text-sm font-medium">티켓이 없습니다<br />클릭하여 등록</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Ticket Modal */}
            <AnimatePresence>
                {isTicketModalOpen && activeSegment && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Ticket size={20} />
                                    티켓 & QR
                                </h3>
                                <button onClick={() => setIsTicketModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
                            </div>

                            <div className="bg-slate-100 rounded-2xl min-h-[300px] flex items-center justify-center mb-6 overflow-hidden relative border border-slate-200">
                                {activeTicket ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={activeTicket} alt="Ticket" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center text-gray-400 p-8">
                                        <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-sm font-medium leading-relaxed">
                                            티켓 이미지나 QR코드를<br />여기에 등록해두세요.
                                        </p>
                                    </div>
                                )}

                                {uploadingTicket && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-slate-900" size={32} />
                                    </div>
                                )}
                            </div>

                            <label className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-black transition-colors">
                                <Upload size={18} />
                                {activeTicket ? "티켓 이미지 변경" : "티켓 이미지 업로드"}
                                <input type="file" accept="image/*" className="hidden" onChange={handleTicketUpload} />
                            </label>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
