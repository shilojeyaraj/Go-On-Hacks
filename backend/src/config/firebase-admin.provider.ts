import './env-loader';

import * as admin from 'firebase-admin';
if (!process.env.FB_PROJECT_ID || !process.env.FB_CLIENT_EMAIL || !process.env.FB_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin environment variables. Please check your .env file:\n' +
    '- FB_PROJECT_ID\n' +
    '- FB_CLIENT_EMAIL\n' +
    '- FB_PRIVATE_KEY\n\n' +
    'Make sure you have created backend/.env file from backend/env.template'
  );
}

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

export const firebaseAdmin = app;

