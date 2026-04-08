import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'other'], default: 'image' },
    name: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: true }
);

const socialPostSchema = new mongoose.Schema(
  {
    postId: { type: String, unique: true },
    title: { type: String, trim: true, required: true, maxlength: 200 },
    content: { type: String, trim: true, required: true, maxlength: 5000 },

    platforms: {
      type: [String],
      enum: ['instagram', 'linkedin', 'twitter'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one platform is required',
      },
    },

    media: [mediaSchema],
    hashtags: [{ type: String, trim: true }],
    link: { type: String, trim: true, default: '' },

    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['idea', 'draft', 'pending_approval', 'scheduled', 'published', 'rejected', 'archived'],
      default: 'draft',
    },

    rejectionReason: { type: String, trim: true, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },

    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    campaign: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

socialPostSchema.pre('save', async function () {
  if (!this.postId) {
    const seq = await Counter.getNextSequence('social_post');
    this.postId = `POST-${String(seq).padStart(4, '0')}`;
  }
});

socialPostSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

socialPostSchema.index({ status: 1 });
socialPostSchema.index({ scheduledAt: 1 });
socialPostSchema.index({ assignee: 1 });
socialPostSchema.index({ platforms: 1 });
socialPostSchema.index({ campaign: 1 });
socialPostSchema.index({ createdAt: -1 });

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

export default SocialPost;
