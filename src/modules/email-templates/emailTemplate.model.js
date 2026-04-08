import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['first_outreach', 'follow_up', 'proposal_cover', 'closing', 'thank_you', 'other'],
      default: 'other',
    },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    variables: [{ type: String }], // detected placeholders like {{client_name}}
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

emailTemplateSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

emailTemplateSchema.index({ category: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
