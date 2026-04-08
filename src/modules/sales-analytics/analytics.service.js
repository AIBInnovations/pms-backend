import Lead from '../leads/lead.model.js';
import Proposal from '../proposals/proposal.model.js';

// Helper: parse date range from query
function parseRange(query) {
  const end = query.endDate ? new Date(query.endDate) : new Date();
  const start = query.startDate
    ? new Date(query.startDate)
    : new Date(end.getFullYear(), end.getMonth() - 5, 1); // last 6 months default
  return { start, end };
}

class SalesAnalyticsService {
  // Top-line KPIs
  async getOverview(query = {}) {
    const { start, end } = parseRange(query);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const [
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      proposalsCount,
      revenueAgg,
      pipelineValueAgg,
    ] = await Promise.all([
      Lead.countDocuments(dateFilter),
      Lead.countDocuments({ ...dateFilter, status: 'new' }),
      Lead.countDocuments({ ...dateFilter, status: 'won' }),
      Lead.countDocuments({ ...dateFilter, status: 'lost' }),
      Lead.countDocuments({ ...dateFilter, status: { $nin: ['won', 'lost'] } }),
      Proposal.countDocuments(dateFilter),
      Lead.aggregate([
        { $match: { ...dateFilter, status: 'won' } },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]),
      Lead.aggregate([
        { $match: { ...dateFilter, status: { $nin: ['won', 'lost'] } } },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const pipelineValue = pipelineValueAgg[0]?.total || 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const avgDealSize = wonLeads > 0 ? Math.round(revenue / wonLeads) : 0;

    return {
      totalLeads, newLeads, wonLeads, lostLeads, activeLeads,
      proposalsCount, revenue, pipelineValue, conversionRate, avgDealSize,
      range: { start, end },
    };
  }

  // Conversion funnel by stage
  async getFunnel(query = {}) {
    const { start, end } = parseRange(query);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won'];
    const counts = await Lead.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    // Cumulative funnel: count leads that *reached* each stage (anything later or equal)
    const stageOrder = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won'];
    const result = stages.map((stage, i) => {
      const reached = stageOrder.slice(i).reduce((sum, s) => sum + (map[s] || 0), 0);
      return { stage, count: reached };
    });

    return result;
  }

  // Revenue trend by month
  async getRevenueTrend(query = {}) {
    const { start, end } = parseRange(query);

    const data = await Lead.aggregate([
      { $match: { status: 'won', updatedAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
          revenue: { $sum: '$dealValue' },
          deals: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    return data.map((d) => ({
      period: `${d._id.y}-${String(d._id.m).padStart(2, '0')}`,
      revenue: d.revenue,
      deals: d.deals,
    }));
  }

  // Won vs lost breakdown
  async getWonLost(query = {}) {
    const { start, end } = parseRange(query);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const [won, lost, lostReasons] = await Promise.all([
      Lead.aggregate([
        { $match: { ...dateFilter, status: 'won' } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$dealValue' } } },
      ]),
      Lead.aggregate([
        { $match: { ...dateFilter, status: 'lost' } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$dealValue' } } },
      ]),
      Lead.aggregate([
        { $match: { ...dateFilter, status: 'lost' } },
        { $group: { _id: '$lostReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      won: won[0] || { count: 0, value: 0 },
      lost: lost[0] || { count: 0, value: 0 },
      lostReasons: lostReasons.map((r) => ({ reason: r._id || 'unspecified', count: r.count })),
    };
  }

  // Lead source breakdown
  async getSourceReport(query = {}) {
    const { start, end } = parseRange(query);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const data = await Lead.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, { $ifNull: ['$dealValue', 0] }, 0] } },
        },
      },
      {
        $project: {
          source: '$_id',
          total: 1,
          won: 1,
          revenue: 1,
          conversionRate: {
            $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$won', '$total'] }, 100] }, 0],
          },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return data;
  }

  // Pipeline breakdown by pipeline type and stage
  async getPipelineBreakdown(query = {}) {
    const { start, end } = parseRange(query);
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    const data = await Lead.aggregate([
      { $match: { ...dateFilter, status: { $nin: ['won', 'lost'] } } },
      {
        $group: {
          _id: { pipeline: '$pipeline', status: '$status' },
          count: { $sum: 1 },
          value: { $sum: '$dealValue' },
        },
      },
    ]);

    return data.map((d) => ({
      pipeline: d._id.pipeline,
      status: d._id.status,
      count: d.count,
      value: d.value,
    }));
  }
}

export default new SalesAnalyticsService();
