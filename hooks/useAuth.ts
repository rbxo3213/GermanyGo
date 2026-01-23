import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendEmailVerification
} from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signup = async (email: string, password: string, nickname: string) => {
        setError(null);
        let createdUser: User | null = null;

        try {
            // 1. Create User First (Get Auth Token)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            createdUser = userCredential.user;

            // 2. Check Limit & Increment Count in Firestore
            await runTransaction(db, async (transaction) => {
                const statsRef = doc(db, "meta", "stats");
                const statsDoc = await transaction.get(statsRef);

                if (!statsDoc.exists()) {
                    // Create stats doc if missing (1st user)
                    transaction.set(statsRef, { user_count: 1 });
                } else {
                    const currentCount = statsDoc.data().user_count || 0;
                    if (currentCount >= 3) {
                        throw new Error("Group Full: Registration is limited to 3 members only.");
                    }
                    transaction.update(statsRef, { user_count: currentCount + 1 });
                }

                // 3. Create User Profile in 'users' collection
                const userRef = doc(db, "users", createdUser!.uid);
                transaction.set(userRef, {
                    uid: createdUser!.uid,
                    email: email,
                    nickname: nickname,
                    createdAt: new Date(), // using serverTimestamp() inside transaction can be tricky, Date is fine for now or import serverTimestamp
                    role: 'member'
                });
            });

            // 4. Send Verification Email
            await sendEmailVerification(createdUser);
            return createdUser;

        } catch (err: any) {
            console.error("Signup Failed:", err);

            // ROLLBACK: Delete the user if Firestore check failed
            if (createdUser) {
                try {
                    await createdUser.delete();
                } catch (delErr) {
                    console.error("Rollback failed:", delErr);
                }
            }

            if (typeof err === "string") {
                setError(err);
                throw new Error(err);
            }
            // Permission Error Handling
            if (err.code === "permission-denied" || (err.message && err.message.includes("permission"))) {
                setError("데이터베이스 권한이 없습니다. Firebase Console > Firestore Database > Rules를 확인해주세요. (read, write: if true)");
                throw new Error("Permission Denied");
            }

            setError(err.message || "Signup failed");
            throw err;
        }
    };

    const login = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    return { user, loading, error, signup, login, logout };
}
