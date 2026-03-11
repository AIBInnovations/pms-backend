import mongoose from 'mongoose';
import Task from '../tasks/task.model.js';
import Project from '../projects/project.model.js';
import User from '../users/user.model.js';

class ReportService {
  async projectProgress(projectId) {
    // Aggregate tasks by stage for the project
    const pipeline = [
      ...(projectId ? [{ $match: { project: new mongoose.Types.ObjectId(projectId) } }] : []),
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ];
    const stageData = await Task.aggregate(pipeline);

    // Total tasks and completion %
    const total = stageData.reduce((sum, s) => sum + s.count, 0);
    const done = stageData.find(s => s._id === 'done')?.count || 0;

    return {
      stages: stageData.map(s => ({ stage: s._id, count: s.count })),
      total,
      completed: done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  async bugSummary(query = {}) {
    const { project } = query;
    const match = { type: 'bug' };
    if (project) match.project = new mongoose.Types.ObjectId(project);

    const [byPriority, byStage] = await Promise.all([
      Task.aggregate([
        { $match: match },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: match },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
    ]);

    return { byPriority, byStage };
  }

  async developerAnalytics(query = {}) {
    const { project } = query;
    const match = {};
    if (project) match.project = new mongoose.Types.ObjectId(project);

    const tasks = await Task.find(match)
      .select('assignees stage stageHistory createdAt dueDate estimatedHours title taskId project')
      .populate('assignees', 'name email avatar')
      .populate('project', 'code name')
      .lean();

    const devMap = new Map();

    for (const task of tasks) {
      if (!task.assignees?.length) continue;

      const history = task.stageHistory || [];

      // Count review bounces (in_review -> todo/in_progress)
      let reviewBounces = 0;
      let reachedReview = false;
      for (const entry of history) {
        if (entry.to === 'in_review') reachedReview = true;
        if (reachedReview && entry.from === 'in_review' && ['todo', 'in_progress'].includes(entry.to)) {
          reviewBounces++;
        }
      }

      // Total times it entered in_review
      const reviewEntries = history.filter(e => e.to === 'in_review').length;

      const isDone = task.stage === 'done';
      const isFirstPass = isDone && reachedReview && reviewBounces === 0;

      // Time to complete: createdAt -> first 'done' transition
      let completionTimeMs = null;
      if (isDone) {
        const doneEntry = history.find(e => e.to === 'done');
        if (doneEntry) completionTimeMs = new Date(doneEntry.changedAt) - new Date(task.createdAt);
      }

      // Dev work time: first in_progress -> first in_review
      let devWorkTimeMs = null;
      const firstInProgress = history.find(e => e.to === 'in_progress');
      const firstInReview = history.find(e => e.to === 'in_review');
      if (firstInProgress && firstInReview) {
        devWorkTimeMs = new Date(firstInReview.changedAt) - new Date(firstInProgress.changedAt);
      }

      for (const assignee of task.assignees) {
        const id = assignee._id.toString();
        if (!devMap.has(id)) {
          devMap.set(id, {
            user: { _id: assignee._id, name: assignee.name, email: assignee.email, avatar: assignee.avatar },
            totalTasks: 0,
            completedTasks: 0,
            reviewBounces: 0,
            totalReviewCycles: 0,
            firstPassCompletions: 0,
            completionTimes: [],
            devWorkTimes: [],
            overdueTasks: 0,
            taskDetails: [],
          });
        }
        const dev = devMap.get(id);
        dev.totalTasks++;
        if (isDone) dev.completedTasks++;
        dev.reviewBounces += reviewBounces;
        dev.totalReviewCycles += reviewEntries;
        if (isFirstPass) dev.firstPassCompletions++;
        if (completionTimeMs !== null) dev.completionTimes.push(completionTimeMs);
        if (devWorkTimeMs !== null) dev.devWorkTimes.push(devWorkTimeMs);
        if (task.dueDate && isDone) {
          const doneEntry = history.find(e => e.to === 'done');
          if (doneEntry && new Date(doneEntry.changedAt) > new Date(task.dueDate)) dev.overdueTasks++;
        }
        dev.taskDetails.push({
          taskId: task.taskId,
          title: task.title,
          project: task.project,
          stage: task.stage,
          reviewBounces,
          reviewCycles: reviewEntries,
          isFirstPass,
          completionTimeMs,
          devWorkTimeMs,
        });
      }
    }

    const msToHours = (ms) => Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
    const results = Array.from(devMap.values()).map((dev) => ({
      user: dev.user,
      totalTasks: dev.totalTasks,
      completedTasks: dev.completedTasks,
      completionRate: dev.totalTasks > 0 ? Math.round((dev.completedTasks / dev.totalTasks) * 100) : 0,
      reviewBounces: dev.reviewBounces,
      totalReviewCycles: dev.totalReviewCycles,
      avgIterationsToComplete: dev.completedTasks > 0
        ? Math.round((dev.totalReviewCycles / dev.completedTasks) * 10) / 10 : 0,
      firstPassCompletions: dev.firstPassCompletions,
      firstPassRate: dev.completedTasks > 0
        ? Math.round((dev.firstPassCompletions / dev.completedTasks) * 100) : 0,
      avgCompletionTimeHours: dev.completionTimes.length > 0
        ? msToHours(dev.completionTimes.reduce((a, b) => a + b, 0) / dev.completionTimes.length) : null,
      avgDevWorkTimeHours: dev.devWorkTimes.length > 0
        ? msToHours(dev.devWorkTimes.reduce((a, b) => a + b, 0) / dev.devWorkTimes.length) : null,
      overdueCompletions: dev.overdueTasks,
      taskDetails: dev.taskDetails,
    }));

    return results.sort((a, b) => b.totalTasks - a.totalTasks);
  }

  async exportCSV(type, query) {
    // Generate CSV string based on report type
    let rows = [];
    let headers = [];

    if (type === 'project-progress') {
      const data = await this.projectProgress(query.project);
      headers = ['Stage', 'Count'];
      rows = data.stages.map(s => [s.stage, s.count]);
    } else if (type === 'bug-summary') {
      const data = await this.bugSummary(query);
      headers = ['Category', 'Value', 'Count'];
      rows = [
        ...data.byPriority.map(s => ['Priority', s._id, s.count]),
        ...data.byStage.map(s => ['Stage', s._id, s.count]),
      ];
    } else if (type === 'developer-analytics') {
      const data = await this.developerAnalytics(query);
      headers = ['Name', 'Email', 'Total Tasks', 'Completed', 'Completion %', 'Review Bounces', 'Avg Iterations', 'First Pass %', 'Avg Completion (hrs)', 'Avg Dev Work (hrs)', 'Overdue'];
      rows = data.map(d => [
        d.user.name, d.user.email, d.totalTasks, d.completedTasks, d.completionRate,
        d.reviewBounces, d.avgIterationsToComplete, d.firstPassRate,
        d.avgCompletionTimeHours ?? '-', d.avgDevWorkTimeHours ?? '-', d.overdueCompletions,
      ]);
    }

    const csvLines = [headers.join(','), ...rows.map(r => r.join(','))];
    return csvLines.join('\n');
  }
}

export default new ReportService();
