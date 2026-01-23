"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    // Map Firebase Errors to Korean
    const getFriendlyErrorMessage = (code: string) => {
        if (code.includes("email-already-in-use")) return "이미 가입된 이메일입니다.";
        if (code.includes("user-not-found") || code.includes("invalid-credential")) return "아이디 또는 비밀번호가 일치하지 않습니다.";
        if (code.includes("wrong-password")) return "비밀번호가 일치하지 않습니다.";
        if (code.includes("weak-password")) return "비밀번호는 6자 이상이어야 합니다.";
        if (code.includes("invalid-email")) return "올바른 이메일 형식이 아닙니다.";
        if (code.includes("network-request-failed")) return "네트워크 연결을 확인해주세요.";
        return "오류가 발생했습니다. 다시 시도해주세요.";
    };

    // Watch for Auth Errors from Hook
    useEffect(() => {
        if (authError) {
            setAlert({ msg: getFriendlyErrorMessage(authError), type: "error" });
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                // Success is handled by auth state change
            } else {
                if (!nickname.trim()) throw new Error("닉네임을 입력해주세요.");
                await signup(email, password, nickname);
                setAlert({ msg: "가입 확인 메일이 발송되었습니다.\n메일함(스팸함)을 확인해주세요!", type: "success" });
            }
        } catch (err: any) {
            console.error(err);
            setAlert({ msg: getFriendlyErrorMessage(err.code || err.message), type: "error" });
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
                <div className="text-center mb-8">
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

                <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                    <div className="overflow-hidden">
                        <AnimatePresence initial={false} mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="nickname-field"
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.2 }}
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
                        </AnimatePresence>
                    </div>

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
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-200 disabled:opacity-50 mt-4"
                    >
                        {loading ? "잠시만요..." : (isLogin ? "이메일로 시작하기" : "회원가입")}
                    </button>
                </form>

                <div className="relative flex items-center gap-4 py-2 mb-6">
                    <div className="h-px bg-gray-100 flex-1"></div>
                    <span className="text-gray-300 text-xs font-bold">또는</span>
                    <div className="h-px bg-gray-100 flex-1"></div>
                </div>

                {/* Kakao Login Button (Bottom) */}
                <button
                    type="button"
                    onClick={() => {
                        import("firebase/auth").then(async ({ OAuthProvider, signInWithPopup, getAuth }) => {
                            const auth = getAuth();
                            const provider = new OAuthProvider('oidc.kakao');
                            try {
                                await signInWithPopup(auth, provider);
                                // Successful login will trigger useAuth state change and close modal
                            } catch (e: any) {
                                console.error(e);
                                window.alert("카카오 로그인 실패: " + e.message);
                            }
                        });
                    }}
                    className="w-full bg-[#FEE500] text-[#3b1e1e] font-bold py-4 rounded-2xl text-lg hover:bg-[#fddc00] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                    카카오로 시작하기
                </button>

                <div className="mt-6 text-center">
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
