"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SettingsContextType {
    dataSaver: boolean;
    toggleDataSaver: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [dataSaver, setDataSaver] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("dataSaver");
        if (saved) {
            setDataSaver(JSON.parse(saved));
        }
        setLoaded(true);
    }, []);

    const toggleDataSaver = () => {
        setDataSaver(prev => {
            const next = !prev;
            localStorage.setItem("dataSaver", JSON.stringify(next));
            return next;
        });
    };

    if (!loaded) return null;

    return (
        <SettingsContext.Provider value={{ dataSaver, toggleDataSaver }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
}
