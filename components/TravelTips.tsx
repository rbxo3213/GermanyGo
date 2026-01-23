"use client";

export default function TravelTips() {
    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                {/* Left: Content */}
                <div className="p-8 md:p-12 flex-1 text-white">
                    <h2 className="text-3xl font-bold mb-8">2월 독일 여행 꿀팁</h2>

                    <div className="space-y-8">
                        {/* Tip 1 */}
                        <div className="flex gap-4">
                            <div className="text-blue-400 mt-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">날씨: 춥고 흐림 (-2°C ~ 5°C)</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    멋보다는 보온입니다. 핫팩, 장갑, 목도리 필수. 비가 자주 오니 우산보다 방수되는 모자 달린 패딩이 좋습니다.
                                </p>
                            </div>
                        </div>

                        {/* Tip 2 */}
                        <div className="flex gap-4">
                            <div className="text-yellow-400 mt-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">필수 앱: DB Navigator</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    독일 철도청 공식 앱. 실시간 연착 정보와 플랫폼 변경 확인에 필수입니다.
                                </p>
                            </div>
                        </div>

                        {/* Tip 3 */}
                        <div className="flex gap-4">
                            <div className="text-green-400 mt-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">일요일 상점 휴무</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    독일은 일요일에 마트와 상점이 모두 문을 닫습니다. 물과 간식은 토요일에 미리 사두세요. (중앙역 내 마트는 영업함)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Visual Placeholder */}
                <div className="relative w-full md:w-1/3 min-h-[300px] bg-slate-800 flex items-center justify-center">
                    <div className="text-slate-600 flex flex-col items-center">
                        <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium uppercase tracking-widest">Feb Imagery</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
