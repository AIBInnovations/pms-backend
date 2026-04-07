import mongoose from 'mongoose';
import Activity from './activity.model.js';
import Lead from '../leads/lead.model.js';
import { AppError } from '../../utils/index.js';

class ActivityService {
  async getByLead(leadId) {
    return Activity.find({ lead: leadId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async create(leadId, data, userId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

    const activity = await Activity.create({ ...data, lead: leadId, createdBy: userId });

    // Update lead's lastActivityAt and nextFollowUpAt if applicable
    lead.lastActivityAt = new Date();
    if (data.nextActionDate) {
      lead.nextFollowUpAt = data.nextActionDate;
    }
    await lead.save();

    return Activity.findById(activity._id).populate('createdBy', 'name email avatar');
  }

  async update(id, data) {
    const activity = await Activity.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('createdBy', 'name email avatar');
    if (!activity) throw new AppError('Activity not found', 404, 'NOT_FOUND');
    return activity;
  }

  async delete(id) {
    const activity = await Activity.findByIdAndDelete(id);
    if (!activity) throw new AppError('Activity not found', 404, 'NOT_FOUND');
    return activity;
  }

  // Get upcoming follow-ups (today, tomorrow, this week)
  async getUpcoming(userId, userRole) {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const filter = {
      nextActionDate: { $gte: now, $lte: weekFromNow },
      completed: true, // The activity is logged, but the next action is upcoming
    };

    // For sales executives, only show their own activities
    if (userRole === 'sales_executive') {
      filter.createdBy = userId;
    }

    const activities = await Activity.find(filter)
      .populate('lead', 'leadId contactName company status pipeline')
      .populate('createdBy', 'name email avatar')
      .sort({ nextActionDate: 1 });

    return activities;
  }

  // Get overdue follow-ups
  async getOverdue(userId, userRole) {
    const now = new Date();

    const filter = {
      nextActionDate: { $lt: now, $ne: null },
      completed: true,
    };

    if (userRole === 'sales_executive') {
      filter.createdBy = userId;
    }

    const activities = await Activity.find(filter)
      .populate('lead', 'leadId contactName company status pipeline')
      .populate('createdBy', 'name email avatar')
      .sort({ nextActionDate: 1 });

    // Filter out activities where the lead has had subsequent activities (already followed up)
    const followedUp = new Set();
    for (const a of activities) {
      const newer = await Activity.findOne({
        lead: a.lead._id,
        createdAt: { $gt: a.createdAt },
      });
      if (newer) followedUp.add(a._id.toString());
    }

    return activities.filter((a) => !followedUp.has(a._id.toString()));
  }

  // Get activity counts per lead (for pipeline cards)
  async getCountsByLeads(leadIds) {
    const ids = leadIds.map((id) => new mongoose.Types.ObjectId(id));
    const counts = await Activity.aggregate([
      { $match: { lead: { $in: ids } } },
      { $group: { _id: '$lead', count: { $sum: 1 } } },
    ]);
    return counts.reduce((acc, c) => { acc[c._id.toString()] = c.count; return acc; }, {});
  }
}

export default new ActivityService();
