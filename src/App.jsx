import React, { useState } from 'react';
import './App.css';
import RoomControls from './components/RoomControls';
import ChessGame from './components/ChessGame';
import { generateRoomCode, getClientId } from './utils/helpers';
import { supabase } from './lib/supabase';

const clientId = getClientId();

function App() {
  const [roomCode, setRoomCode] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [isHost, setIsHost] = useState(false);

  const handleCreateGame = async () => {
    const code = generateRoomCode();
    const { error } = await supabase.from('games').insert({
      id: code,
      player1_id: clientId,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'white',
      status: 'waiting',
      p1_timer: 600,
      p2_timer: 600,
      history: [],
      chat: [{ sender: 'System', text: `Room ${code} created. Share this code with a friend!`, ts: Date.now() }],
    });

    if (error) {
      console.error('Supabase insert error:', error);
      alert(`Error creating game:\nCode: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details}`);
      return;
    }

    setRoomCode(code);
    setIsHost(true);
    setStatus('waiting');
  };

  const handleJoinGame = async (code) => {
    const { data: room, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', code)
      .single();

    if (error || !room) {
      alert('Room not found. Please check the code and try again.');
      return;
    }

    // Returning player
    if (room.player1_id === clientId) {
      setIsHost(true);
      setRoomCode(code);
      setStatus(room.status);
      return;
    }
    if (room.player2_id === clientId) {
      setIsHost(false);
      setRoomCode(code);
      setStatus(room.status);
      return;
    }

    // New player — join as Player 2
    if (!room.player2_id) {
      const { error: joinErr } = await supabase
        .from('games')
        .update({
          player2_id: clientId,
          status: 'active',
          chat: [
            ...(room.chat || []),
            { sender: 'System', text: 'Player 2 has joined. Game started!', ts: Date.now() },
          ],
        })
        .eq('id', code);

      if (joinErr) {
        alert('Failed to join the game. Please try again.');
        return;
      }
      setIsHost(false);
      setRoomCode(code);
      setStatus('active');
      return;
    }

    // Room full → spectator
    setIsHost(false);
    setRoomCode(code);
    setStatus(room.status);
  };

  return (
    <div className="app-shell">
      <header className="app-header glass">
        <div className="logo">
          <span>♟</span>
          <h1>Grandmaster <em>Realtime</em></h1>
        </div>
        <nav className="nav-links">
          <span className="nav-badge">No login required</span>
        </nav>
      </header>

      <main className="app-main">
        {!roomCode ? (
          /* ── Landing ── */
          <section className="landing">
            <div className="hero">
              <h1>
                Real-time Chess.<br />
                <span className="gradient-text">No accounts. Just play.</span>
              </h1>
              <p>Create a room, share the code, and play instantly with anyone in the world.</p>
            </div>

            <div className="landing-grid">
              <RoomControls
                onCreate={handleCreateGame}
                onJoin={handleJoinGame}
                roomCode={roomCode}
                status={status}
                isHost={isHost}
              />

              <div className="glass panel features">
                <h3>Everything included</h3>
                <ul>
                  <li><span>⚡</span><span>Instant real-time sync via Supabase</span></li>
                  <li><span>♟</span><span>Full chess rules (castling, en passant, promotion)</span></li>
                  <li><span>⏱</span><span>10-minute Blitz timers per player</span></li>
                  <li><span>💬</span><span>In-game chat for both players</span></li>
                  <li><span>👁</span><span>Spectator mode (room full? just watch)</span></li>
                  <li><span>🔄</span><span>Rejoin your game after refresh</span></li>
                  <li><span>📱</span><span>Responsive — works on mobile</span></li>
                </ul>
              </div>
            </div>
          </section>
        ) : (
          /* ── Game Screen ── */
          <section className="game-screen">
            <aside className="game-aside">
              <RoomControls
                onCreate={handleCreateGame}
                onJoin={handleJoinGame}
                roomCode={roomCode}
                status={status}
                isHost={isHost}
              />
            </aside>
            <div className="game-main">
              <ChessGame
                roomCode={roomCode}
                clientId={clientId}
                onStatusChange={setStatus}
              />
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        Built with React &amp; Supabase &mdash; No account needed &mdash; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
