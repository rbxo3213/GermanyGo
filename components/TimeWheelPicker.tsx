"use client";

import { useEffect, useRef, useState } from "react";

interface TimeWheelPickerProps {
    value: string; // HH:mm format (24h)
    onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")); // 01-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const AM_PM = ["오전", "오후"];

export default function TimeWheelPicker({ value, onChange }: TimeWheelPickerProps) {
    const [meridiem, setMeridiem] = useState("오전");
    const [hour, setHour] = useState("12");
    const [minute, setMinute] = useState("00");

    // Parse initial value
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(":");
            let hourInt = parseInt(h, 10);
            const isPM = hourInt >= 12;

            if (hourInt === 0) hourInt = 12;
            else if (hourInt > 12) hourInt -= 12;

            setMeridiem(isPM ? "오후" : "오전");
            setHour(hourInt.toString().padStart(2, "0"));
            setMinute(m);
        }
    }, []);

    // Update parent on change
    useEffect(() => {
        let hourInt = parseInt(hour, 10);
        if (meridiem === "오후" && hourInt !== 12) hourInt += 12;
        if (meridiem === "오전" && hourInt === 12) hourInt = 0;

        const timeString = `${hourInt.toString().padStart(2, "0")}:${minute}`;
        if (timeString !== value) {
            onChange(timeString);
        }
    }, [hour, minute, meridiem]);

    return (
        <div className="flex justify-center gap-2 h-40 overflow-hidden relative select-none">
            {/* Selection Highlight */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-10 bg-gray-100/50 rounded-lg pointer-events-none z-0" />

            {/* Meridiem Column */}
            <WheelColumn
                items={AM_PM}
                selected={meridiem}
                onSelect={setMeridiem}
                width="w-16"
            />

            {/* Hour Column */}
            <WheelColumn
                items={HOURS}
                selected={hour}
                onSelect={setHour}
                width="w-12"
            />

            {/* Separator */}
            <div className="flex items-center justify-center font-bold text-slate-400 z-10">:</div>

            {/* Minute Column */}
            <WheelColumn
                items={MINUTES}
                selected={minute}
                onSelect={setMinute}
                width="w-12"
            />
        </div>
    );
}

function WheelColumn({ items, selected, onSelect, width }: { items: string[], selected: string, onSelect: (val: string) => void, width?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 40; // matches highlight height

    const handleScroll = () => {
        if (!containerRef.current) return;
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        if (items[index] && items[index] !== selected) {
            // Provide haptic feedback if available (mobile only usually)
            if (navigator.vibrate) navigator.vibrate(5);
            onSelect(items[index]);
        }
    };

    // Auto-scroll to selected item on mount/update
    useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(selected);
            if (index !== -1) {
                containerRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: "smooth"
                });
            }
        }
    }, []); // Only initial scroll to avoid fighting user scroll

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide z-10 ${width} text-center`}
            style={{ paddingTop: "60px", paddingBottom: "60px" }} // Spacer for centering
        >
            {items.map((item) => (
                <div
                    key={item}
                    className={`h-[40px] flex items-center justify-center snap-center transition-all duration-200 ${item === selected ? "font-bold text-slate-900 scale-110" : "text-gray-400 scale-90"}`}
                >
                    {item}
                </div>
            ))}
        </div>
    );
}
