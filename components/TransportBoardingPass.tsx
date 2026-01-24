
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Train, Bus, ArrowRight, QrCode, Clock, MapPin, Calendar } from "lucide-react";

// Mock Data based on previous Itinerary
const TICKETS = [
    {
        id: "leg1",
        from: "Frankfurt",
        fromCode: "FRA",
        to: "Nuremberg",
        toCode: "NUE",
        date: "Feb 06",
        time: "10:30",
        duration: "2h 05m",
        transport: "ICE 221",
        seat: "Coach 21, Seat 42",
        platform: "Platform 6",
        color: "bg-white border-t-8 border-[#EC1B2D]", // DB Red
        icon: <Train className="text-[#EC1B2D]" />,
        provider: "Deutsche Bahn"
    },
    {
        id: "leg2",
        from: "Nuremberg",
        fromCode: "NUE",
        to: "Prague",
        toCode: "PRG",
        date: "Feb 08",
        time: "14:15",
        duration: "3h 50m",
        transport: "DB IC Bus",
        seat: "Seat 12A",
        platform: "ZOB Steig 9",
        color: "bg-white border-t-8 border-[#73D743]", // FlixBus Green-ish
        icon: <Bus className="text-[#73D743]" />,
        provider: "FlixBus / DB Bus"
    },
    {
        id: "leg3",
        from: "Prague",
        fromCode: "PRG",
        to: "Berlin",
        toCode: "BER",
        date: "Feb 10",
        time: "08:26",
        duration: "4h 15m",
        transport: "EC 172",
        seat: "Coach 260, Seat 65",
        platform: "Platform 3J",
        color: "bg-white border-t-8 border-[#1D4E89]", // CD Blue
        icon: <Train className="text-[#1D4E89]" />,
        provider: "České dráhy"
    },
    {
        id: "leg4",
        from: "Berlin",
        fromCode: "BER",
        to: "Hamburg",
        toCode: "HAM",
        date: "Feb 12",
        time: "09:38",
        duration: "1h 45m",
        transport: "ICE 802",
        seat: "Coach 7, Seat 92",
        platform: "Platform 13",
        color: "bg-white border-t-8 border-[#EC1B2D]",
        icon: <Train className="text-[#EC1B2D]" />,
        provider: "Deutsche Bahn"
    },
    {
        id: "leg5",
        from: "Hamburg",
        fromCode: "HAM",
        to: "Cologne",
        toCode: "CGN",
        date: "Feb 14",
        time: "11:46",
        duration: "4h 02m",
        transport: "IC 2021",
        seat: "Free Seating",
        platform: "Platform 8",
        color: "bg-white border-t-8 border-[#EC1B2D]",
        icon: <Train className="text-[#EC1B2D]" />,
        provider: "Deutsche Bahn"
    }
];

export default function TransportBoardingPass() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextTicket = () => {
        if (currentIndex < TICKETS.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevTicket = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    return (
        <div className="w-full max-w-sm mx-auto py-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 px-4">My Wallet</h2>

            <div className="relative h-[500px] w-full flex items-center justify-center perspective-1000">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, rotateX: -15, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, rotateX: 15, y: -50, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                        className={`w-[90%] absolute rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden ${TICKETS[currentIndex].color}`}
                    >
                        {/* Top Section: Flight/Train Info */}
                        <div className="p-6 pb-0">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                    {TICKETS[currentIndex].icon}
                                    <span>{TICKETS[currentIndex].provider}</span>
                                </div>
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-extrabold">
                                    {TICKETS[currentIndex].transport}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <div className="text-left">
                                    <span className="block text-4xl font-black text-slate-900">{TICKETS[currentIndex].fromCode}</span>
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{TICKETS[currentIndex].from}</span>
                                </div>
                                <div className="flex flex-col items-center px-4">
                                    <span className="text-xs font-bold text-gray-300 mb-1">{TICKETS[currentIndex].duration}</span>
                                    <div className="w-24 h-[2px] bg-gray-200 relative">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full" />
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rounded-full" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-4xl font-black text-slate-900">{TICKETS[currentIndex].toCode}</span>
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{TICKETS[currentIndex].to}</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Details */}
                        <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50/50">
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Date</span>
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Calendar size={16} />
                                    {TICKETS[currentIndex].date}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Time</span>
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Clock size={16} />
                                    {TICKETS[currentIndex].time}
                                </div>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl shadow-sm col-span-2 flex justify-between items-center text-white">
                                <div>
                                    <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Seat</span>
                                    <span className="font-bold">{TICKETS[currentIndex].seat}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Platform</span>
                                    <span className="font-bold text-[#FFCE00]">{TICKETS[currentIndex].platform}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dashed Divider */}
                        <div className="relative flex items-center justify-between px-4">
                            <div className="w-6 h-6 rounded-full bg-slate-50 -ml-7 shadow-inner"></div>
                            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-50 -mr-7 shadow-inner"></div>
                        </div>

                        {/* Bottom Section: QR */}
                        <div className="p-6 bg-white flex flex-col items-center justify-center pt-2">
                            <QrCode size={120} className="text-slate-900 opacity-90" />
                            <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                Scan at Gate
                            </p>
                            <p className="text-xs font-mono text-gray-300 mt-1">AX-9928-1102</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center px-8 mt-4">
                <button
                    onClick={prevTicket}
                    disabled={currentIndex === 0}
                    className="p-4 rounded-full bg-white shadow-sm border border-gray-100 disabled:opacity-30 active:scale-95 transition-all text-slate-900"
                >
                    <ArrowRight size={24} className="rotate-180" />
                </button>

                <div className="flex gap-2">
                    {TICKETS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-slate-900 w-6" : "bg-gray-200"}`}
                        />
                    ))}
                </div>

                <button
                    onClick={nextTicket}
                    disabled={currentIndex === TICKETS.length - 1}
                    className="p-4 rounded-full bg-white shadow-sm border border-gray-100 disabled:opacity-30 active:scale-95 transition-all text-slate-900"
                >
                    <ArrowRight size={24} />
                </button>
            </div>
        </div>
    );
}
