/**
 * Firebase Service
 * Handles all Firestore database operations for chat messages
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  type DocumentData,
  QueryDocumentSnapshot,
  limit,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { ChatResponse } from './chatApi';

// Collection name
const CHAT_COLLECTION = 'chat_messages';

export interface ChatMessageDocument {
  sessionId: string;
  question: string;
  response: ChatResponse;
  timestamp: Timestamp;
  userId?: string;
  metadata?: {
    classification?: string;
    action?: string;
    hasPlots?: boolean;
    hasNews?: boolean;
    responseTime?: number;
  };
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  question: string;
  response: ChatResponse;
  timestamp: Date;
  userId?: string;
  metadata?: {
    classification?: string;
    action?: string;
    hasPlots?: boolean;
    hasNews?: boolean;
    responseTime?: number;
  };
}

/**
 * Save a chat message to Firestore
 */
export async function saveChatMessage(
  sessionId: string,
  question: string,
  response: ChatResponse,
  metadata?: {
    classification?: string;
    action?: string;
    hasPlots?: boolean;
    hasNews?: boolean;
    responseTime?: number;
  }
): Promise<string> {
  try {
    const messageData: ChatMessageDocument = {
      sessionId,
      question,
      response,
      timestamp: Timestamp.now(),
      metadata,
    };

    const docRef = await addDoc(collection(db, CHAT_COLLECTION), messageData);
    console.log('Chat message saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw new Error('Failed to save chat message');
  }
}

/**
 * Get all chat messages for a session
 */
export async function getChatHistory(
  sessionId: string,
  limitCount: number = 50
): Promise<StoredChatMessage[]> {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const messages: StoredChatMessage[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as ChatMessageDocument;
      messages.push({
        id: doc.id,
        sessionId: data.sessionId,
        question: data.question,
        response: data.response,
        timestamp: data.timestamp.toDate(),
        userId: data.userId,
        metadata: data.metadata,
      });
    });

    // Reverse to get chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw new Error('Failed to fetch chat history');
  }
}

/**
 * Get recent messages across all sessions (for analytics)
 */
export async function getRecentMessages(
  limitCount: number = 100
): Promise<StoredChatMessage[]> {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const messages: StoredChatMessage[] = [];

    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as ChatMessageDocument;
      messages.push({
        id: doc.id,
        sessionId: data.sessionId,
        question: data.question,
        response: data.response,
        timestamp: data.timestamp.toDate(),
        userId: data.userId,
        metadata: data.metadata,
      });
    });

    return messages;
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    throw new Error('Failed to fetch recent messages');
  }
}

/**
 * Delete a specific message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CHAT_COLLECTION, messageId));
    console.log('Message deleted:', messageId);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
}

/**
 * Delete all messages for a session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      where('sessionId', '==', sessionId)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`Deleted ${querySnapshot.size} messages for session ${sessionId}`);
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw new Error('Failed to delete chat session');
  }
}

/**
 * Get message count for a session
 */
export async function getSessionMessageCount(sessionId: string): Promise<number> {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      where('sessionId', '==', sessionId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
}

export default {
  saveChatMessage,
  getChatHistory,
  getRecentMessages,
  deleteChatMessage,
  deleteChatSession,
  getSessionMessageCount,
};