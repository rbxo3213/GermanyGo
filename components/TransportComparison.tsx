"use client";

export default function TransportComparison() {
    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">교통권, 무엇을 사야 할까요?</h2>
                    <p className="text-gray-500 mt-1">49유로 티켓? 유레일? 구간권? 명쾌하게 정리해드립니다.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Option 1: Super Sparpreis (Recommended) */}
                <div className="border-2 border-green-500 rounded-2xl p-6 relative bg-white shadow-sm overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase">
                        추천 1순위
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                        구간권 예매 (Super Sparpreis)
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        지금 당장 DB 앱에서 예약한다면 가장 저렴할 수 있습니다. 2주 전이라 'Super Sparpreis' 특가표가 남아있을지 확인이 필요합니다.
                    </p>

                    <ul className="space-y-2 text-sm mb-8">
                        <li className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>미리 예약 시 가장 저렴 (전체 약 €150~200 예상)</span>
                        </li>
                        <li className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            <span>시간 변경 불가 (지정된 기차만 탑승)</span>
                        </li>
                    </ul>

                    <a href="https://www.bahn.com/en" target="_blank" className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
                        DB 가격 조회하기
                    </a>
                </div>

                {/* Option 2: Eurail Pass */}
                <div className="border border-blue-200 rounded-2xl p-6 relative bg-white shadow-sm">
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-bl-xl">
                        안전한 선택
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                        유레일 글로벌 패스 (5일권)
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        구간권 가격이 너무 올랐다면 이 패스가 정답입니다. 독일+체코 국경 상관없이 자유롭게 탑승 가능합니다.
                    </p>

                    <ul className="space-y-2 text-sm mb-8">
                        <li className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <span>시간/일정 변경 자유로움</span>
                        </li>
                        <li className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>약 €280 (만 27세 이하 청소년 할인 시 더 저렴)</span>
                        </li>
                        <li className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>필수 예약 구간(프라하행 등) 예약비 별도</span>
                        </li>
                    </ul>

                    <a href="https://www.eurail.com" target="_blank" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                        유레일 가격 확인
                    </a>
                </div>
            </div>

            {/* Warning Box */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 flex flex-col md:flex-row gap-4 items-start">
                <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <div>
                    <h4 className="text-orange-900 font-bold mb-1">Q. 49유로 티켓(Deutschland-Ticket)은 어때요?</h4>
                    <p className="text-orange-800 text-sm leading-relaxed">
                        <span className="font-bold">비추천합니다.</span> 49유로 티켓은 고속열차(ICE/IC/EC)를 탈 수 없고 오직 완행열차(RE/RB)만 가능합니다.
                        프랑크푸르트-뉘른베르크 구간을 완행으로 가면 이동 시간이 2배 이상 걸리며,
                        <span className="underline decoration-orange-400 decoration-2 underline-offset-2 mx-1">독일-체코 국경 이동 시에는 유효하지 않아</span> 추가 티켓을 사야 합니다.
                        짧은 10일 여행에서 길에 시간을 버리지 마세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
