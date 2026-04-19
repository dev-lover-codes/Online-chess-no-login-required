import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { supabase } from '../lib/supabase';
import { Send, History, MessageSquare, Eye, Flag, RotateCcw } from 'lucide-react';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const ChessGame = ({ roomCode, clientId, onStatusChange }) => {
  const [game, setGame] = useState(new Chess());
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [myColor, setMyColor] = useState('white');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [status, setStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [moveSquares, setMoveSquares] = useState({});
  const [lastMoveSquares, setLastMoveSquares] = useState({});

  // Advanced Features State
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [timers, setTimers] = useState({ white: 600, black: 600 });
  const [activeTab, setActiveTab] = useState('history');

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const applyGameData = useCallback((data) => {
    const newGame = new Chess(data.fen);
    setGame(newGame);

    const isP1 = data.player1_id === clientId;
    const isP2 = data.player2_id === clientId;

    let color = 'spectator';
    if (isP1) color = 'white';
    else if (isP2) color = 'black';

    setMyColor(color);
    setIsSpectator(color === 'spectator');
    setBoardOrientation(color === 'black' ? 'black' : 'white');
    setIsMyTurn(color !== 'spectator' && newGame.turn() === (color === 'white' ? 'w' : 'b'));
    setStatus(data.status);
    setWinner(data.winner);
    setChat(data.chat || []);
    setHistory(data.history || []);
    setTimers({ white: data.p1_timer ?? 600, black: data.p2_timer ?? 600 });

    if (onStatusChange) onStatusChange(data.status);

    // Highlight last move
    if (data.last_from && data.last_to) {
      setLastMoveSquares({
        [data.last_from]: { background: 'rgba(255, 214, 0, 0.25)' },
        [data.last_to]:   { background: 'rgba(255, 214, 0, 0.4)' },
      });
    }
  }, [clientId, onStatusChange]);

  useEffect(() => {
    let channel;
    const fetchAndSubscribe = async () => {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('id', roomCode)
        .single();
      if (data) applyGameData(data);

      channel = supabase
        .channel(`room-${roomCode}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${roomCode}`,
        }, (payload) => applyGameData(payload.new))
        .subscribe();
    };

    fetchAndSubscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomCode, applyGameData]);

  // Local timer countdown
  useEffect(() => {
    if (status !== 'active' || winner) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimers(prev => {
        const key = game.turn() === 'w' ? 'white' : 'black';
        return { ...prev, [key]: Math.max(0, prev[key] - 1) };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status, winner, game]);

  function onSquareClick(square) {
    if (status !== 'active' || isSpectator || !isMyTurn) return;

    const piece = game.get(square);
    if (piece && piece.color === (myColor === 'white' ? 'w' : 'b')) {
      const moves = game.moves({ square, verbose: true });
      const highlights = {};
      moves.forEach(m => {
        highlights[m.to] = {
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 20%, transparent 20%)',
          borderRadius: '50%',
        };
      });
      highlights[square] = { background: 'rgba(99,102,241,0.3)' };
      setMoveSquares(highlights);
    } else if (Object.keys(moveSquares).includes(square)) {
      // try to move to this square
      const selectedSquare = Object.entries(moveSquares).find(
        ([, v]) => v.background?.includes('rgba(99,102,241,0.3)')
      )?.[0];
      if (selectedSquare) handleMove(selectedSquare, square);
    } else {
      setMoveSquares({});
    }
  }

  function handleMove(from, to) {
    if (!isMyTurn || isSpectator || status !== 'active') return false;

    const gameCopy = new Chess(game.fen());
    let result;
    try {
      result = gameCopy.move({ from, to, promotion: 'q' });
    } catch (e) {
      return false;
    }

    if (!result) return false;

    // --- Optimistic Update ---
    setGame(gameCopy);
    setIsMyTurn(false); // It's no longer my turn after moving
    setMoveSquares({});
    
    // Calculate if game is finished locally
    const gameWinner =
      gameCopy.isCheckmate() ? (gameCopy.turn() === 'w' ? 'black' : 'white') :
      gameCopy.isDraw()      ? 'draw' : null;
    const gameStatus = gameWinner ? 'finished' : 'active';
    const updatedHistory = [...history, result.san];

    if (gameWinner) {
      setWinner(gameWinner);
      setStatus(gameStatus);
    }

    // --- Async Supabase Update ---
    supabase
      .from('games')
      .update({
        fen: gameCopy.fen(),
        turn: gameCopy.turn() === 'w' ? 'white' : 'black',
        status: gameStatus,
        winner: gameWinner,
        history: updatedHistory,
        last_from: from,
        last_to: to,
        p1_timer: timers.white,
        p2_timer: timers.black,
      })
      .eq('id', roomCode)
      .then(({ error }) => {
        if (error) console.error('Error updating game:', error);
      });

    return true;
  }

  function onDrop(sourceSquare, targetSquare) {
    return handleMove(sourceSquare, targetSquare);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;

    const tag = isSpectator ? 'Spectator' : (myColor === 'white' ? 'White ♔' : 'Black ♚');
    const updated = [...chat, { sender: tag, text: message.trim(), ts: Date.now() }];
    setChat(updated);
    setMessage('');

    await supabase
      .from('games')
      .update({ chat: updated })
      .eq('id', roomCode);
  }

  async function handleRestart() {
    await supabase
      .from('games')
      .update({
        fen: STARTING_FEN,
        turn: 'white',
        status: 'active',
        winner: null,
        history: [],
        last_from: null,
        last_to: null,
        p1_timer: 600,
        p2_timer: 600,
        chat: [...chat, { sender: 'System', text: 'Game restarted!', ts: Date.now() }],
      })
      .eq('id', roomCode);
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const currentTurn = game.turn() === 'w' ? 'white' : 'black';

  return (
    <div className="game-root">
      {/* Board Column */}
      <div className="board-col">
        <div className="glass board-card">
          {/* Top player row (opponent) */}
          <div className="player-row top">
            <div className="player-info">
              <span className="player-piece">{myColor === 'white' ? '♚' : '♔'}</span>
              <span className="player-label">{myColor === 'white' ? 'Black (Opponent)' : 'White (Opponent)'}</span>
            </div>
            <div className={`timer-chip ${currentTurn !== myColor ? 'ticking' : ''}`}>
              {formatTime(myColor === 'white' ? timers.black : timers.white)}
            </div>
          </div>

          {/* Chessboard */}
          <div className="board-wrap">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              boardOrientation={boardOrientation}
              customSquareStyles={{ ...lastMoveSquares, ...moveSquares }}
              customDarkSquareStyle={{ backgroundColor: '#1e3a5f' }}
              customLightSquareStyle={{ backgroundColor: '#2d5a8e' }}
              customBoardStyle={{ borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
            {status === 'waiting' && (
              <div className="board-overlay">
                <div className="waiting-msg">
                  <div className="waiting-dots"><span/><span/><span/></div>
                  Waiting for opponent to join…
                </div>
              </div>
            )}
          </div>

          {/* Bottom player row (you) */}
          <div className="player-row bottom">
            <div className="player-info">
              <span className="player-piece">{myColor === 'white' ? '♔' : '♚'}</span>
              <span className="player-label">
                {isSpectator ? '👁 Spectator' : `${myColor === 'white' ? 'White' : 'Black'} (You)`}
              </span>
              {isMyTurn && <span className="your-turn-badge">Your Turn</span>}
            </div>
            <div className={`timer-chip ${currentTurn === myColor && !isSpectator ? 'ticking' : ''}`}>
              {formatTime(myColor === 'white' ? timers.white : timers.black)}
            </div>
          </div>

          {/* In-check / Status bar */}
          {(game.inCheck() || status === 'finished') && (
            <div className={`status-bar ${winner === 'draw' ? 'draw' : winner ? 'checkmate' : 'check'}`}>
              {status === 'finished'
                ? winner === 'draw' ? '½–½ Draw!' : `${winner?.toUpperCase()} wins by Checkmate! 🏆`
                : '⚠️ Check!'}
              {status === 'finished' && !isSpectator && (
                <button onClick={handleRestart} className="restart-btn">
                  <RotateCcw size={14}/> Rematch
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar-col">
        <div className="glass sidebar-card">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15}/> Moves
            </button>
            <button
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={15}/> Chat
            </button>
            {isSpectator && (
              <div className="spectator-tag"><Eye size={13}/> Spectating</div>
            )}
          </div>

          {/* Move History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content history-content">
              {history.length === 0 && (
                <p className="empty-state">No moves yet. Game hasn't started.</p>
              )}
              <div className="move-grid">
                {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                  <div className="move-row" key={i}>
                    <span className="move-num">{i + 1}.</span>
                    <span className="move-san white-move">{history[i * 2] || ''}</span>
                    <span className="move-san black-move">{history[i * 2 + 1] || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="tab-content chat-content">
              <div className="messages">
                {chat.map((c, i) => (
                  <div key={i} className={`chat-bubble ${c.sender === 'System' ? 'system' : ''}`}>
                    <span className="chat-sender">{c.sender}</span>
                    <span className="chat-text">{c.text}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form className="chat-form" onSubmit={sendMessage}>
                <input
                  placeholder="Send a message…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <button type="submit" className="send-btn"><Send size={16}/></button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .game-root {
          display: grid;
          grid-template-columns: minmax(0, 580px) 280px;
          gap: 1.5rem;
          width: 100%;
          align-items: start;
        }
        @media (max-width: 960px) {
          .game-root { grid-template-columns: 1fr; }
        }

        /* Board Card */
        .board-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .board-wrap { position: relative; width: 100%; }
        .board-wrap > div { width: 100% !important; }

        /* Player Rows */
        .player-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .player-info { display: flex; align-items: center; gap: 0.5rem; }
        .player-piece { font-size: 1.5rem; }
        .player-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; }

        .your-turn-badge {
          background: var(--success-color);
          color: #000;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          animation: glow 1.5s ease-in-out infinite alternate;
        }
        @keyframes glow {
          from { box-shadow: 0 0 4px var(--success-color); }
          to   { box-shadow: 0 0 12px var(--success-color); }
        }

        .timer-chip {
          font-family: 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-color);
          letter-spacing: 1px;
          transition: var(--transition);
        }
        .timer-chip.ticking {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          color: #818cf8;
          box-shadow: 0 0 15px rgba(99,102,241,0.2);
        }

        /* Status Bar */
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          animation: slideIn 0.3s ease;
        }
        .status-bar.check    { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
        .status-bar.checkmate{ background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
        .status-bar.draw     { background: rgba(245,158,11,0.15); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        .restart-btn {
          background: transparent;
          border: 1px solid currentColor;
          padding: 0.3rem 0.75rem;
          font-size: 0.8rem;
        }
        .restart-btn:hover { background: rgba(255,255,255,0.1); transform: none; box-shadow: none; }

        /* Waiting overlay */
        .board-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8,15,30,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          backdrop-filter: blur(4px);
          z-index: 5;
        }
        .waiting-msg {
          text-align: center;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .waiting-dots { display: flex; gap: 6px; }
        .waiting-dots span {
          width: 8px; height: 8px;
          background: var(--accent-color);
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
        .waiting-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Sidebar */
        .sidebar-card {
          display: flex;
          flex-direction: column;
          height: 520px;
          padding: 0;
          overflow: hidden;
        }
        .tabs {
          display: flex;
          gap: 2px;
          padding: 0.75rem 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
          align-items: center;
        }
        .tab {
          background: transparent;
          border: none;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: 8px 8px 0 0;
          box-shadow: none;
          transform: none;
          gap: 5px;
        }
        .tab:hover { background: rgba(255,255,255,0.05); transform: none; box-shadow: none; color: var(--text-primary); }
        .tab.active { background: rgba(99,102,241,0.15); color: #818cf8; }
        .spectator-tag {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: var(--warning-color);
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Move History */
        .history-content {}
        .empty-state { color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding-top: 2rem; }
        .move-grid { display: flex; flex-direction: column; gap: 2px; }
        .move-row {
          display: grid;
          grid-template-columns: 28px 1fr 1fr;
          gap: 4px;
          align-items: center;
          padding: 4px 6px;
          border-radius: 4px;
        }
        .move-row:nth-child(even) { background: rgba(255,255,255,0.03); }
        .move-num { font-size: 0.75rem; color: var(--text-secondary); }
        .move-san {
          font-size: 0.9rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .white-move { background: rgba(255,255,255,0.06); }
        .black-move { background: rgba(0,0,0,0.2); }

        /* Chat */
        .chat-content { }
        .messages { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .chat-bubble {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          font-size: 0.85rem;
          animation: slideIn 0.2s ease;
        }
        .chat-bubble.system {
          background: rgba(99,102,241,0.08);
          border-left: 2px solid var(--accent-color);
          font-style: italic;
        }
        .chat-sender { font-size: 0.72rem; font-weight: 700; color: var(--accent-hover); }
        .chat-text { color: var(--text-primary); line-height: 1.4; }
        .chat-form {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }
        .send-btn { padding: 0.6rem; flex-shrink: 0; }
      `}</style>
    </div>
  );
};

export default ChessGame;
