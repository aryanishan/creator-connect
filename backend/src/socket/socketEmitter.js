let socketServer = null;

export const setSocketServer = (io) => {
  socketServer = io;
};

export const emitMessageUpdate = (senderId, receiverId, message) => {
  if (!socketServer) return;

  socketServer.to(`user:${senderId}`).emit('message:received', message);
  socketServer.to(`user:${receiverId}`).emit('message:received', message);
  socketServer.to(`user:${senderId}`).emit('conversation:updated');
  socketServer.to(`user:${receiverId}`).emit('conversation:updated');
};
