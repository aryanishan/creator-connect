import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public'
    },
    media: [
      {
        url: {
          type: String,
          required: true
        },
        mediaType: {
          type: String,
          enum: ['image', 'video'],
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
