import React, { useState } from 'react';
import { Copy, Plus, LogIn, Loader2, CheckCircle, Clock, Zap } from 'lucide-react';

const RoomControls = ({ onJoin, onCreate, roomCode, status, isHost }) => {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    await onCreate();
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    await onJoin(inputCode.trim().toUpperCase());
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    waiting: { color: '#f59e0b', label: 'Waiting for opponent...', Icon: Clock },
    active:  { color: '#10b981', label: 'Game in progress',       Icon: Zap },
    finished:{ color: '#6366f1', label: 'Game over',              Icon: CheckCircle },
  };

  const current = statusConfig[status] || statusConfig.waiting;

  return (
    <div className="room-panel glass panel">
      <div className="room-panel-header">
        <span className="logo-chess">♟</span>
        <div>
          <h2 className="room-title">Grandmaster</h2>
          <p className="room-subtitle">Realtime Chess</p>
        </div>
      </div>

      {!roomCode ? (
        <div className="room-actions">
          <button
            id="create-game-btn"
            onClick={handleCreate}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
            Create New Game
          </button>

          <div className="divider"><span>or join existing</span></div>

          <div className="join-form">
            <input
              id="room-code-input"
              type="text"
              placeholder="Enter room code"
              value={inputCode}
              maxLength={6}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="code-input"
            />
            <button
              id="join-game-btn"
              onClick={handleJoin}
              disabled={loading || !inputCode.trim()}
              className="btn-secondary"
            >
              {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
              Join
            </button>
          </div>
        </div>
      ) : (
        <div className="room-info">
          {/* Room Code Display */}
          <div className="code-display">
            <span className="code-label">YOUR ROOM CODE</span>
            <div className="code-value">
              {roomCode.split('').map((char, i) => (
                <span key={i} className="code-char">{char}</span>
              ))}
            </div>
            <button id="copy-code-btn" onClick={copyToClipboard} className="copy-btn">
              {copied ? <CheckCircle size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Status */}
          <div className="status-display">
            <div className="status-dot-wrapper">
              <div className="status-dot" style={{ background: current.color }} />
              <div className="status-dot pulse" style={{ background: current.color }} />
            </div>
            <span className="status-text" style={{ color: current.color }}>{current.label}</span>
          </div>

          {/* Role Badge */}
          <div className="role-badge" style={{ background: isHost ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.5)' }}>
            <span className="role-piece">{isHost ? '♔' : '♚'}</span>
            <div>
              <span className="role-name">You are playing as</span>
              <strong className="role-color">{isHost ? 'White' : 'Black'}</strong>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .room-panel {
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
        }
        .room-panel-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .logo-chess {
          font-size: 2.5rem;
          line-height: 1;
          filter: drop-shadow(0 0 12px rgba(99,102,241,0.6));
        }
        .room-title {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0;
        }
        .room-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .room-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .btn-primary {
          width: 100%;
          padding: 0.9rem;
          font-size: 1rem;
        }
        .btn-secondary {
          padding: 0.9rem 1.2rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .join-form {
          display: flex;
          gap: 0.75rem;
        }
        .code-input {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 4px;
          text-align: center;
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-color);
        }
        .room-info {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .code-display {
          background: rgba(0,0,0,0.25);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .code-label {
          font-size: 0.65rem;
          letter-spacing: 3px;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .code-value {
          display: flex;
          gap: 0.4rem;
        }
        .code-char {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.2rem;
          height: 2.8rem;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 6px;
          font-size: 1.3rem;
          font-weight: 800;
          color: #818cf8;
          letter-spacing: 0;
        }
        .copy-btn {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .copy-btn:hover { background: rgba(99,102,241,0.25); }
        .status-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 0.75rem 1rem;
        }
        .status-dot-wrapper {
          position: relative;
          width: 12px;
          height: 12px;
        }
        .status-dot {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }
        .status-dot.pulse {
          animation: pulseDot 2s ease-out infinite;
        }
        @keyframes pulseDot {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .status-text { font-size: 0.9rem; font-weight: 500; }
        .role-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .role-piece { font-size: 2rem; }
        .role-name {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .role-color {
          font-size: 1rem;
          font-weight: 700;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RoomControls;
