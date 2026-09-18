import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: any;
}

export const useRealtimeChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default-session');
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState<boolean>(true);

  // Initial welcome message template
  const initialWelcomeMessages: ChatMessage[] = [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `**আসসালামু আলাইকুম ও সুপ্রভাত!** 🇧🇩

আমি **BD-Zen AI** — শান্ত, স্মার্ট ও নির্ভুল সমাধানের প্রতীক।

বাংলাদেশের সমৃদ্ধ ইতিহাস, মহান মুক্তিযুদ্ধ, শিক্ষা, বিসিএস প্রস্তুতি, ক্যারিয়ার, সাহিত্য, কিংবা প্রযুক্তি ও প্রতিদিনের যেকোনো জিজ্ঞাসায় আমি আপনাকে বস্তুনিষ্ঠ ও সুনির্দিষ্ট সহায়তায় প্রস্তুত।

**আজ আপনাকে কীভাবে সাহায্য করতে পারি?**
- ✍️ *বাংলা ও ইংরেজি ইমেইল বা অনুচ্ছেদ লেখনী*
- 🎓 *বিসিএস, এইচএসসি ও ক্যারিয়ার প্রস্তুতি নির্দেশিকা*
- 🇧🇩 *বাংলাদেশের ইতিহাস, মুক্তিযুদ্ধ ও পর্যটন তথ্য*
- 💻 *প্রযুক্তি, কোডিং ও ডিজিটাল বাংলাদেশ সেবা*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  // Real-time Firestore Listener
  useEffect(() => {
    if (!user) {
      // Fallback for guest mode (localStorage)
      const local = localStorage.getItem('bd_zen_chat_messages');
      if (local) {
        try {
          setCurrentMessages(JSON.parse(local));
        } catch (e) {
          setCurrentMessages(initialWelcomeMessages);
        }
      } else {
        setCurrentMessages(initialWelcomeMessages);
      }
      setIsLoadingRealtime(false);
      return;
    }

    setIsLoadingRealtime(true);
    const chatsRef = collection(db, 'users', user.uid, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    // Real-time listener on user's chat sessions
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatSession[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
        });

        setSessions(list);

        if (list.length > 0) {
          // If activeSessionId is in list, keep it, otherwise select first
          const found = list.find((s) => s.id === activeSessionId);
          if (found) {
            setCurrentMessages(found.messages || []);
          } else {
            setActiveSessionId(list[0].id);
            setCurrentMessages(list[0].messages || []);
          }
        } else {
          // Create initial real-time session for new logged-in user
          const newId = 'session-' + Date.now();
          setActiveSessionId(newId);
          setCurrentMessages(initialWelcomeMessages);
          saveSessionToFirestore(user.uid, newId, 'নতুন কথোপকথন', initialWelcomeMessages);
        }

        setIsLoadingRealtime(false);
      },
      (error) => {
        console.error('Real-time listener error:', error);
        setIsLoadingRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Save session helper
  const saveSessionToFirestore = async (
    uid: string,
    sessionId: string,
    title: string,
    msgs: ChatMessage[]
  ) => {
    try {
      const docRef = doc(db, 'users', uid, 'chats', sessionId);
      // Strip undefined properties from messages for Firestore compatibility
      const sanitizedMessages = JSON.parse(JSON.stringify(msgs));
      await setDoc(
        docRef,
        {
          id: sessionId,
          title: title || 'কথোপকথন',
          messages: sanitizedMessages,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error saving session to Firestore:', err);
    }
  };

  // Fast local messages update during streaming (bypasses Firestore setDoc during active token reception)
  const updateLocalMessages = (newMsgs: ChatMessage[]) => {
    setCurrentMessages(newMsgs);
  };

  // Sync messages update
  const syncMessages = async (newMsgs: ChatMessage[]) => {
    setCurrentMessages(newMsgs);

    if (user) {
      const firstUserMsg = newMsgs.find((m) => m.role === 'user')?.content || 'নতুন আলোচনা';
      const title = firstUserMsg.slice(0, 30);
      await saveSessionToFirestore(user.uid, activeSessionId, title, newMsgs);
    } else {
      localStorage.setItem('bd_zen_chat_messages', JSON.stringify(newMsgs));
    }
  };

  // Start new chat
  const startNewSession = async () => {
    const newId = 'session-' + Date.now();
    setActiveSessionId(newId);
    setCurrentMessages(initialWelcomeMessages);

    if (user) {
      await saveSessionToFirestore(user.uid, newId, 'নতুন আলোচনা', initialWelcomeMessages);
    } else {
      localStorage.setItem('bd_zen_chat_messages', JSON.stringify(initialWelcomeMessages));
    }
  };

  // Switch session
  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentMessages(target.messages || []);
    }
  };

  // Clear chat
  const clearCurrentChat = async () => {
    const resetMessage: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `আমি **BD-Zen AI** — শান্ত, স্মার্ট ও নির্ভুল সমাধানের প্রতীক। চ্যাট সাফ করা হয়েছে। কীভাবে সাহায্য করতে পারি?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    await syncMessages(resetMessage);
  };

  return {
    sessions,
    activeSessionId,
    currentMessages,
    isLoadingRealtime,
    syncMessages,
    updateLocalMessages,
    startNewSession,
    selectSession,
    clearCurrentChat,
  };
};
