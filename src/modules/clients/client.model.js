import mongoose from 'mongoose';
import Counter from '../projects/counter.model.js';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    role: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const importantDateSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const clientSchema = new mongoose.Schema(
  {
    clientId: { type: String, unique: true },
    company: { type: String, trim: true, required: true },
    contacts: [contactSchema],
    source: { type: String, trim: true, default: '' },
    clientSince: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['prospect', 'active', 'on_hold', 'churned'],
      default: 'active',
    },
    tags: [{ type: String, trim: true }],
    importantDates: [importantDateSchema],
    internalNotes: [noteSchema],
    churnReason: { type: String, trim: true, default: '' },
    churnDate: { type: Date, default: null },

    // Optional: link back to the lead this client originated from
    sourceLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

clientSchema.pre('save', async function () {
  if (!this.clientId) {
    const seq = await Counter.getNextSequence('client');
    this.clientId = `CLIENT-${String(seq).padStart(4, '0')}`;
  }
});

clientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

clientSchema.index({ status: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ tags: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
