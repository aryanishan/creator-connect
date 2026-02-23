import Message from '../models/message.js';
import { verifyToken } from '../utils/generateToken.js';
import User from '../models/User.js';

const onlineUsers = new Map();

const addOnlineUserSocket = (userId, socketId) => {
  const existingSockets = onlineUsers.get(userId) || new Set();
  existingSockets.add(socketId);
  onlineUsers.set(userId, existingSockets);
};

const removeOnlineUserSocket = (userId, socketId) => {
  const existingSockets = onlineUsers.get(userId);
  if (!existingSockets) return;

  existingSockets.delete(socketId);
  if (existingSockets.size === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, existingSockets);
  }
};

export const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    const currentUserId = socket.user._id.toString();
    addOnlineUserSocket(currentUserId, socket.id);

    // Broadcast online status to all connected users
    io.emit('user:online', Array.from(onlineUsers.keys()));

    // Join user's personal room
    socket.join(`user:${currentUserId}`);

    // Handle joining a conversation
    socket.on('conversation:join', ({ userId }) => {
      const roomId = getConversationRoomId(currentUserId, userId);
      socket.join(roomId);
    });

    // Handle sending a message
    socket.on('message:send', async ({ receiverId, content }) => {
      try {
        const trimmedContent = content?.trim();
        if (!receiverId || !trimmedContent) {
          socket.emit('error', { message: 'Receiver and message content are required' });
          return;
        }

        // Check if users are connected
        const areConnected = socket.user.connections.some(
          (connectionId) => connectionId.toString() === receiverId
        );
        if (!areConnected) {
          socket.emit('error', { message: 'You can only message connected users' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          content: trimmedContent
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email avatar')
          .populate('receiver', 'name email avatar');

        // Emit once per user room to avoid duplicates across tabs/windows
        io.to(`user:${currentUserId}`).emit('message:received', populatedMessage);
        io.to(`user:${receiverId}`).emit('message:received', populatedMessage);

        // Update conversation list
        io.to(`user:${currentUserId}`).emit('conversation:updated');
        io.to(`user:${receiverId}`).emit('conversation:updated');
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:start', {
          userId: currentUserId,
          name: socket.user.name
        });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:stop', {
          userId: currentUserId
        });
      }
    });

    // Mark current conversation as read and notify the other user in realtime
    socket.on('conversation:read', async ({ otherUserId }) => {
      try {
        if (!otherUserId) return;

        const updated = await Message.updateMany(
          {
            sender: otherUserId,
            receiver: socket.user._id,
            read: false
          },
          {
            read: true,
            readAt: Date.now()
          }
        );

        if (updated.modifiedCount > 0) {
          io.to(`user:${otherUserId}`).emit('message:read', {
            readerId: currentUserId,
            conversationWith: otherUserId
          });
        }

        io.to(`user:${currentUserId}`).emit('conversation:updated');
        io.to(`user:${otherUserId}`).emit('conversation:updated');
      } catch (error) {
        console.error('Socket conversation read error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
      removeOnlineUserSocket(currentUserId, socket.id);
      io.emit('user:online', Array.from(onlineUsers.keys()));
      io.emit('user:offline', currentUserId);
    });
  });
};

const getConversationRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join(':');
};
