import Lead from './lead.model.js';
import { AppError, buildPaginationMeta } from '../../utils/index.js';

class LeadService {
  async getAll(query = {}, userId, userRole) {
    const {
      page = 1, limit = 50, search, status, pipeline, assignee, source, budgetRange, priority,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const conditions = [];

    if (search) {
      conditions.push({
        $or: [
          { company: { $regex: search, $options: 'i' } },
          { contactName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { leadId: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (status) conditions.push({ status });
    if (pipeline) conditions.push({ pipeline });
    if (assignee) conditions.push({ assignee });
    if (source) conditions.push({ source });
    if (budgetRange) conditions.push({ budgetRange });
    if (priority !== undefined) conditions.push({ priority });

    // Sales Executives only see leads assigned to them OR created by them
    if (userRole === 'sales_executive') {
      conditions.push({ $or: [{ assignee: userId }, { createdBy: userId }] });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filter),
    ]);

    return { records, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id) {
    const lead = await Lead.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('convertedProject', 'name code status')
      .populate('internalNotes.createdBy', 'name email');

    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    return lead;
  }

  async checkDuplicate(email, company) {
    if (!email && !company) return null;
    const conditions = [];
    if (email) conditions.push({ email });
    if (company) conditions.push({ company: { $regex: `^${company}$`, $options: 'i' } });
    return Lead.findOne({ $or: conditions });
  }

  async create(data, userId) {
    const lead = await Lead.create({ ...data, createdBy: userId });
    return Lead.findById(lead._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');
  }

  async update(id, data) {
    // If status is being changed to 'lost', require lostReason
    if (data.status === 'lost' && !data.lostReason) {
      throw new AppError('Lost reason is required when marking lead as Lost', 400, 'LOST_REASON_REQUIRED');
    }

    const lead = await Lead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

    Object.assign(lead, data);
    await lead.save();

    return Lead.findById(id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');
  }

  async delete(id) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    return lead;
  }

  // Internal notes
  async addNote(leadId, text, userId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    lead.internalNotes.push({ text, createdBy: userId });
    await lead.save();
    return Lead.findById(leadId).populate('internalNotes.createdBy', 'name email');
  }

  async deleteNote(leadId, noteId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    const note = lead.internalNotes.id(noteId);
    if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
    note.deleteOne();
    await lead.save();
    return lead;
  }

  // Convert a won lead into a project
  async convertToProject(leadId, overrides, userId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');
    if (lead.convertedProject) throw new AppError('Lead already converted', 400, 'ALREADY_CONVERTED');

    const Project = (await import('../projects/project.model.js')).default;

    // Map service interest to PMS domains
    const domainMap = {
      web_app: 'coded_web_app',
      mobile_app: 'coded_app',
      shopify: 'shopify',
      ai: 'ai_development',
      automation: 'automation',
    };
    const domains = (lead.serviceInterest || []).map((s) => domainMap[s]).filter(Boolean);

    const projectData = {
      name: overrides?.name || lead.company || lead.contactName,
      description: lead.description || '',
      type: ['fixed_cost'],
      status: 'planning',
      budget: lead.dealValue || 0,
      domains,
      linkedLead: lead._id,
      projectManagers: overrides?.projectManagers || [userId],
      createdBy: userId,
      ...overrides,
    };

    const project = await Project.create(projectData);

    // Auto-create client if doesn't exist
    let clientId = null;
    if (lead.email || lead.company) {
      const Client = (await import('../clients/client.model.js')).default;
      const existing = await Client.findOne({
        $or: [
          ...(lead.company ? [{ company: { $regex: `^${lead.company}$`, $options: 'i' } }] : []),
          ...(lead.email ? [{ 'contacts.email': lead.email }] : []),
        ],
      });
      if (existing) {
        clientId = existing._id;
      } else if (lead.company) {
        const newClient = await Client.create({
          company: lead.company,
          contacts: [{
            name: lead.contactName,
            email: lead.email || '',
            phone: lead.phone || '',
            isPrimary: true,
          }],
          source: lead.source,
          status: 'active',
          sourceLead: lead._id,
          createdBy: userId,
        });
        clientId = newClient._id;
      }
    }

    // Update lead
    lead.convertedProject = project._id;
    lead.status = 'won';
    await lead.save();

    return { project, clientId };
  }

  // ─── CSV Import ──────────────────────────────────────
  // Expects buffer of CSV text with headers:
  //   Date, Name, Project/Post Link, Conversation Link, Technology, Proposal
  async importFromCsv(csvText, userId) {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return { created: 0, skipped: 0, errors: [], total: 0 };
    }

    const errors = [];
    const docsToInsert = [];
    let skipped = 0;

    // Pre-fetch existing conversation links to dedupe in one query
    const existingLinks = new Set(
      (await Lead.find({ conversationLink: { $ne: '' } }).select('conversationLink').lean())
        .map((l) => l.conversationLink)
    );
    // Track within-batch duplicates too
    const seenLinks = new Set();
    const seenNameDate = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNo = i + 2; // +1 for 1-indexed, +1 for header

      const name = (row['Name'] || row['name'] || '').trim();
      if (!name) {
        errors.push({ line: lineNo, error: 'Missing Name' });
        continue;
      }

      const dateStr = (row['Date'] || row['date'] || '').trim();
      const parsedDate = parseDdMmYyyy(dateStr);
      if (dateStr && !parsedDate) {
        errors.push({ line: lineNo, error: `Invalid date "${dateStr}" (expected DD-MM-YYYY)` });
        continue;
      }

      const postLink = (row['Project/Post Link'] || row['Post Link'] || '').trim();
      const conversationLink = (row['Conversation Link'] || '').trim();
      const technology = (row['Technology'] || '').trim();
      const proposalNote = (row['Proposal'] || '').trim();

      // Dedupe
      if (conversationLink) {
        if (existingLinks.has(conversationLink) || seenLinks.has(conversationLink)) {
          skipped++;
          continue;
        }
        seenLinks.add(conversationLink);
      } else {
        const key = `${name.toLowerCase()}|${dateStr}`;
        if (seenNameDate.has(key)) { skipped++; continue; }
        seenNameDate.add(key);
      }

      // Tags from technology (split on , / | or whitespace+slash)
      const tags = technology
        ? technology.split(/[,/|]+/).map((t) => t.trim()).filter(Boolean)
        : [];

      // Try to map technology to serviceInterest enum
      const serviceInterestMap = {
        web: 'web_app', website: 'web_app', 'web app': 'web_app', react: 'web_app', node: 'web_app',
        mobile: 'mobile_app', ios: 'mobile_app', android: 'mobile_app', flutter: 'mobile_app', 'react native': 'mobile_app',
        shopify: 'shopify',
        ai: 'ai', ml: 'ai', llm: 'ai', gpt: 'ai',
        automation: 'automation', zapier: 'automation', n8n: 'automation',
      };
      const serviceInterest = [...new Set(
        tags.map((t) => serviceInterestMap[t.toLowerCase()]).filter(Boolean)
      )];

      const doc = {
        contactName: name,
        source: 'cold_outreach',
        pipeline: 'new_business',
        status: 'new',
        assignee: userId,
        createdBy: userId,
        postLink,
        conversationLink,
        proposalNote,
        tags,
        serviceInterest,
      };
      if (parsedDate) doc.createdAt = parsedDate;

      docsToInsert.push(doc);
    }

    // Bulk insert (run pre-save hooks individually to get leadId)
    let created = 0;
    for (const doc of docsToInsert) {
      try {
        const lead = new Lead(doc);
        // Allow custom createdAt to stick
        if (doc.createdAt) {
          await lead.save();
          await Lead.updateOne({ _id: lead._id }, { $set: { createdAt: doc.createdAt } });
        } else {
          await lead.save();
        }
        created++;
      } catch (e) {
        errors.push({ name: doc.contactName, error: e.message });
      }
    }

    return { total: rows.length, created, skipped, errors };
  }

  async previewCsv(csvText) {
    const rows = parseCsv(csvText);
    return {
      total: rows.length,
      headers: rows[0] ? Object.keys(rows[0]) : [],
      sample: rows.slice(0, 5),
    };
  }
}

// ─── CSV helpers ──────────────────────────────────────

// Minimal RFC4180-ish CSV parser (handles quoted fields with commas/quotes)
function parseCsv(text) {
  const cleaned = text.replace(/^\uFEFF/, ''); // strip BOM
  const lines = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '"') {
      if (inQuotes && cleaned[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur.length > 0 || lines.length > 0) lines.push(cur);
      cur = '';
      if (ch === '\r' && cleaned[i + 1] === '\n') i++;
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) lines.push(cur);

  if (lines.length < 2) return [];

  const splitLine = (line) => {
    const out = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        out.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    out.push(field);
    return out;
  };

  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] != null ? values[idx] : ''; });
    rows.push(obj);
  }
  return rows;
}

function parseDdMmYyyy(str) {
  if (!str) return null;
  // Accept DD-MM-YYYY, DD/MM/YYYY, D-M-YYYY
  const m = str.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

export default new LeadService();
