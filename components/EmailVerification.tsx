"use client";

import { useAuth } from "../hooks/useAuth";
import { Mail, RefreshCw, LogOut, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function EmailVerification() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 text-center border border-gray-100 relative overflow-hidden"
            >
                {/* Decorative Background Blur */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm relative">
                    <Mail size={32} strokeWidth={1.5} />
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                    메일함을 확인해주세요
                </h2>

                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    아래 이메일로 인증 링크를 보냈습니다.<br />
                    링크를 클릭하면 가입이 완료됩니다.
                </p>

                {/* Email Badge */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 mb-8 inline-block max-w-full">
                    <p className="text-slate-900 font-bold text-sm truncate">
                        {user.email}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-base hover:bg-black transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <span>인증 완료했어요</span>
                        <ArrowRight size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            if (!confirm("정말 가입을 취소하시겠습니까?")) return;
                            try {
                                const { doc, deleteDoc, getFirestore } = await import("firebase/firestore");
                                const db = getFirestore();
                                await deleteDoc(doc(db, "users", user.uid));
                                await user.delete();
                            } catch (e) {
                                console.error("Cleanup failed", e);
                                import("../firebase").then(m => m.auth.signOut());
                            }
                        }}
                        className="w-full py-3 text-gray-400 text-sm font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <LogOut size={14} />
                        가입 취소 / 로그아웃
                    </button>
                </div>

                {/* Footer Help */}
                <p className="mt-8 text-[11px] text-gray-300">
                    메일이 보이지 않는다면 스팸함을 확인해주세요.
                </p>
            </motion.div>
        </div>
    );
}