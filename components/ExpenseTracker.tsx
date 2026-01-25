"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, getDocs } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Plus, Trash2, Wallet, Receipt, ArrowRight, Euro, User, RefreshCcw, CheckSquare, Square, ShoppingCart, Bus, Utensils, MoreHorizontal, CheckCircle2, Pencil, ChevronDown, ChevronUp, AlertCircle, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface ExpenseItem {
    name: string;
    price: string; // Keep as string for input handling
    involvedUids: string[];
}

type ExpenseCategory = "food" | "transport" | "shopping" | "culture" | "etc";

interface Expense {
    id: string;
    description: string;
    category: ExpenseCategory;
    payerUid: string;
    payerName: string;
    currency: "EUR" | "KRW";
    totalAmount: number;
    items: ExpenseItem[];
    date: any;
    isSettled?: boolean;
}

const EXCHANGE_RATE = 1450;

const CATEGORIES = [
    { id: "food", label: "식비", icon: Utensils, color: "bg-orange-100 text-orange-600" },
    { id: "transport", label: "교통", icon: Bus, color: "bg-blue-100 text-blue-600" },
    { id: "shopping", label: "쇼핑", icon: ShoppingCart, color: "bg-pink-100 text-pink-600" },
    { id: "culture", label: "문화", icon: Landmark, color: "bg-purple-100 text-purple-600" },
    { id: "etc", label: "기타", icon: MoreHorizontal, color: "bg-gray-100 text-gray-600" },
] as const;

