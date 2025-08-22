import { useState, useEffect, useCallback } from 'react';

// Определяем интерфейсы
interface Participant {
  id: string;
  name: string;
  isHost: boolean;
}

interface Track {
  id?: string;
  name: string;
  artist: string;
  album?: string;
  votes: number;
  votedBy: string[];
  addedBy: string;
  [key: string]: any;
}

interface PartyState {
  participants: Participant[];
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function usePartySocket(
  partyCode: string,
  userId: string,
  userName: string,
  isHost: boolean
) {
  const [connected, setConnected] = useState(false);
  
  // Типизируем useState
  const [partyState, setPartyState] = useState<PartyState>({
    participants: [],
    queue: [],
    currentTrack: null,
    isPlaying: false
  });

  useEffect(() => {
    setTimeout(() => {
      setConnected(true);
      setPartyState(prev => ({
        ...prev,
        participants: [{
          id: userId,
          name: userName,
          isHost: isHost
        }]
      }));
    }, 500);
  }, [userId, userName, isHost]);

  const addTrack = useCallback((track: any) => {
    setPartyState(prev => ({
      ...prev,
      queue: [...prev.queue, { 
        ...track, 
        votes: 1, 
        votedBy: [userId], 
        addedBy: userName 
      }]
    }));
  }, [userId, userName]);

  const voteTrack = useCallback((trackId: string, vote: number) => {
    console.log('Vote:', trackId, vote);
  }, []);

  const controlPlayback = useCallback((action: string) => {
    console.log('Control:', action);
  }, []);

  return { connected, partyState, addTrack, voteTrack, controlPlayback };
}
