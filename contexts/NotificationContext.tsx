"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, arrayUnion, addDoc, serverTimestamp, setDoc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { getMessaging, getToken } from "firebase/messaging";

// Types
export type NotificationType = "todo" | "board" | "wish" | "expense";

export interface NotificationItem {
    id: string;
    type: NotificationType;
    message: string;        // Constructed message "~~ posted ..."
    targetDate?: string;    // specific date for todo "2026-02-06"
    uid: string;           // creator uid
    nickname: string;      // creator nickname
    readBy: string[];      // uids who have read this
    deletedBy?: string[];  // uids who have deleted this from their view
    createdAt: Timestamp | null;
}

interface UnreadMap {
    total: number;
    memo: boolean;      // Any of board/todo/wish/expense
    board: boolean;
    wish: boolean;
    expense: boolean;
    todo: boolean;
    todoDates: { [date: string]: boolean }; // "temp", "2026-02-06": true
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadMap: UnreadMap;
    markAsRead: (ids: string[]) => Promise<void>;
    markByTypeAsRead: (type: NotificationType, targetDate?: string) => Promise<void>;
    sendNotification: (type: NotificationType, message: string, targetDate?: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    requestPermission: () => Promise<void>;
    clearToken: () => Promise<void>;
    permissionStatus: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, userProfile } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadMap, setUnreadMap] = useState<UnreadMap>({
        total: 0,
        memo: false,
        board: false,
        wish: false,
        expense: false,
        todo: false,
        todoDates: {}
    });

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (snap) => {
            let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotificationItem[];

            // Client-side filter: Hide items deleted OR read by user
            list = list.filter(item =>
                !item.deletedBy?.includes(user.uid) &&
                !item.readBy?.includes(user.uid)
            );

            setNotifications(list);

            // Calculate Unread
            const map: UnreadMap = {
                total: 0,
                memo: false,
                board: false,
                wish: false,
                expense: false,
                todo: false,
                todoDates: {}
            };

            list.forEach(item => {
                const isUnread = !item.readBy?.includes(user.uid);
                if (isUnread) {
                    map.total++;
                    map.memo = true;

                    if (item.type === 'board') map.board = true;
                    if (item.type === 'wish') map.wish = true;
                    if (item.type === 'expense') map.expense = true;

                    if (item.type === 'todo') {
                        map.todo = true;
                        if (item.targetDate) {
                            map.todoDates[item.targetDate] = true; // "temp" or "2026-02-06"
                        } else {
                            map.todoDates["temp"] = true;
                        }
                    }
                }
            });
            setUnreadMap(map);
        });

        return () => unsubscribe();
    }, [user]);

    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof Notification !== 'undefined') {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!user) return;
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            if (permission === 'granted') {
                const messaging = getMessaging();

                // Explicitly register Service Worker
                let registration;
                if ('serviceWorker' in navigator) {
                    try {
                        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                        console.log('Service Worker registered with scope:', registration.scope);
                    } catch (err) {
                        console.error('Service Worker registration failed:', err);
                        // Continue anyway, getToken might use default reg
                    }
                }

                const currentToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    await setDoc(doc(db, "users", user.uid), { fcmToken: currentToken }, { merge: true });
                }
            }
        } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
            // Re-throw to let the caller (Popup) know about the error
            throw err;
        }
    };

    const clearToken = async () => {
        if (!user) return;
        try {
            // Remove token from Firestore
            await setDoc(doc(db, "users", user.uid), { fcmToken: null }, { merge: true }); // deleteField() is cleaner but null works nicely for merge
            console.log("Token cleared from server.");
            // Optionally we could verify UI status
        } catch (e) {
            console.error("Failed to clear token:", e);
        }
    };

    const markByTypeAsRead = async (type: NotificationType, targetDate?: string) => {
        if (!user) return;
        const unreadIds = notifications
            .filter(n => {
                if (n.type !== type) return false;
                if (n.readBy?.includes(user.uid)) return false;

                // For Todos, check date match
                if (type === 'todo' && targetDate) {
                    return n.targetDate === targetDate;
                }

                return true;
            })
            .map(n => n.id);

        if (unreadIds.length > 0) {
            await markAsRead(unreadIds);
        }
    };

    const markAsRead = async (ids: string[]) => {
        if (!user) return;
        const unreadIds = ids.filter(id => {
            const item = notifications.find(n => n.id === id);
            return item && !item.readBy?.includes(user.uid);
        });

        if (unreadIds.length === 0) return;

        await Promise.all(unreadIds.map(id =>
            updateDoc(doc(db, "notifications", id), {
                readBy: arrayUnion(user.uid)
            })
        ));
    };

    const sendNotification = async (type: NotificationType, message: string, targetDate?: string) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "notifications"), {
                type,
                message,
                targetDate: targetDate || null,
                uid: user.uid,
                nickname: userProfile?.nickname || "멤버",
                readBy: [user.uid],
                createdAt: serverTimestamp()
            });

            // Trigger Push Notification
            const usersSnap = await getDocs(query(collection(db, "users")));
            const tokens: string[] = [];
            usersSnap.forEach(doc => {
                const data = doc.data();
                if (doc.id !== user.uid && data.fcmToken) {
                    tokens.push(data.fcmToken);
                }
            });

            console.log(`[Push Debug] Found ${tokens.length} target tokens for push.`);

            if (tokens.length > 0) {
                console.log("[Push Debug] Sending request to /api/send-push...");
                const res = await fetch('/api/send-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tokens,
                        title: 'GermanyGo 알림',
                        body: message,
                        data: {
                            type,
                            targetDate: targetDate || ""
                        }
                    })
                });

                const result = await res.json();
                console.log("[Push Debug] API Response:", res.status, result);
            } else {
                console.log("[Push Debug] No tokens found. Skipping push.");
            }
        } catch (e) {
            console.error("[Push Debug] Failed to send notification:", e);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const unreadIds = notifications
            .filter(n => !n.readBy?.includes(user.uid))
            .map(n => n.id);

        if (unreadIds.length === 0) return;

        // Batch update or Promise.all
        // Firestore batch limit is 500, we have max 50 loaded, so Promise.all is fine or batch
        await Promise.all(unreadIds.map(id =>
            updateDoc(doc(db, "notifications", id), {
                readBy: arrayUnion(user.uid)
            })
        ));
    };

    const deleteNotification = async (id: string) => {
        if (!user) return;
        await updateDoc(doc(db, "notifications", id), {
            deletedBy: arrayUnion(user.uid)
        });
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadMap, markAsRead, markByTypeAsRead, sendNotification, requestPermission, clearToken, permissionStatus, markAllAsRead, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within NotificationProvider");
    return context;
}
