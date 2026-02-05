import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    // Check if we have credentials in environment variables
    // For local dev without env, this will fail. We need a service account.
    // However, I'll try to use the "default" credentials if available, or error out and tell User to config.
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export async function POST(request: Request) {
    try {
        const { tokens, title, body, data } = await request.json();

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
        }

        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Successfully sent message:', response);

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log('List of tokens that caused failures: ' + failedTokens);
            // Optionally remove invalid tokens from DB here
        }

        return NextResponse.json({ success: true, failureCount: response.failureCount });
    } catch (error) {
        console.error('Error sending push:', error);
        return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
    }
}
