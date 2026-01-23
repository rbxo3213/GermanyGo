"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Update Data to match Full Schedule (Feb 6 - Feb 16)
const itinerarySegments = [
    {
        id: "leg1",
        period: "2/6 - 2/8",
        route: "Frankfurt → Nuremberg",
        transport: "ICE (고속열차)",
        duration: "약 2시간",
        description: "독일 여행의 시작입니다. 3인 여행이므로 슈퍼세이버(Super Sparpreis) 티켓을 미리 예약하면 저렴합니다. 가장 빠르고 편안한 구간입니다.",
        tip: "Travel Tip: 뷔르츠부르크(Würzburg)를 지날 때 창밖으로 보이는 포도밭 풍경이 아름답습니다. 오른쪽 좌석을 추천합니다.",
        link: "https://bahn.com",
        recommended: true,
    },
    {
        id: "leg2",
        period: "2/8 - 2/10",
        route: "Nuremberg → Prague",
        transport: "FlixBus (버스)",
        duration: "약 3시간 50분",
        description: "이 구간은 기차보다 버스가 핵심입니다. 기차는 환승이 잦고 느립니다. DB IC Bus 혹은 FlixBus 직행을 타세요. 가격도 훨씬 저렴합니다.",
        tip: "Travel Tip: 뉘른베르크 버스 터미널(ZOB)은 중앙역 바로 옆에 있습니다. 프라하 도착 시 'Florenc' 역이 아닌 'Main Station'에 내리는 게 시내 접근성이 좋습니다.",
        link: "https://flixbus.com",
        recommended: true,
    },
    {
        id: "leg3",
        period: "2/10 - 2/12",
        route: "Prague → Berlin",
        transport: "EC (유로시티)",
        duration: "약 4시간 15분",
        description: "프라하에서 베를린으로 가는 기차는 엘베 강변을 따라 달리는 유럽 최고의 기차 뷰 중 하나입니다. 식당칸에서 체코 맥주를 마시며 이동해보세요.",
        tip: "Travel Tip: 반드시 'Elbe River' 뷰(진행 방향 오른쪽)를 예약하세요. 풍경이 정말 예술입니다.",
        link: "https://cd.cz",
        recommended: true,
    },
    {
        id: "leg4",
        period: "2/12 - 2/14",
        route: "Berlin → Hamburg",
        transport: "ICE (고속열차)",
        duration: "약 1시간 45분",
        description: "독일의 수도에서 제2의 도시로 이동합니다. 배차 간격이 매우 촘촘(30분 단위)하여 일정 짜기가 수월합니다.",
        tip: "Travel Tip: 함부르크에 도착하면 'Miniatur Wunderland' 예약 시간에 맞춰 이동하세요. 중앙역에서 버스로 15분 거리입니다.",
        link: "https://bahn.com",
        recommended: false,
    },
    {
        id: "leg5",
        period: "2/14 - 2/16",
        route: "Hamburg → Cologne",
        transport: "ICE or IC",
        duration: "약 4시간",
        description: "귀국 전 마지막 여정입니다. 쾰른 대성당 바로 앞 역에 도착합니다. 시간이 넉넉하다면 IC(완행급 급행)를 타고 라인강변을 따라갈 수도 있습니다.",
        tip: "Travel Tip: 쾰른 역에 내리자마자 보이는 대성당의 압도적인 뷰를 놓치지 마세요. 짐 보관소는 1층에 있습니다.",
        link: "https://bahn.com",
        recommended: false,
    },
];

interface Props {
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function ItineraryTabs({ activeTab, onTabChange }: Props) {
    const activeSegment = itinerarySegments.find((seg) => seg.id === activeTab);

    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            {/* 2. Navigation Tabs */}
            <div className="flex overflow-x-auto no-scrollbar scroll-smooth border-b border-gray-200">
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        <span>{activeSegment.transport}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Clock Icon */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
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

                                {/* Action Link */}
                                <a
                                    href={activeSegment.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                >
                                    <span>DB/예매 사이트에서 시간표 확인하기</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>

                            {/* Right Column: Visual Placeholder */}
                            <div className="hidden md:block h-auto">
                                <div className="bg-slate-200 rounded-xl h-full min-h-[300px] w-full flex items-center justify-center relative overflow-hidden group">
                                    <div className="text-center text-gray-400">
                                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
