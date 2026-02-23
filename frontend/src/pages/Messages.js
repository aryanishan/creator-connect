import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';
import { FiSend, FiArrowLeft, FiMoreVertical, FiUser, FiCheck, FiMessageCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Messages.css';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, sendMessage, joinConversation, isOnline, startTyping, stopTyping } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (otherUserId) => {
    try {
      const response = await api.get(`/messages/${otherUserId}`);
      setMessages(response.data);

      // Find and set selected user
      if (response.data.length > 0) {
        const otherUser = response.data[0].sender._id === user._id
          ? response.data[0].receiver
          : response.data[0].sender;
        setSelectedUser(otherUser);
      } else {
        // If no messages yet, fetch user details
        const userResponse = await api.get(`/users/${otherUserId}`);
        setSelectedUser(userResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  }, [user?._id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (userId) {
      fetchConversation(userId);
      joinConversation(userId);
      if (socket) {
        socket.emit('conversation:read', { otherUserId: userId });
      }
    } else {
      setSelectedUser(null);
      setMessages([]);
    }
  }, [userId, fetchConversation, joinConversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageReceived = (message) => {
      const otherUserId = selectedUser?._id;
      const senderId = message?.sender?._id;
      const receiverId = message?.receiver?._id;
      const belongsToSelectedConversation =
        otherUserId &&
        (
          (senderId === otherUserId && receiverId === user._id) ||
          (senderId === user._id && receiverId === otherUserId)
        );

      if (belongsToSelectedConversation) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === message._id)) return prev;
          return [...prev, message];
        });

        if (senderId === otherUserId && receiverId === user._id) {
          socket.emit('conversation:read', { otherUserId });
        }
      }

      fetchConversations();
    };

    const handleConversationUpdated = () => {
      fetchConversations();
    };

    const handleTypingStart = ({ userId: typingUserId, name }) => {
      if (typingUserId === selectedUser?._id) {
        setTypingUser(name || 'Typing');
      }
    };

    const handleTypingStop = ({ userId: typingUserId }) => {
      if (typingUserId === selectedUser?._id) {
        setTypingUser(null);
      }
    };

    const handleMessageRead = ({ readerId }) => {
      if (readerId !== selectedUser?._id) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender._id === user._id && msg.receiver._id === readerId
            ? { ...msg, read: true, readAt: msg.readAt || new Date().toISOString() }
            : msg
        )
      );
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
    };
  }, [socket, user, selectedUser, fetchConversations]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    sendMessage(selectedUser._id, newMessage);
    setNewMessage('');
    stopTyping(selectedUser._id);
  };

  const handleTyping = () => {
    if (!selectedUser) return;

    startTyping(selectedUser._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedUser._id);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return format(date, 'hh:mm a');
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar ${userId ? 'hidden-mobile' : ''}`}>
        <div className="sidebar-header">
          <h2>Messages</h2>
        </div>
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.user._id}
              className={`conversation-item ${conv.user._id === userId ? 'active' : ''}`}
              onClick={() => navigate(`/messages/${conv.user._id}`)}
            >
              <div className="conversation-avatar">
                <img src={conv.user.avatar} alt={conv.user.name} />
                {isOnline(conv.user._id) && <span className="online-dot"></span>}
              </div>
              <div className="conversation-info">
                <div className="conversation-header">
                  <h3 className="conversation-name">{conv.user.name}</h3>
                  <span className="conversation-time">
                    {formatMessageTime(conv.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="conversation-preview">
                  <p className="last-message">
                    {conv.lastMessage.sender._id === user._id ? 'You: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <p className="no-conversations-sub">
                Go to the dashboard to connect with other creators
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`chat-area ${!userId ? 'hidden-mobile' : ''}`}>
        {selectedUser ? (
          <>
            <div className="chat-header">
              <button
                className="back-button"
                onClick={() => navigate('/messages')}
              >
                <FiArrowLeft />
              </button>
              <div className="chat-user-info">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="chat-avatar"
                />
                <div className="chat-user-details">
                  <h3>{selectedUser.name}</h3>
                  <span className={`user-status ${isOnline(selectedUser._id) ? 'online' : ''}`}>
                    {isOnline(selectedUser._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <button className="header-action">
                <FiMoreVertical />
              </button>
            </div>

            <div className="messages-list">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.sender._id === user._id;
                const showAvatar = index === 0 || 
                  messages[index - 1]?.sender._id !== msg.sender._id;
                const showSenderName = !isOwnMessage && showAvatar;

                return (
                  <div
                    key={msg._id}
                    className={`message-wrapper ${isOwnMessage ? 'own' : ''}`}
                  >
                    <div className={`message-block ${isOwnMessage ? 'own' : ''}`}>
                      {showSenderName && (
                        <p className="message-sender-name">{msg.sender.name}</p>
                      )}
                      <div className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
                      <p className="message-content">{msg.content}</p>
                      <div className="message-meta">
                        <span className="message-time">
                          {format(new Date(msg.createdAt), 'hh:mm a')}
                        </span>
                        {isOwnMessage && (
                          <span className="message-status">
                            <FiCheck style={{ opacity: msg.read ? 1 : 0.7 }} />
                          </span>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
              {typingUser && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyUp={handleTyping}
                placeholder="Type a message..."
                className="message-input"
              />
              <button
                type="submit"
                className="send-button"
                disabled={!newMessage.trim()}
              >
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <FiMessageCircle className="no-chat-icon" />
            <h3>Your Messages</h3>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
