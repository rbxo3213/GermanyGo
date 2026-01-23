"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

export default function LoginModal() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, signup, error: authError } = useAuth();
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
                setSuccessMsg("가입 확인 메일이 발송되었습니다. \n이메일 인증 후 다시 로그인해주세요.");
            }
        } catch (err: any) {
            console.error(err);
            // useAuth sets its own error state, but we can also set local if needed.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
                {/* Dynamic Header Background */}
                <div className={`h-32 w-full transition-colors duration-500 ease-in-out ${isLogin ? 'bg-blue-600' : 'bg-slate-800'} flex items-center justify-center`}>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        {isLogin ? "Welcome Back" : "Join the Trip"}
                    </h2>
                </div>

                <div className="p-8 pt-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="email">이메일</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-lg font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1" htmlFor="password">비밀번호</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-lg font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {(authError || localError) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50 text-red-600 text-sm p-3 rounded-xl font-medium"
                                >
                                    ⚠️ {authError || localError}
                                </motion.div>
                            )}
                            {successMsg && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green-50 text-green-700 text-sm p-3 rounded-xl font-medium whitespace-pre-line text-center"
                                >
                                    ✅ {successMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl text-white text-lg font-bold shadow-lg transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
                ${isLogin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    처리 중...
                                </span>
                            ) : (
                                isLogin ? "로그인하기" : "3인 그룹 합류하기"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setLocalError(null);
                                setSuccessMsg(null);
                            }}
                            className="text-gray-500 text-sm font-medium hover:text-gray-800 underline decoration-gray-300 underline-offset-4"
                        >
                            {isLogin ? "아직 멤버가 아니신가요? (회원가입)" : "이미 계정이 있으신가요? (로그인)"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
