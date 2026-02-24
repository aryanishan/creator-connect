import Asset from '../models/Asset.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

const mapMediaFile = (file) => ({
  url: file.url,
  mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image'
});

const uploadBufferToCloudinary = (file) => {
  const options = {
    folder: 'creatorconnect/assets',
    resource_type: 'auto'
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    // Wrap buffer in an array so stream emits a single Buffer chunk (not byte-by-byte numbers).
    Readable.from([file.buffer]).pipe(stream);
  });
};

// @desc    Create an asset
// @route   POST /api/assets
// @access  Private
export const createAsset = async (req, res) => {
  try {
    const { title, description = '', visibility = 'public' } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!['public', 'private', 'unlisted'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image or video is required' });
    }

    const uploadedMedia = await Promise.all(
      req.files.map(async (file) => {
        const uploadResult = await uploadBufferToCloudinary(file);
        return {
          ...file,
          url: uploadResult.secure_url
        };
      })
    );

    const asset = await Asset.create({
      owner: req.user._id,
      title: title.trim(),
      description: description.trim(),
      visibility,
      media: uploadedMedia.map(mapMediaFile)
    });

    const populatedAsset = await Asset.findById(asset._id).populate('owner', 'name avatar');

    res.status(201).json(populatedAsset);
  } catch (error) {
    console.error('Create asset error:', error);
    const message =
      error?.message ||
      error?.error?.message ||
      (typeof error === 'string' ? error : 'Failed to upload asset media');
    res.status(500).json({ message });
  }
};

// @desc    Get public assets feed
// @route   GET /api/assets
// @access  Private
export const getPublicAssets = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { visibility: 'public' };

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .populate('owner', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user's assets (optionally filtered by visibility)
// @route   GET /api/assets/me
// @access  Private
export const getMyAssets = async (req, res) => {
  try {
    const { visibility } = req.query;
    const query = { owner: req.user._id };

    if (visibility && ['public', 'private', 'unlisted'].includes(visibility)) {
      query.visibility = visibility;
    }

    const assets = await Asset.find(query)
      .populate('owner', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(assets);
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single asset (for public/unlisted/private owner)
// @route   GET /api/assets/:id
// @access  Private
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('owner', 'name avatar');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const isOwner = asset.owner._id.toString() === req.user._id.toString();

    if (asset.visibility === 'private' && !isOwner) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Get asset detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an asset (owner only)
// @route   PUT /api/assets/:id
// @access  Private
export const updateAsset = async (req, res) => {
  try {
    const { title, description = '', visibility } = req.body;

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this asset' });
    }

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!['public', 'private', 'unlisted'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value' });
    }

    asset.title = title.trim();
    asset.description = description.trim();
    asset.visibility = visibility;

    const updatedAsset = await asset.save();
    const populatedAsset = await Asset.findById(updatedAsset._id).populate('owner', 'name avatar');

    return res.json(populatedAsset);
  } catch (error) {
    console.error('Update asset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an asset (owner only)
// @route   DELETE /api/assets/:id
// @access  Private
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this asset' });
    }

    await asset.deleteOne();
    return res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
