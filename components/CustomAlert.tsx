"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface CustomAlertProps {
    message: string;
    type?: "success" | "error" | "info";
    onClose: () => void;
}

export default function CustomAlert({ message, type = "info", onClose }: CustomAlertProps) {
    // Auto-close after 3 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-slate-800"
    };

    const icons = {
        success: "✅",
        error: "⚠️",
        info: "ℹ️"
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ pointerEvents: 'none' }} // Allow clicks through backdrop
            >
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

                <div
                    className={`${bgColors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] pointer-events-auto`}
                    onClick={onClose}
                >
                    <span className="text-2xl">{icons[type]}</span>
                    <p className="font-bold text-lg">{message}</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
