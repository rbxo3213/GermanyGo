"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "todo" | "wishlist" | "goals";

interface Item {
    id: number;
    text: string;
    completed: boolean;
}

export default function MemoPad() {
    const [activeTab, setActiveTab] = useState<Tab>("todo");
    const [items, setItems] = useState<{ [key in Tab]: Item[] }>({
        todo: [
            { id: 1, text: "Buy SIM card (O2 or Telekom)", completed: false },
            { id: 2, text: "Pack Universal Adapter", completed: true },
        ],
        wishlist: [
            { id: 3, text: "Rimowa Hybrid Cabin S", completed: false },
            { id: 4, text: "Dm Drugstore Vitamin Haul", completed: false },
        ],
        goals: [
            { id: 5, text: "Drink 1L Mass Beer at Hofbräuhaus", completed: false },
            { id: 6, text: "Selfie at East Side Gallery", completed: false },
        ],
    });

    const toggleItem = (tab: Tab, id: number) => {
        setItems((prev) => ({
            ...prev,
            [tab]: prev[tab].map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            ),
        }));
    };

    return (
        <div className="bg-white/50 backdrop-blur-md border border-gray-100 rounded-3xl p-6 shadow-sm w-full max-w-md mx-auto">
            {/* Tabs */}
            <div className="flex justify-between mb-6 relative">
                {(["todo", "wishlist", "goals"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? "text-blue-600" : "text-gray-400"
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="underline"
                                className="absolute left-0 right-0 bottom-0 h-[2px] bg-blue-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                    <motion.ul
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        {items[activeTab].map((item) => (
                            <motion.li
                                key={item.id}
                                onClick={() => toggleItem(activeTab, item.id)}
                                className="flex items-center gap-3 cursor-pointer group"
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.completed
                                            ? "bg-blue-500 border-blue-500"
                                            : "border-gray-300 group-hover:border-blue-400"
                                        }`}
                                >
                                    {item.completed && (
                                        <svg
                                            className="w-4 h-4 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <span
                                    className={`text-lg font-medium transition-all ${item.completed ? "text-gray-300 line-through" : "text-gray-800"
                                        }`}
                                >
                                    {item.text}
                                </span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </AnimatePresence>
            </div>
        </div>
    );
}
