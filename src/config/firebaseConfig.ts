// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc5DRaNlZE-V5CBlENgyNGfRotBKUScsc",
  authDomain: "finance-agentic-ai-475804.firebaseapp.com",
  projectId: "finance-agentic-ai-475804",
  storageBucket: "finance-agentic-ai-475804.firebasestorage.app",
  messagingSenderId: "664110982097",
  appId: "1:664110982097:web:d817b343fee946f28a36f0",
  measurementId: "G-ETFLX122FN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "financechat");