"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import CustomAlert from "./CustomAlert";

export default function LoginModal() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const { login, signup, error: authError } = useAuth();
    const [loading, setLoading] = useState(false);

    // Alert State
    const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

    // Watch for Auth Errors from Hook
    useEffect(() => {
        if (authError) {
            setAlert({ msg: authError, type: "error" });
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                // Success is handled by auth state change (modal unmounts)
            } else {
                if (!nickname.trim()) throw new Error("닉네임을 입력해주세요.");
                await signup(email, password, nickname);
                setAlert({ msg: "가입 확인 메일이 발송되었습니다.\n메일함(스팸함)을 확인해주세요!", type: "success" });
            }
        } catch (err: any) {
            console.error(err);
            setAlert({ msg: err.message || "오류가 발생했습니다.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-6">
            {alert && (
                <CustomAlert
                    message={alert.msg}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Minimal Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center gap-1 mb-4">
                        <div className="w-10 h-1.5 bg-black rounded-full"></div>
                        <div className="w-10 h-1.5 bg-[#DD0000] rounded-full"></div>
                        <div className="w-10 h-1.5 bg-[#FFCE00] rounded-full"></div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tighter mb-2 text-slate-900">
                        Germa-Niche
                    </h1>
                    <p className="text-gray-500 font-medium tracking-wide text-sm">
                        독일 여행의 모든 순간
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            <input
                                type="text"
                                required={!isLogin}
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                placeholder="닉네임"
                            />
                        </motion.div>
                    )}

                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        placeholder="이메일"
                    />

                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        placeholder="비밀번호"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                    >
                        {loading ? "잠시만요..." : (isLogin ? "시작하기" : "회원가입")}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setAlert(null);
                        }}
                        className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors"
                    >
                        {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
