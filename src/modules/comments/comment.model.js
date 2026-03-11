import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    commentableType: {
      type: String,
      enum: ['Task', 'Bug', 'Project'],
      required: [true, 'Commentable type is required'],
    },
    commentableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Commentable ID is required'],
      refPath: 'commentableType',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      maxlength: 10000,
    },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        size: { type: Number },
        mimeType: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
commentSchema.index({ commentableType: 1, commentableId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
