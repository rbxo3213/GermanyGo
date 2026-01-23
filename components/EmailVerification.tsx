"use client";

import { useAuth } from "../hooks/useAuth";
import { Mail, RefreshCw, XCircle } from "lucide-react";

export default function EmailVerification() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-6">
            <div className="w-full max-w-sm text-center">
                {/* Icon Animation */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-24 h-24 bg-white border-4 border-slate-900 rounded-full flex items-center justify-center z-10 shadow-xl">
                        <Mail size={40} className="text-slate-900" />
                    </div>
                </div>

                <h2 className="text-2xl font-extrabold mb-3 text-slate-900 tracking-tight">
                    메일함을 확인해주세요
                </h2>

                <p className="text-gray-500 mb-10 text-base break-keep leading-relaxed px-4">
                    <span className="font-bold text-slate-900 underline decoration-yellow-400 decoration-2 underline-offset-4">{user.email}</span>
                    <br />으로 인증 메일이 발송되었습니다.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl text-lg hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={20} />
                        인증 완료 (새로고침)
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
                        className="w-full bg-gray-50 text-gray-400 font-bold py-4 rounded-2xl text-lg hover:bg-gray-100 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle size={20} />
                        가입 취소
                    </button>
                </div>

                <p className="mt-8 text-xs text-gray-300">
                    메일이 오지 않았다면 스팸함을 확인해주세요.
                </p>
            </div>
        </div>
    );
}
