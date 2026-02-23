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
        }
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
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={message.sender.avatar}
                    alt=""
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {message.sender.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  window.location.href = `/messages/${message.sender._id}`;
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
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