export default function ExpenseTracker() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [members, setMembers] = useState<{ uid: string; nickname: string }[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("food");
    const [currency, setCurrency] = useState<"EUR" | "KRW">("EUR");
    const [payerUid, setPayerUid] = useState("");
    const [formItems, setFormItems] = useState<ExpenseItem[]>([
        { name: "", price: "", involvedUids: [] }
    ]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // 1. Fetch
    useEffect(() => {
        const q = query(collection(db, "expenses"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
            setExpenses(list);
        });

        getDocs(collection(db, "users")).then(snap => {
            const m = snap.docs.map(d => ({ uid: d.id, nickname: d.data().nickname || "멤버" }));
            setMembers(m);
            if (user?.uid && !payerUid) setPayerUid(user.uid);
        });
        return () => unsubscribe();
    }, [user]);

    // Initial Involved Setup
    useEffect(() => {
        if (members.length > 0 && formItems.length === 1 && formItems[0].involvedUids.length === 0) {
            setFormItems([{ ...formItems[0], involvedUids: members.map(m => m.uid) }]);
        }
    }, [members, isModalOpen]);

    // Form Handlers
    const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
        const newItems = [...formItems];
        if (field === 'price') {
            if (value === '') {
                newItems[index].price = '';
            } else {
                const cleanValue = value.replace(/^0+(?=\d)/, '');
                if (/^\d*\.?\d*$/.test(cleanValue)) {
                    newItems[index].price = cleanValue;
                }
            }
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormItems(newItems);
        validateForm(newItems);
    };

    const toggleItemInvolved = (index: number, uid: string) => {
        const newItems = [...formItems];
        const currentInvolved = newItems[index].involvedUids;
        if (currentInvolved.includes(uid)) {
            newItems[index].involvedUids = currentInvolved.filter(id => id !== uid);
        } else {
            newItems[index].involvedUids = [...currentInvolved, uid];
        }
        setFormItems(newItems);
        validateForm(newItems);
    };

    const addItemRow = () => {
        const newItems = [...formItems, { name: "", price: "", involvedUids: members.map(m => m.uid) }];
        setFormItems(newItems);
        validateForm(newItems);
    };

    const removeItemRow = (index: number) => {
        if (formItems.length > 1) {
            const newItems = formItems.filter((_, i) => i !== index);
            setFormItems(newItems);
            validateForm(newItems);
        }
    };

    const validateForm = (items: ExpenseItem[]) => {
        for (const item of items) {
            if (item.price === "" || isNaN(Number(item.price)) || Number(item.price) <= 0) {
                setErrorMsg("올바른 금액을 입력해주세요.");
                return false;
            }
            if (item.involvedUids.length === 0) {
                setErrorMsg("최소 1명의 참여자를 선택해주세요.");
                return false;
            }
        }
        setErrorMsg("");
        return true;
    };

    const currentTotal = formItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // 2. Actions (Create / Update)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !validateForm(formItems)) return;
        setLoading(true);

        try {
            const processedItems = formItems.map(item => {
                const basePrice = Number(item.price);
                const isKRW = currency === "KRW";
                return {
                    name: item.name,
                    involvedUids: item.involvedUids,
                    price: isKRW ? basePrice / EXCHANGE_RATE : basePrice,
                };
            });

            const finalTotal = currency === "KRW" ? currentTotal / EXCHANGE_RATE : currentTotal;
            const payerName = members.find(m => m.uid === payerUid)?.nickname || "익명";

            const data = {
                description: title,
                category,
                currency,
                payerUid,
                payerName,
                totalAmount: finalTotal,
                items: processedItems,
                date: serverTimestamp(),
                isSettled: false
            };

            if (editId) {
                await updateDoc(doc(db, "expenses", editId), data);
            } else {
                await addDoc(collection(db, "expenses"), data);
            }

            closeModal();
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (confirm("삭제하시겠습니까?")) await deleteDoc(doc(db, "expenses", id));
    };

    const toggleSettle = async (expense: Expense) => {
        await updateDoc(doc(db, "expenses", expense.id), { isSettled: !expense.isSettled });
    };

    // Modal Controls
    const openAddModal = () => {
        setEditId(null);
        setTitle("");
        setCategory("food");
        setCurrency("EUR");
        setPayerUid(user?.uid || "");
        setFormItems([{ name: "", price: "", involvedUids: members.map(m => m.uid) }]);
        setErrorMsg("");
        setIsModalOpen(true);
    };

    const openEditModal = (ex: Expense) => {
        setEditId(ex.id);
        setTitle(ex.description);
        setCategory(ex.category);
        setCurrency(ex.currency);
        setPayerUid(ex.payerUid);

        const isKRW = ex.currency === "KRW";
        const displayItems = ex.items.map(item => ({
            ...item,
            price: isKRW ? (Number(item.price) * EXCHANGE_RATE).toString() : Number(item.price).toString(),
        }));

        setFormItems(displayItems);
        setErrorMsg("");
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    // 3. Logic: Settlement (Only active expenses)
    const { activeExpenses, settledExpenses, settlement } = useMemo(() => {
        const active = expenses.filter(e => !e.isSettled);
        const settled = expenses.filter(e => e.isSettled);

        const balances: { [uid: string]: { paid: number, debt: number, nickname: string } } = {};
        members.forEach(m => balances[m.uid] = { paid: 0, debt: 0, nickname: m.nickname });

        active.forEach(ex => {
            if (!balances[ex.payerUid]) return;
            balances[ex.payerUid].paid += ex.totalAmount;
            if (ex.items) {
                ex.items.forEach(item => {
                    const price = Number(item.price);
                    const splitCount = item.involvedUids.length;
                    if (splitCount > 0) {
                        const splitAmount = price / splitCount;
                        item.involvedUids.forEach(uid => {
                            if (balances[uid]) balances[uid].debt += splitAmount;
                        });
                    }
                });
            }
        });

        const result = Object.keys(balances).map(uid => ({
            uid, nickname: balances[uid].nickname, net: balances[uid].paid - balances[uid].debt
        }));
        const receivers = result.filter(r => r.net > 0.01).sort((a, b) => b.net - a.net);
        const givers = result.filter(r => r.net < -0.01).sort((a, b) => a.net - b.net);
        const transfers: { from: string; to: string; amount: number }[] = [];
        let r = 0, g = 0;
        while (r < receivers.length && g < givers.length) {
            const amount = Math.min(Math.abs(givers[g].net), receivers[r].net);
            transfers.push({ from: givers[g].nickname, to: receivers[r].nickname, amount });
            receivers[r].net -= amount;
            givers[g].net += amount;
            if (receivers[r].net < 0.01) r++;
            if (Math.abs(givers[g].net) < 0.01) g++;
        }

        const totalActive = active.reduce((s, e) => s + e.totalAmount, 0);

        return {
            activeExpenses: active,
            settledExpenses: settled,
            settlement: { total: totalActive, transfers }
        };
    }, [expenses, members]);

    return (
        <div className="space-y-6 pb-20">

            {/* Dashboard */}
            <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="mb-4">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">To be Settled</p>
                        <h2 className="text-3xl font-black tracking-tight">€ {settlement.total.toFixed(2)}</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">≈ ₩ {(settlement.total * EXCHANGE_RATE).toLocaleString()}</p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                        <p className="text-[10px] font-bold text-[#FFCE00] uppercase mb-2">Settlement Plan</p>
                        {settlement.transfers.length === 0 ? (
                            <p className="text-xs text-center text-gray-300 py-1">정산이 완료되었습니다! 🎉</p>
                        ) : (
                            <div className="space-y-2">
                                {settlement.transfers.map((t, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-red-300">{t.from}</span>
                                            <ArrowRight size={10} className="text-gray-500" />
                                            <span className="font-bold text-green-300">{t.to}</span>
                                        </div>
                                        <span className="font-bold text-white">€ {t.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <Euro className="absolute -right-4 -bottom-6 text-white/5 rotate-12" size={140} />
            </div>

            {/* Header & Add */}
            <div className="flex justify-between items-center px-2">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <Receipt size={20} className="text-slate-900" /> History
                </h3>
                <button
                    onClick={openAddModal}
                    className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-black transition-all flex items-center gap-1.5 active:scale-95"
                >
                    <Plus size={14} strokeWidth={3} /> 지출 추가
                </button>
            </div>

            {/* Active List */}
            <div className="space-y-3 px-1">
                {activeExpenses.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl">
                        <p className="text-gray-400 text-xs font-bold">정산할 내역이 없어요</p>
                    </div>
                )}
                {activeExpenses.map(ex => (
                    <ExpenseCard
                        key={ex.id}
                        expense={ex}
                        members={members}
                        userUid={user?.uid}
                        onDelete={() => handleDelete(ex.id)}
                        onSettle={() => toggleSettle(ex)}
                        onEdit={() => openEditModal(ex)}
                    />
                ))}
            </div>

            {/* Settled List */}
            {settledExpenses.length > 0 && (
                <div className="pt-6 border-t border-dashed border-gray-200 mt-6">
                    <p className="text-xs font-bold text-gray-400 mb-3 px-1">정산 완료됨 ({settledExpenses.length})</p>
                    <div className="space-y-3 px-1 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                        {settledExpenses.map(ex => (
                            <ExpenseCard
                                key={ex.id}
                                expense={ex}
                                members={members}
                                userUid={user?.uid}
                                onDelete={() => handleDelete(ex.id)}
                                onSettle={() => toggleSettle(ex)}
                                onEdit={() => openEditModal(ex)}
                                isSettled
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
                                <h3 className="text-lg font-black text-slate-900">{editId ? "지출 수정" : "지출 기록"}</h3>
                                <button onClick={closeModal} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"><Plus className="rotate-45 text-gray-500" size={20} /></button>
                            </div>
                            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase mb-1.5 block">영수증 이름</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: REWE 마트" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none" autoFocus />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase mb-1.5 block">카테고리</label>
                                            <div className="flex gap-2">
                                                {CATEGORIES.map(cat => (
                                                    <button key={cat.id} type="button" onClick={() => setCategory(cat.id as ExpenseCategory)} className={`p-2 rounded-xl transition-all ${category === cat.id ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-400"}`}>
                                                        <cat.icon size={18} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase mb-1.5 block">통화</label>
                                            <div className="bg-gray-50 p-1 rounded-xl flex border border-gray-100">
                                                <button type="button" onClick={() => setCurrency("EUR")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currency === "EUR" ? "bg-white shadow-sm text-slate-900" : "text-gray-400"}`}>€</button>
                                                <button type="button" onClick={() => setCurrency("KRW")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currency === "KRW" ? "bg-white shadow-sm text-slate-900" : "text-gray-400"}`}>₩</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase mb-1.5 block">결제자</label>
                                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                            {members.map(m => (
                                                <button key={m.uid} type="button" onClick={() => setPayerUid(m.uid)} className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${payerUid === m.uid ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-400 border-gray-200"}`}>{m.nickname}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase">항목 ({formItems.length})</label>
                                        <span className="text-xs font-black text-slate-900">Total: {currency === 'EUR' ? '€' : '₩'} {currentTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {formItems.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 relative group">
                                                <div className="flex gap-2 mb-2">
                                                    <input type="text" placeholder="품목명" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="0"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                                        className={`w-20 bg-white rounded-lg px-3 py-2 text-xs font-bold outline-none text-right ${!item.price && "border border-red-300"}`}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {members.map(m => {
                                                            const isSelected = item.involvedUids.includes(m.uid);
                                                            return (
                                                                <button key={m.uid} type="button" onClick={() => toggleItemInvolved(idx, m.uid)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border flex items-center gap-1 ${isSelected ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-transparent text-gray-400"}`}>
                                                                    {isSelected ? <CheckSquare size={10} /> : <Square size={10} />}
                                                                    {m.nickname}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {formItems.length > 1 && <button type="button" onClick={() => removeItemRow(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={addItemRow} className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold hover:border-slate-300 hover:text-slate-600 transition-all flex items-center justify-center gap-1"><Plus size={14} /> 항목 추가</button>
                                </div>
                            </form>
                            <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                                {errorMsg && <p className="text-center text-xs text-red-500 font-bold mb-2">{errorMsg}</p>}
                                <button onClick={handleSave} disabled={loading || !!errorMsg || currentTotal === 0} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
                                    {loading ? <RefreshCcw className="animate-spin" size={18} /> : <Receipt size={18} />}
                                    <span>{editId ? "수정 완료" : "영수증 저장"} (Total {currency === 'EUR' ? '€' : '₩'}{currentTotal.toLocaleString()})</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub Component for Clean List
function ExpenseCard({ expense, members, userUid, onDelete, onSettle, onEdit, isSettled }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const cat = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[4];
    const Icon = cat.icon;
    const safeTotal = Number(expense.totalAmount) || 0;

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all ${isSettled ? '' : 'hover:shadow-md'}`}>
            <div className="p-4 flex justify-between items-start cursor-pointer active:bg-gray-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); onSettle(); }} className="text-gray-300 hover:text-slate-900 transition-colors p-1 -ml-1">
                        {isSettled ? <CheckSquare size={20} className="text-slate-900" /> : <Square size={20} />}
                    </button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color}`}><Icon size={20} /></div>
                    <div>
                        <h4 className={`font-bold text-sm mb-0.5 ${isSettled ? 'text-gray-400 line-through' : 'text-slate-900'}`}>{expense.description}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{expense.date?.toDate ? expense.date.toDate().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`font-black text-base block ${isSettled ? 'text-gray-400' : 'text-slate-900'}`}>€ {safeTotal.toFixed(2)}</span>
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">{expense.payerName}</span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-dashed border-gray-100 bg-gray-50/50">
                        <div className="p-4 pt-3 space-y-2">
                            {expense.items?.map((item: any, idx: number) => {
                                const involved = item.involvedUids || [];
                                const price = Number(item.price) || 0;
                                return (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`${isSettled ? 'text-gray-400' : 'text-slate-700'} font-medium`}>{item.name || "항목"}</span>
                                            <div className="flex -space-x-1">
                                                {involved.length === members.length ? (
                                                    <span className={`text-[9px] px-1 rounded ${isSettled ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>ALL</span>
                                                ) : (
                                                    involved.map((uid: string) => {
                                                        const m = members.find((mem: any) => mem.uid === uid);
                                                        return m ? <div key={uid} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ring-1 ring-white ${isSettled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>{m.nickname[0]}</div> : null;
                                                    })
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-gray-400">€ {price.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                            {!isSettled && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                                    <button onClick={onEdit} className="text-blue-400 hover:text-blue-600 text-xs flex items-center gap-1 bg-white border border-blue-100 px-3 py-1.5 rounded-lg shadow-sm"><Pencil size={12} /> 수정</button>
                                    {userUid === expense.payerUid && <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm"><Trash2 size={12} /> 삭제</button>}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}