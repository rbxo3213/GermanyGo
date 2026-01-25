
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import CustomAlert from "./CustomAlert";
import { AlertCircle } from "lucide-react";

export default function LoginModal() {
    const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인 (신규 로직 유지)
    const [nickname, setNickname] = useState("");

    const { login, signup, error: authError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

    // 에러 메시지 한글 변환
    const getFriendlyErrorMessage = (code: string) => {
        if (code.includes("email-already-in-use")) return "이미 사용 중인 이메일입니다.";
        if (code.includes("user-not-found") || code.includes("invalid-credential")) return "가입되지 않은 아이디거나, 비밀번호가 틀렸습니다.";
        if (code.includes("wrong-password")) return "비밀번호가 일치하지 않습니다.";
        if (code.includes("weak-password")) return "비밀번호는 6자 이상이어야 합니다.";
        if (code.includes("invalid-email")) return "이메일 형식이 올바르지 않습니다.";
        if (code.includes("Group Full")) return "정원 초과: 가입 인원이 20명으로 제한되어 있습니다.";
        if (code.includes("network-request-failed")) return "네트워크 연결 상태를 확인해주세요.";
        return "오류가 발생했습니다.";
    };

    useEffect(() => {
        if (authError) {
            setAlert({ msg: getFriendlyErrorMessage(authError), type: "error" });
        }
    }, [authError]);

    // 모드 변경 시 초기화
    useEffect(() => {
        setAlert(null);
        setPassword("");
        setConfirmPassword("");
    }, [isLogin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);

        // 유효성 검사 (회원가입 시)
        if (!isLogin) {
            if (password !== confirmPassword) {
                setAlert({ msg: "비밀번호가 일치하지 않습니다.", type: "error" });
                return;
            }
            if (!nickname.trim()) {
                setAlert({ msg: "닉네임을 입력해주세요.", type: "error" });
                return;
            }
        }

        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, nickname);
                setAlert({
                    msg: "가입 인증 메일을 보냈습니다.\n이메일 인증 후 로그인해주세요!",
                    type: "success"
                });
                setTimeout(() => setIsLogin(true), 3000);
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
                {/* Header: 이전 디자인으로 복구 (굵은 바, 큰 폰트) */}
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
                        {isLogin ? "독일 여행의 모든 순간" : "새로운 여정을 시작하세요"}
                    </p>
                </div>

                {/* Form: 이전 디자인으로 복구 (아이콘 제거, 심플한 Input) */}
                <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                    {/* 닉네임 (회원가입만) */}
                    <AnimatePresence initial={false}>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
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

                    {/* 이메일 */}
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        placeholder="이메일"
                    />

                    {/* 비밀번호 */}
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                        placeholder="비밀번호"
                    />

                    {/* 비밀번호 확인 (회원가입만 - 디자인은 심플하게 유지) */}
                    <AnimatePresence initial={false}>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3">
                                    <input
                                        type="password"
                                        required={!isLogin}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-gray-400 transition-all outline-none ${confirmPassword && password !== confirmPassword
                                            ? "ring-2 ring-red-500 focus:ring-red-500"
                                            : "focus:ring-2 focus:ring-black/5"
                                            }`}
                                        placeholder="비밀번호 확인"
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-xs text-red-500 mt-2 ml-2 font-bold flex items-center gap-1">
                                            <AlertCircle size={10} /> 비밀번호가 일치하지 않습니다
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-gray-200 disabled:opacity-70 mt-4"
                    >
                        {loading ? "처리 중..." : (isLogin ? "로그인" : "회원가입 완료")}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center gap-4 py-2 mb-6">
                    <div className="h-px bg-gray-100 flex-1"></div>
                    <span className="text-gray-300 text-xs font-bold">또는</span>
                    <div className="h-px bg-gray-100 flex-1"></div>
                </div>

                {/* Kakao Login */}
                <button
                    type="button"
                    onClick={() => {
                        import("firebase/auth").then(async ({ OAuthProvider, signInWithPopup, getAuth }) => {
                            const auth = getAuth();
                            const provider = new OAuthProvider('oidc.kakao');
                            try {
                                await signInWithPopup(auth, provider);
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

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors"
                    >
                        {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
