import React, { createContext, useState, useContext, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('user:online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user:offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      newSocket.on('message:received', (message) => {
        if (message?.sender?._id === user?._id) return;

        toast.custom((t) => (
          <div
            style={{
              width: '320px',
              background: '#fff',
              border: '1px solid #d9e2ee',
              borderRadius: '12px',
              boxShadow: '0 12px 28px rgba(15, 31, 51, 0.18)',
              overflow: 'hidden',
              fontFamily: 'Manrope, Segoe UI, sans-serif'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', padding: '12px' }}>
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #d5e3f2',
                  flexShrink: 0
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#0f1f33'
                  }}
                >
                  {message.sender.name}
                </p>
                <p
                  style={{
                    margin: '3px 0 0 0',
                    fontSize: '0.84rem',
                    color: '#5b6d83',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {message.content}
                </p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e4ebf3', display: 'flex' }}>
              <button
                onClick={() => {
                  window.location.href = `/messages/${message.sender._id}`;
                  toast.dismiss(t.id);
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: '#0f7bff',
                  cursor: 'pointer'
                }}
              >
                Reply
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
        });
      });

      newSocket.on('error', (error) => {
        toast.error(error.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinConversation = (userId) => {
    if (socket) {
      socket.emit('conversation:join', { userId });
    }
  };

  const sendMessage = (receiverId, content) => {
    if (socket) {
      socket.emit('message:send', { receiverId, content });
    }
  };

  const startTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing:start', { receiverId });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing:stop', { receiverId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    isOnline: (userId) => onlineUsers.includes(userId)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
