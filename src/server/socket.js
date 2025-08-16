const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.SOCKET_PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Хранилище активных party
const activeParties = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Присоединение к party
  socket.on('join-party', (data) => {
    const { partyCode, userId, userName, isHost } = data;
    
    socket.join(partyCode);
    
    // Получаем или создаем party
    let party = activeParties.get(partyCode);
    if (!party) {
      party = {
        code: partyCode,
        participants: [],
        queue: [],
        currentTrack: null,
        isPlaying: false
      };
      activeParties.set(partyCode, party);
    }

    // Добавляем участника
    const participant = { id: userId, name: userName, isHost };
    party.participants.push(participant);

    // Отправляем состояние
    socket.emit('party-state', party);

    // Уведомляем всех о новом участнике
    io.to(partyCode).emit('participant-joined', participant);

    console.log(`👥 ${userName} joined party ${partyCode}`);
  });

  // Добавление трека
  socket.on('add-track', (data) => {
    const { partyCode, userId, track } = data;
    const party = activeParties.get(partyCode);
    
    if (!party) return;

    const newTrack = {
      ...track,
      votes: 1,
      addedBy: userId,
      votedBy: [userId]
    };

    party.queue.push(newTrack);
    
    // Если нет текущего трека, начинаем воспроизведение
    if (!party.currentTrack) {
      party.currentTrack = party.queue.shift();
      party.isPlaying = true;
      io.to(partyCode).emit('now-playing', { track: party.currentTrack });
    } else {
      io.to(partyCode).emit('track-added', { track: newTrack });
    }
    
    io.to(partyCode).emit('queue-updated', { queue: party.queue });
  });

  // Голосование
  socket.on('vote-track', (data) => {
    const { partyCode, userId, trackId, vote } = data;
    const party = activeParties.get(partyCode);
    
    if (!party) return;

    const track = party.queue.find(t => t.id === trackId);
    if (!track) return;

    if (vote === 1 && !track.votedBy.includes(userId)) {
      track.votes += 1;
      track.votedBy.push(userId);
    } else if (vote === -1 && track.votedBy.includes(userId)) {
      track.votes -= 1;
      track.votedBy = track.votedBy.filter(id => id !== userId);
    }

    // Сортируем по голосам
    party.queue.sort((a, b) => b.votes - a.votes);

    io.to(partyCode).emit('queue-updated', { queue: party.queue });
  });

  // Управление воспроизведением
  socket.on('playback-control', (data) => {
    const { partyCode, action } = data;
    const party = activeParties.get(partyCode);
    
    if (!party) return;

    if (action === 'skip' && party.queue.length > 0) {
      party.currentTrack = party.queue.shift();
      io.to(partyCode).emit('now-playing', { track: party.currentTrack });
      io.to(partyCode).emit('queue-updated', { queue: party.queue });
    } else if (action === 'skip' && party.queue.length === 0) {
      party.currentTrack = null;
      party.isPlaying = false;
      io.to(partyCode).emit('playback-ended');
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
