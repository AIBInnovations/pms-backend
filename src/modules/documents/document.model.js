import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  content: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

const documentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: ['rich_text', 'file', 'excalidraw'],
      default: 'rich_text',
    },
    content: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['requirement', 'design', 'technical', 'meeting_notes', 'guide', 'other'],
      default: 'other',
    },
    tags: [{ type: String, trim: true }],
    version: {
      type: Number,
      default: 1,
    },
    versions: [versionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Indexes
documentSchema.index({ project: 1, category: 1 });
documentSchema.index({ project: 1, createdAt: -1 });
documentSchema.index({ tags: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
