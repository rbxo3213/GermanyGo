"use client";

import { Map, Train, Calendar, BookOpen, NotebookPen, MessageCircle } from "lucide-react";

type Tab = "guide" | "memo" | "itinerary" | "transport" | "map";

interface BottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const navItems = [
        { id: "guide", label: "가이드", icon: BookOpen },
        { id: "memo", label: "메모", icon: NotebookPen },
        { id: "itinerary", label: "일정", icon: Calendar },
        { id: "transport", label: "이동", icon: Train },
        { id: "map", label: "지도", icon: Map },
    ] as const;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-6 pt-3 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <nav className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 w-14 p-1 group relative`}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <span className="absolute -top-3 w-8 h-1 bg-black rounded-full" />
                            )}

                            <Icon
                                size={24}
                                className={`transition-colors duration-300 ${isActive ? "text-black" : "text-gray-300 group-hover:text-gray-500"}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? "text-black" : "text-gray-400"}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
            {/* Safe Area Spacer for iPhone 13 Pro is handled by pb-6, but we can verify later */}
        </div>
    );
}
