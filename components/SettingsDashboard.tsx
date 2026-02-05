import { motion } from "framer-motion";
import { X, User, Bell, Database, ChevronRight, LogOut, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../contexts/NotificationContext";
import { useSettings } from "../contexts/SettingsContext";
import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface Props {
    onClose: () => void;
}

export default function SettingsDashboard({ onClose }: Props) {
    const { user, userProfile } = useAuth();
    const { requestPermission, clearToken, permissionStatus } = useNotification();
    const { dataSaver, toggleDataSaver } = useSettings();

    // Member State
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    // Settings State
    const [pushEnabled, setPushEnabled] = useState(false);

    // Let's rely on permissionStatus AND presence of fcmToken
    useEffect(() => {
        if (permissionStatus === 'granted' && userProfile?.fcmToken) {
            setPushEnabled(true);
        } else {
            setPushEnabled(false);
        }
    }, [permissionStatus, userProfile]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const q = query(collection(db, "users"));
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
                setMembers(list);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, []);

    const handlePushToggle = async () => {
        if (pushEnabled) {
            // Turn Off
            if (confirm("알림을 끄시겠습니까?")) {
                await clearToken();
                setPushEnabled(false);
                // We don't need alert here, visual toggle is enough, but user asked for confirmation.
            }
        } else {
            // Turn On
            try {
                await requestPermission();
                // Check if 'granted' 
                if (Notification.permission === 'granted') {
                    // We optimistically set it to true, relying on requestPermission to have set the token
                    setPushEnabled(true);
                    alert("알림이 설정되었습니다.");
                } else {
                    alert("알림 권한이 차단되어 있습니다. 브라우저/시스템 설정에서 허용해주세요.");
                }
            } catch (e) {
                alert("설정 실패: " + e);
            }
        }
    };

    const handleSignOut = () => {
        if (confirm("정말 로그아웃 하시겠습니까?")) {
            import("../firebase").then(m => m.auth.signOut());
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-slate-50 overflow-y-auto"
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 transition-all">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">환경설정</h2>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-8 pb-24">

                {/* 1. Profile Section */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-1">내 프로필</h3>
                    <div className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl shadow-inner overflow-hidden border-4 border-white">
                                {userProfile?.flag ? (
                                    <div className="w-full h-full" style={{ backgroundColor: userProfile.flag }} />
                                ) : (
                                    <User className="text-gray-300" />
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md">
                                <span className="text-[10px]">🖊️</span>
                            </button>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-slate-900 mb-0.5">{userProfile?.nickname || "비회원"}</h2>
                            <p className="text-xs text-gray-400 font-medium">{user?.email}</p>
                            <div className="mt-3 flex gap-2">
                                <span className="px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100">
                                    {user?.providerData[0]?.providerId === 'google.com' ? 'Google 계정' : '이메일 계정'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. App Settings */}
                <section>
                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-1">계정 설정</h3>
                    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 divide-y divide-gray-50">
                        {/* Push Toggle */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${pushEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Bell size={20} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">푸시 알림</span>
                                    <span className="text-[10px] text-gray-400 font-medium">실시간 활동 알림 받기</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePushToggle}
                                className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${pushEnabled ? 'bg-slate-900' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Data Saver Mode */}
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${dataSaver ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Database size={20} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">데이터 절약 모드</span>
                                    <span className="text-[10px] text-gray-400 font-medium">{dataSaver ? "켜짐" : "꺼짐"} (로밍 시 권장)</span>
                                </div>
                            </div>
                            <button
                                onClick={toggleDataSaver}
                                className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${dataSaver ? 'bg-slate-900' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${dataSaver ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* 3. Member Status */}
                <section>
                    <div className="flex justify-between items-end mb-3 ml-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">멤버 현황</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{members.length}명</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {members.map(member => (
                            <div key={member.uid} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: member.flag || '#eee' }} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-sm">{member.nickname}</h4>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{member.email}</p>
                                </div>
                                {member.uid === user?.uid && (
                                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded-lg">나</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Logout */}
                <button
                    onClick={handleSignOut}
                    className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm mt-8"
                >
                    <LogOut size={18} />
                    로그아웃
                </button>
                <div className="text-center text-[10px] text-gray-300 font-medium mt-6">
                    Version 1.2.0 • Germa-Niche
                </div>
            </div>
        </motion.div>
    );
}
