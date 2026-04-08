import Target from './target.model.js';
import Lead from '../leads/lead.model.js';
import Proposal from '../proposals/proposal.model.js';
import { AppError } from '../../utils/index.js';

// Helper: get start/end of a period from periodKey
function getPeriodRange(period, periodKey) {
  if (period === 'month') {
    // periodKey: "2026-04"
    const [y, m] = periodKey.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    return { start, end };
  } else if (period === 'quarter') {
    // periodKey: "2026-Q2"
    const [y, q] = periodKey.split('-Q');
    const year = Number(y);
    const quarter = Number(q);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 1);
    return { start, end };
  }
  return { start: new Date(0), end: new Date() };
}

// Helper: current period key
export function currentPeriodKey(period) {
  const now = new Date();
  if (period === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  } else {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${q}`;
  }
}

class TargetService {
  async getAll(query = {}) {
    const filter = {};
    if (query.type) filter.type = query.type;
    if (query.user) filter.user = query.user;
    if (query.periodKey) filter.periodKey = query.periodKey;
    return Target.find(filter)
      .populate('user', 'name email avatar role')
      .populate('createdBy', 'name email')
      .sort({ periodKey: -1 });
  }

  async create(data, userId) {
    return Target.create({ ...data, createdBy: userId });
  }

  async update(id, data) {
    const target = await Target.findByIdAndUpdate(id, data, { new: true })
      .populate('user', 'name email avatar role');
    if (!target) throw new AppError('Target not found', 404, 'NOT_FOUND');
    return target;
  }

  async delete(id) {
    const target = await Target.findByIdAndDelete(id);
    if (!target) throw new AppError('Target not found', 404, 'NOT_FOUND');
    return target;
  }

  // Calculate progress for a single target
  async getProgress(target) {
    const { start, end } = getPeriodRange(target.period, target.periodKey);

    const leadFilter = {
      createdAt: { $gte: start, $lt: end },
      ...(target.type === 'user' ? { $or: [{ assignee: target.user }, { createdBy: target.user }] } : {}),
    };

    const proposalFilter = {
      createdAt: { $gte: start, $lt: end },
      ...(target.type === 'user' ? { createdBy: target.user } : {}),
    };

    const wonFilter = {
      ...leadFilter,
      status: 'won',
    };

    const [leadsCount, proposalsCount, wonLeads] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Proposal.countDocuments(proposalFilter),
      Lead.find(wonFilter).select('dealValue'),
    ]);

    const dealsCount = wonLeads.length;
    const revenue = wonLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);

    return {
      leadsTarget: target.leadsTarget,
      leadsActual: leadsCount,
      leadsPct: target.leadsTarget > 0 ? Math.round((leadsCount / target.leadsTarget) * 100) : 0,

      proposalsTarget: target.proposalsTarget,
      proposalsActual: proposalsCount,
      proposalsPct: target.proposalsTarget > 0 ? Math.round((proposalsCount / target.proposalsTarget) * 100) : 0,

      dealsTarget: target.dealsTarget,
      dealsActual: dealsCount,
      dealsPct: target.dealsTarget > 0 ? Math.round((dealsCount / target.dealsTarget) * 100) : 0,

      revenueTarget: target.revenueTarget,
      revenueActual: revenue,
      revenuePct: target.revenueTarget > 0 ? Math.round((revenue / target.revenueTarget) * 100) : 0,

      // Pace: % of period elapsed
      paceElapsed: Math.min(100, Math.round(((Date.now() - start.getTime()) / (end.getTime() - start.getTime())) * 100)),
    };
  }

  // Get progress for a target by ID
  async getProgressById(id) {
    const target = await Target.findById(id).populate('user', 'name email avatar role');
    if (!target) throw new AppError('Target not found', 404, 'NOT_FOUND');
    const progress = await this.getProgress(target);
    return { target, progress };
  }

  // Get all targets for current period with progress
  async getCurrentWithProgress() {
    const monthKey = currentPeriodKey('month');
    const quarterKey = currentPeriodKey('quarter');
    const targets = await Target.find({
      $or: [
        { period: 'month', periodKey: monthKey },
        { period: 'quarter', periodKey: quarterKey },
      ],
    })
      .populate('user', 'name email avatar role');

    const results = await Promise.all(
      targets.map(async (t) => ({ target: t, progress: await this.getProgress(t) }))
    );
    return results;
  }

  // Leaderboard: per-user stats for current month
  async getLeaderboard(periodKey) {
    const period = periodKey.includes('Q') ? 'quarter' : 'month';
    const { start, end } = getPeriodRange(period, periodKey);

    const leadsByUser = await Lead.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$assignee',
          leadsCount: { $sum: 1 },
          wonCount: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'won'] }, { $ifNull: ['$dealValue', 0] }, 0],
            },
          },
        },
      },
      { $match: { _id: { $ne: null } } },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: '$user' },
      {
        $project: {
          user: { _id: '$user._id', name: '$user.name', avatar: '$user.avatar', email: '$user.email' },
          leadsCount: 1,
          wonCount: 1,
          revenue: 1,
          conversionRate: {
            $cond: [{ $gt: ['$leadsCount', 0] }, { $multiply: [{ $divide: ['$wonCount', '$leadsCount'] }, 100] }, 0],
          },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return leadsByUser;
  }
}

export default new TargetService();
