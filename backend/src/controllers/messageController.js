import Message from '../models/message.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import { emitMessageUpdate } from '../socket/socketEmitter.js';

const uploadAttachmentToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'creatorconnect/messages',
      resource_type: 'auto'
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    }
  );

  Readable.from([file.buffer]).pipe(stream);
});

const getAttachmentType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const trimmedContent = content?.trim() || '';
    const hasAttachment = Boolean(req.file);

    if (!receiverId || (!trimmedContent && !hasAttachment)) {
      return res.status(400).json({ message: 'Receiver and message content or attachment is required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if users are connected
    const areConnected = req.user.connections.some(
      (connectionId) => connectionId.toString() === receiverId
    );
    if (!areConnected) {
      return res.status(403).json({ message: 'You can only message connected users' });
    }

    let attachmentData = null;
    if (hasAttachment) {
      const uploaded = await uploadAttachmentToCloudinary(req.file);
      attachmentData = {
        url: uploaded.secure_url,
        fileName: req.file.originalname,
        mediaType: getAttachmentType(req.file.mimetype),
        size: req.file.size
      };
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: trimmedContent,
      attachment: attachmentData || undefined
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar');

    emitMessageUpdate(req.user._id.toString(), receiverId, populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get conversation with a user
// @route   GET /api/messages/:userId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar');

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: Date.now()
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations (last message with each user)
// @route   GET /api/messages/conversations/all
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: 1,
            name: 1,
            email: 1,
            avatar: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: Date.now()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
