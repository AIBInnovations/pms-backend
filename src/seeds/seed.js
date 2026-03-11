import mongoose from 'mongoose';
import { env, logger } from '../config/index.js';
import User from '../modules/users/user.model.js';
import Counter from '../modules/projects/counter.model.js';
import Project from '../modules/projects/project.model.js';
import Milestone from '../modules/projects/milestone.model.js';
import Task from '../modules/tasks/task.model.js';
import Bug from '../modules/bugs/bug.model.js';
import Document from '../modules/documents/document.model.js';
import Comment from '../modules/comments/comment.model.js';
import Activity from '../modules/notifications/activity.model.js';
import Notification from '../modules/notifications/notification.model.js';
import NotificationPreference from '../modules/notifications/preference.model.js';
import AuditLog from '../modules/notifications/audit.model.js';
import Settings from '../modules/settings/settings.model.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const today = new Date();
const daysAgo = (n) => new Date(today.getTime() - n * 86400000);
const daysFromNow = (n) => new Date(today.getTime() + n * 86400000);

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('Connected to MongoDB for seeding');

    // Clear all collections
    logger.info('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Counter.deleteMany({}),
      Project.deleteMany({}),
      Milestone.deleteMany({}),
      Task.deleteMany({}),
      Bug.deleteMany({}),
      Document.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
      Notification.deleteMany({}),
      NotificationPreference.deleteMany({}),
      AuditLog.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // -----------------------------------------------------------------------
    // 1. Users
    // -----------------------------------------------------------------------
    logger.info('Seeding users...');
    const users = await User.create([
      {
        name: 'Super Admin',
        email: 'admin@pms.com',
        password: 'Admin@123',
        role: 'super_admin',
        designation: 'System Administrator',
        phone: '+1 555 100 0001',
        skills: ['Administration', 'System Management'],
        status: 'active',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@pms.com',
        password: 'Admin@123',
        role: 'project_manager',
        designation: 'Senior Project Manager',
        phone: '+1 555 100 0002',
        skills: ['Agile', 'Scrum', 'Risk Management', 'Stakeholder Communication'],
        status: 'active',
      },
      {
        name: 'Mike Chen',
        email: 'mike@pms.com',
        password: 'Admin@123',
        role: 'project_manager',
        designation: 'Project Manager',
        phone: '+1 555 100 0003',
        skills: ['Kanban', 'Lean', 'JIRA', 'Resource Planning'],
        status: 'active',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@pms.com',
        password: 'Admin@123',
        role: 'developer',
        designation: 'Senior Full-Stack Developer',
        phone: '+1 555 100 0004',
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
        status: 'active',
      },
      {
        name: 'Alex Rivera',
        email: 'alex@pms.com',
        password: 'Admin@123',
        role: 'developer',
        designation: 'Frontend Developer',
        phone: '+1 555 100 0005',
        skills: ['React', 'Vue.js', 'Tailwind CSS', 'Figma'],
        status: 'active',
      },
      {
        name: 'Emily Watson',
        email: 'emily@pms.com',
        password: 'Admin@123',
        role: 'developer',
        designation: 'Backend Developer',
        phone: '+1 555 100 0006',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
        status: 'active',
      },
      {
        name: 'James Park',
        email: 'james@pms.com',
        password: 'Admin@123',
        role: 'developer',
        designation: 'Mobile Developer',
        phone: '+1 555 100 0007',
        skills: ['React Native', 'Swift', 'Kotlin', 'Firebase'],
        status: 'active',
      },
      {
        name: 'Olivia Brown',
        email: 'olivia@pms.com',
        password: 'Admin@123',
        role: 'developer',
        designation: 'QA Engineer',
        phone: '+1 555 100 0008',
        skills: ['Selenium', 'Cypress', 'Jest', 'Playwright', 'API Testing'],
        status: 'active',
      },
    ]);

    const [admin, sarah, mike, priya, alex, emily, james, olivia] = users;
    logger.info(`  Created ${users.length} users`);

    // -----------------------------------------------------------------------
    // 2. Projects (use .save() to trigger auto-code generation)
    // -----------------------------------------------------------------------
    logger.info('Seeding projects...');

    const proj1 = await new Project({
      name: 'E-Commerce Platform',
      description: 'A full-featured online marketplace with product catalog, shopping cart, payment integration, and order management system.',
      type: 'fixed_cost',
      status: 'active',
      startDate: daysAgo(60),
      endDate: daysFromNow(90),
      budget: 150000,
      projectManager: sarah._id,
      developers: [priya._id, alex._id, emily._id],
      createdBy: admin._id,
    }).save();

    const proj2 = await new Project({
      name: 'CRM Dashboard',
      description: 'Customer relationship management dashboard with analytics, lead tracking, and automated email campaigns.',
      type: 'time_and_material',
      status: 'active',
      startDate: daysAgo(30),
      endDate: daysFromNow(120),
      budget: 80000,
      projectManager: mike._id,
      developers: [priya._id, james._id, olivia._id],
      createdBy: admin._id,
    }).save();

    const proj3 = await new Project({
      name: 'Mobile Banking App',
      description: 'Cross-platform mobile banking application with biometric authentication, transaction management, and bill payments.',
      type: 'retainer',
      status: 'planning',
      startDate: daysFromNow(14),
      endDate: daysFromNow(180),
      budget: 200000,
      projectManager: sarah._id,
      developers: [james._id, alex._id],
      createdBy: sarah._id,
    }).save();

    const proj4 = await new Project({
      name: 'Analytics Engine',
      description: 'Real-time data analytics platform with custom dashboards, automated reporting, and machine learning insights.',
      type: 'time_and_material',
      status: 'completed',
      startDate: daysAgo(180),
      endDate: daysAgo(10),
      budget: 120000,
      projectManager: mike._id,
      developers: [emily._id, priya._id, olivia._id],
      createdBy: admin._id,
    }).save();

    const projects = [proj1, proj2, proj3, proj4];
    logger.info(`  Created ${projects.length} projects`);

    // -----------------------------------------------------------------------
    // 3. Milestones
    // -----------------------------------------------------------------------
    logger.info('Seeding milestones...');
    const milestones = await Milestone.create([
      { project: proj1._id, title: 'MVP Launch', description: 'Minimal viable product with core shopping features', dueDate: daysFromNow(30), status: 'in_progress', createdBy: sarah._id },
      { project: proj1._id, title: 'Payment Integration', description: 'Stripe and PayPal payment gateway integration', dueDate: daysFromNow(60), status: 'pending', createdBy: sarah._id },
      { project: proj1._id, title: 'Final Release', description: 'Production deployment with all features', dueDate: daysFromNow(90), status: 'pending', createdBy: sarah._id },
      { project: proj2._id, title: 'Alpha Release', description: 'Core CRM features for internal testing', dueDate: daysFromNow(20), status: 'in_progress', createdBy: mike._id },
      { project: proj2._id, title: 'Beta Release', description: 'Feature-complete release for beta testers', dueDate: daysFromNow(75), status: 'pending', createdBy: mike._id },
      { project: proj3._id, title: 'Design Approval', description: 'UI/UX design sign-off from stakeholders', dueDate: daysFromNow(28), status: 'pending', createdBy: sarah._id },
      { project: proj3._id, title: 'Prototype Demo', description: 'Working prototype for client review', dueDate: daysFromNow(60), status: 'pending', createdBy: sarah._id },
      { project: proj4._id, title: 'Data Pipeline Complete', description: 'ETL pipeline and data warehouse setup', dueDate: daysAgo(90), status: 'completed', createdBy: mike._id },
      { project: proj4._id, title: 'Dashboard Delivery', description: 'All custom dashboards delivered and tested', dueDate: daysAgo(30), status: 'completed', createdBy: mike._id },
    ]);
    logger.info(`  Created ${milestones.length} milestones`);

    // -----------------------------------------------------------------------
    // 4. Tasks (use .save() individually to trigger taskId auto-generation)
    // -----------------------------------------------------------------------
    logger.info('Seeding tasks...');
    const taskDefs = [
      // --- Project 1: E-Commerce ---
      { project: proj1._id, title: 'Design product catalog UI', type: 'feature', priority: 'high', stage: 'done', assignees: [alex._id], dueDate: daysAgo(10), estimatedHours: 16, progress: 100, milestone: milestones[0]._id, checklists: [{ text: 'Wireframes', checked: true }, { text: 'Component library', checked: true }, { text: 'Responsive design', checked: true }], createdBy: sarah._id },
      { project: proj1._id, title: 'Implement product search and filters', type: 'feature', priority: 'high', stage: 'in_review', assignees: [priya._id], dueDate: daysFromNow(5), estimatedHours: 24, progress: 80, milestone: milestones[0]._id, checklists: [{ text: 'Full-text search', checked: true }, { text: 'Category filter', checked: true }, { text: 'Price range filter', checked: false }], createdBy: sarah._id },
      { project: proj1._id, title: 'Shopping cart functionality', type: 'feature', priority: 'critical', stage: 'in_progress', assignees: [priya._id, emily._id], dueDate: daysFromNow(12), estimatedHours: 32, progress: 45, milestone: milestones[0]._id, createdBy: sarah._id },
      { project: proj1._id, title: 'Stripe payment gateway', type: 'feature', priority: 'critical', stage: 'todo', assignees: [emily._id], dueDate: daysFromNow(40), estimatedHours: 40, progress: 0, milestone: milestones[1]._id, createdBy: sarah._id },
      { project: proj1._id, title: 'PayPal integration', type: 'feature', priority: 'high', stage: 'backlog', assignees: [emily._id], dueDate: daysFromNow(55), estimatedHours: 24, progress: 0, milestone: milestones[1]._id, createdBy: sarah._id },
      { project: proj1._id, title: 'Order management system', type: 'feature', priority: 'high', stage: 'todo', assignees: [priya._id], dueDate: daysFromNow(35), estimatedHours: 36, progress: 0, createdBy: sarah._id },
      { project: proj1._id, title: 'Email notification templates', type: 'improvement', priority: 'medium', stage: 'backlog', assignees: [alex._id], dueDate: daysFromNow(70), estimatedHours: 12, progress: 0, createdBy: sarah._id },
      { project: proj1._id, title: 'Product image optimization', type: 'improvement', priority: 'low', stage: 'backlog', assignees: [], dueDate: daysFromNow(80), estimatedHours: 8, progress: 0, createdBy: sarah._id },
      { project: proj1._id, title: 'Performance testing', type: 'research', priority: 'medium', stage: 'backlog', assignees: [olivia._id], estimatedHours: 16, progress: 0, createdBy: sarah._id },

      // --- Project 2: CRM Dashboard ---
      { project: proj2._id, title: 'Lead management module', type: 'feature', priority: 'critical', stage: 'in_progress', assignees: [priya._id], dueDate: daysFromNow(10), estimatedHours: 40, progress: 60, milestone: milestones[3]._id, createdBy: mike._id },
      { project: proj2._id, title: 'Contact import from CSV', type: 'feature', priority: 'high', stage: 'done', assignees: [james._id], dueDate: daysAgo(5), estimatedHours: 16, progress: 100, milestone: milestones[3]._id, createdBy: mike._id },
      { project: proj2._id, title: 'Analytics dashboard widgets', type: 'feature', priority: 'high', stage: 'in_progress', assignees: [james._id, priya._id], dueDate: daysFromNow(15), estimatedHours: 32, progress: 35, milestone: milestones[3]._id, checklists: [{ text: 'Revenue chart', checked: true }, { text: 'Pipeline funnel', checked: false }, { text: 'Activity timeline', checked: false }], createdBy: mike._id },
      { project: proj2._id, title: 'Email campaign automation', type: 'feature', priority: 'medium', stage: 'todo', assignees: [priya._id], dueDate: daysFromNow(45), estimatedHours: 48, progress: 0, milestone: milestones[4]._id, createdBy: mike._id },
      { project: proj2._id, title: 'Write API integration tests', type: 'research', priority: 'medium', stage: 'todo', assignees: [olivia._id], dueDate: daysFromNow(18), estimatedHours: 20, progress: 0, createdBy: mike._id },
      { project: proj2._id, title: 'Role-based access control', type: 'feature', priority: 'high', stage: 'testing', assignees: [priya._id], dueDate: daysFromNow(8), estimatedHours: 24, progress: 90, createdBy: mike._id },
      { project: proj2._id, title: 'Customer activity timeline', type: 'feature', priority: 'medium', stage: 'backlog', assignees: [], estimatedHours: 20, progress: 0, createdBy: mike._id },

      // --- Project 3: Mobile Banking ---
      { project: proj3._id, title: 'Research biometric auth libraries', type: 'research', priority: 'high', stage: 'todo', assignees: [james._id], dueDate: daysFromNow(21), estimatedHours: 12, progress: 0, milestone: milestones[5]._id, createdBy: sarah._id },
      { project: proj3._id, title: 'Design app wireframes', type: 'feature', priority: 'critical', stage: 'todo', assignees: [alex._id], dueDate: daysFromNow(25), estimatedHours: 24, progress: 0, milestone: milestones[5]._id, createdBy: sarah._id },
      { project: proj3._id, title: 'Define API contract', type: 'research', priority: 'high', stage: 'backlog', assignees: [james._id], estimatedHours: 16, progress: 0, createdBy: sarah._id },

      // --- Project 4: Analytics Engine (completed) ---
      { project: proj4._id, title: 'ETL pipeline implementation', type: 'feature', priority: 'critical', stage: 'done', assignees: [emily._id], dueDate: daysAgo(100), estimatedHours: 60, actualHours: 72, progress: 100, milestone: milestones[7]._id, createdBy: mike._id },
      { project: proj4._id, title: 'Real-time data streaming', type: 'feature', priority: 'high', stage: 'done', assignees: [emily._id, priya._id], dueDate: daysAgo(70), estimatedHours: 48, actualHours: 52, progress: 100, milestone: milestones[7]._id, createdBy: mike._id },
      { project: proj4._id, title: 'Custom dashboard builder', type: 'feature', priority: 'high', stage: 'done', assignees: [priya._id], dueDate: daysAgo(40), estimatedHours: 36, actualHours: 40, progress: 100, milestone: milestones[8]._id, createdBy: mike._id },
      { project: proj4._id, title: 'Automated report scheduling', type: 'feature', priority: 'medium', stage: 'done', assignees: [olivia._id, emily._id], dueDate: daysAgo(20), estimatedHours: 28, actualHours: 30, progress: 100, milestone: milestones[8]._id, createdBy: mike._id },
      { project: proj4._id, title: 'ML anomaly detection', type: 'research', priority: 'low', stage: 'done', assignees: [emily._id], dueDate: daysAgo(15), estimatedHours: 40, actualHours: 45, progress: 100, createdBy: mike._id },
    ];

    const tasks = [];
    for (const def of taskDefs) {
      const task = await new Task({ ...def }).save();
      tasks.push(task);
    }
    logger.info(`  Created ${tasks.length} tasks`);

    // Create a couple of subtasks
    const subtask1 = await new Task({ project: proj1._id, title: 'Add to cart API endpoint', type: 'feature', priority: 'critical', stage: 'in_progress', assignees: [emily._id], estimatedHours: 8, progress: 50, parentTask: tasks[2]._id, createdBy: sarah._id }).save();
    const subtask2 = await new Task({ project: proj1._id, title: 'Cart UI component', type: 'feature', priority: 'high', stage: 'todo', assignees: [alex._id], estimatedHours: 12, progress: 0, parentTask: tasks[2]._id, createdBy: sarah._id }).save();
    tasks.push(subtask1, subtask2);
    logger.info(`  Created 2 subtasks`);

    // -----------------------------------------------------------------------
    // 5. Bugs
    // -----------------------------------------------------------------------
    logger.info('Seeding bugs...');
    const bugDefs = [
      { project: proj1._id, title: 'Product images not loading on Safari', severity: 'major', priority: 'high', status: 'open', environment: 'Safari 17.2 / macOS Sonoma', stepsToReproduce: '1. Open Safari\n2. Navigate to product listing\n3. Observe broken image placeholders', expectedResult: 'Product images display correctly', actualResult: 'Images show broken placeholder icons', assignee: alex._id, reporter: olivia._id },
      { project: proj1._id, title: 'Cart total rounds incorrectly', severity: 'critical', priority: 'critical', status: 'in_progress', environment: 'Chrome 121 / Windows 11', stepsToReproduce: '1. Add item priced $19.99 x3\n2. Check cart total', expectedResult: 'Total should be $59.97', actualResult: 'Total shows $59.96', assignee: priya._id, reporter: olivia._id, relatedTask: tasks[2]._id },
      { project: proj1._id, title: 'Search results flicker on debounce', severity: 'minor', priority: 'low', status: 'fixed', environment: 'Chrome 121', stepsToReproduce: '1. Type in search bar quickly\n2. Observe results flickering', expectedResult: 'Smooth transition between results', actualResult: 'Results flash in and out', assignee: priya._id, reporter: alex._id, relatedTask: tasks[1]._id },
      { project: proj2._id, title: 'CSV import fails with special characters', severity: 'major', priority: 'high', status: 'verified', environment: 'Node.js v20 / Ubuntu 22.04', stepsToReproduce: '1. Upload CSV with UTF-8 special characters\n2. Observe import failure', expectedResult: 'All rows imported correctly', actualResult: 'Import fails at row with accented characters', assignee: james._id, reporter: olivia._id, relatedTask: tasks[10]._id },
      { project: proj2._id, title: 'Dashboard widget overlap on tablet', severity: 'minor', priority: 'medium', status: 'open', environment: 'iPad Pro / Safari', stepsToReproduce: '1. Open dashboard on iPad\n2. Rotate to portrait mode', expectedResult: 'Widgets stack properly', actualResult: 'Widgets overlap each other', assignee: null, reporter: olivia._id },
      { project: proj2._id, title: 'Lead status not updating in real-time', severity: 'major', priority: 'high', status: 'open', environment: 'All browsers', stepsToReproduce: '1. Update lead status\n2. Open same lead in another tab\n3. Status still shows old value', expectedResult: 'Status updates in real-time', actualResult: 'Requires page refresh', assignee: priya._id, reporter: mike._id, relatedTask: tasks[9]._id },
      { project: proj4._id, title: 'Memory leak in streaming module', severity: 'critical', priority: 'critical', status: 'closed', environment: 'Node.js v20 / Docker', stepsToReproduce: '1. Run streaming for 24+ hours\n2. Monitor memory usage', expectedResult: 'Stable memory usage', actualResult: 'Memory grows linearly over time', assignee: emily._id, reporter: olivia._id, relatedTask: tasks[20]._id },
      { project: proj4._id, title: 'Report PDF missing header on page 2+', severity: 'minor', priority: 'low', status: 'closed', environment: 'Chrome print / pdfmake', stepsToReproduce: '1. Generate report with 3+ pages\n2. Check headers on subsequent pages', expectedResult: 'Header appears on every page', actualResult: 'Header only on first page', assignee: priya._id, reporter: mike._id },
    ];

    const bugs = [];
    for (const def of bugDefs) {
      const bug = await new Bug({ ...def }).save();
      bugs.push(bug);
    }
    logger.info(`  Created ${bugs.length} bugs`);

    // -----------------------------------------------------------------------
    // 6. Documents
    // -----------------------------------------------------------------------
    logger.info('Seeding documents...');
    const documents = await Document.create([
      {
        project: proj1._id, title: 'E-Commerce PRD', category: 'requirement',
        content: '# Product Requirements Document\n\n## Overview\nBuild a full-featured e-commerce platform supporting B2C transactions.\n\n## Core Features\n- Product catalog with search and filtering\n- Shopping cart with persistent state\n- Checkout with Stripe and PayPal\n- Order tracking and history\n- Admin panel for inventory management\n\n## Non-Functional Requirements\n- Page load time < 2s\n- 99.9% uptime SLA\n- WCAG 2.1 AA compliance\n- Support for 10,000 concurrent users',
        tags: ['prd', 'requirements', 'v1'], version: 2,
        versions: [{ version: 1, content: '# PRD Draft\nInitial draft of requirements.', updatedBy: sarah._id, updatedAt: daysAgo(55) }],
        createdBy: sarah._id, lastEditedBy: sarah._id,
      },
      {
        project: proj1._id, title: 'API Design Guide', category: 'technical',
        content: '# API Design Guide\n\n## Conventions\n- RESTful endpoints following `/api/v1/resource` pattern\n- JSON request/response bodies\n- JWT authentication via Bearer tokens\n- Pagination: `?page=1&limit=20`\n- Error format: `{ error: { code, message, details } }`\n\n## Endpoints\n- `GET /products` - List products\n- `GET /products/:id` - Product detail\n- `POST /cart` - Add to cart\n- `POST /orders` - Place order',
        tags: ['api', 'backend', 'rest'], createdBy: priya._id, lastEditedBy: priya._id,
      },
      {
        project: proj2._id, title: 'CRM Data Model', category: 'design',
        content: '# CRM Data Model\n\n## Entities\n### Lead\n- name, email, phone, company\n- status: new → contacted → qualified → proposal → won/lost\n- score: 0-100 (auto-calculated)\n- source: web, referral, cold_call, event\n\n### Contact\n- Linked to Company\n- Multiple communication channels\n- Activity history\n\n### Deal\n- Linked to Lead and Contact\n- Pipeline stages with probability',
        tags: ['data-model', 'design', 'database'], createdBy: mike._id, lastEditedBy: james._id,
      },
      {
        project: proj2._id, title: 'Sprint 3 Meeting Notes', category: 'meeting_notes',
        content: '# Sprint 3 Planning\n**Date:** ' + daysAgo(7).toLocaleDateString() + '\n\n## Attendees\nMike, Priya, James, Olivia\n\n## Decisions\n1. Prioritize lead management over email campaigns\n2. Move RBAC to Sprint 3 from Sprint 4\n3. Olivia to focus on API test coverage\n\n## Action Items\n- [ ] Priya: Lead scoring algorithm by Friday\n- [ ] James: Widget component library\n- [ ] Olivia: Integration test setup',
        tags: ['meeting', 'sprint-3'], createdBy: mike._id, lastEditedBy: mike._id,
      },
      {
        project: proj3._id, title: 'Mobile App Architecture', category: 'technical',
        content: '# Mobile Banking Architecture\n\n## Tech Stack\n- React Native 0.73\n- TypeScript\n- Redux Toolkit for state\n- React Navigation 6\n- Biometric: expo-local-authentication\n\n## Security\n- SSL pinning\n- Encrypted local storage\n- Session timeout: 5 min inactive\n- Biometric + PIN fallback\n\n## Offline Strategy\n- Cache recent transactions\n- Queue pending transfers\n- Sync on reconnect',
        tags: ['architecture', 'mobile', 'security'], createdBy: james._id, lastEditedBy: james._id,
      },
      {
        project: proj4._id, title: 'Analytics Pipeline Documentation', category: 'guide',
        content: '# Analytics Pipeline Guide\n\n## Architecture\nSource → Kafka → Spark Streaming → Data Lake → Dashboard\n\n## Data Sources\n1. Application events (REST API)\n2. Database CDC (Change Data Capture)\n3. Third-party webhooks\n\n## Deployment\n```bash\ndocker-compose up -d\nnpm run migrate\nnpm run seed-dimensions\n```\n\n## Monitoring\n- Grafana dashboard: /monitoring/pipeline\n- Alert thresholds configured in `config/alerts.yml`',
        tags: ['guide', 'pipeline', 'devops'], createdBy: emily._id, lastEditedBy: emily._id,
      },
    ]);
    logger.info(`  Created ${documents.length} documents`);

    // -----------------------------------------------------------------------
    // 8. Comments
    // -----------------------------------------------------------------------
    logger.info('Seeding comments...');
    const comments = await Comment.create([
      // Task comments
      { commentableType: 'Task', commentableId: tasks[1]._id, author: sarah._id, body: 'Great progress on the search implementation! Can we also add sorting by price and rating?', mentions: [priya._id] },
      { commentableType: 'Task', commentableId: tasks[1]._id, author: priya._id, body: 'Sure, I\'ll add sort options in the next iteration. Already have the backend support for it.', mentions: [] },
      { commentableType: 'Task', commentableId: tasks[2]._id, author: emily._id, body: 'The cart API is ready for integration. Endpoints:\n- `POST /api/v1/cart/add`\n- `DELETE /api/v1/cart/:itemId`\n- `PATCH /api/v1/cart/:itemId/quantity`', mentions: [alex._id, priya._id] },
      { commentableType: 'Task', commentableId: tasks[2]._id, author: alex._id, body: 'Thanks @Emily! I\'ll start wiring up the frontend tomorrow.', mentions: [emily._id] },
      { commentableType: 'Task', commentableId: tasks[9]._id, author: mike._id, body: 'This is our top priority for Sprint 3. @Priya please flag any blockers early.', mentions: [priya._id] },
      { commentableType: 'Task', commentableId: tasks[11]._id, author: james._id, body: 'Revenue chart is done. Working on the pipeline funnel next. Using recharts for all visualizations.', mentions: [] },
      // Bug comments
      { commentableType: 'Bug', commentableId: bugs[0]._id, author: alex._id, body: 'Investigating — looks like a WebP format issue. Safari 17.2 has partial WebP support with some edge cases.', mentions: [] },
      { commentableType: 'Bug', commentableId: bugs[1]._id, author: priya._id, body: 'Root cause: floating-point arithmetic in the cart total calculation. Switching to integer cents-based math.', mentions: [olivia._id] },
      { commentableType: 'Bug', commentableId: bugs[1]._id, author: olivia._id, body: 'I\'ll write a regression test suite for currency calculations once the fix is in.', mentions: [priya._id] },
      // Project comments
      { commentableType: 'Project', commentableId: proj1._id, author: sarah._id, body: 'Team, we\'re on track for the MVP milestone. Let\'s keep the momentum going! 🚀', mentions: [priya._id, alex._id, emily._id] },
      { commentableType: 'Project', commentableId: proj2._id, author: mike._id, body: 'Alpha release deadline is approaching. Please update your task statuses by EOD Friday.', mentions: [priya._id, james._id, olivia._id] },
    ]);

    // Create a threaded reply
    await Comment.create({
      commentableType: 'Task', commentableId: tasks[2]._id, author: sarah._id,
      body: 'Let\'s also handle the guest cart → authenticated cart merge flow.',
      parentComment: comments[2]._id, mentions: [emily._id, priya._id],
    });
    logger.info(`  Created ${comments.length + 1} comments`);

    // -----------------------------------------------------------------------
    // 9. Activities
    // -----------------------------------------------------------------------
    logger.info('Seeding activities...');
    await Activity.create([
      { project: proj1._id, actor: sarah._id, action: 'created', targetType: 'Project', targetId: proj1._id, targetTitle: proj1.name, createdAt: daysAgo(60) },
      { project: proj1._id, actor: alex._id, action: 'transitioned', targetType: 'Task', targetId: tasks[0]._id, targetTitle: tasks[0].title, metadata: { from: 'in_review', to: 'done' }, createdAt: daysAgo(10) },
      { project: proj1._id, actor: priya._id, action: 'transitioned', targetType: 'Task', targetId: tasks[1]._id, targetTitle: tasks[1].title, metadata: { from: 'in_progress', to: 'in_review' }, createdAt: daysAgo(2) },
      { project: proj1._id, actor: olivia._id, action: 'created', targetType: 'Bug', targetId: bugs[0]._id, targetTitle: bugs[0].title, createdAt: daysAgo(3) },
      { project: proj1._id, actor: olivia._id, action: 'created', targetType: 'Bug', targetId: bugs[1]._id, targetTitle: bugs[1].title, createdAt: daysAgo(2) },
      { project: proj1._id, actor: sarah._id, action: 'created', targetType: 'Document', targetId: documents[0]._id, targetTitle: documents[0].title, createdAt: daysAgo(55) },
      { project: proj1._id, actor: sarah._id, action: 'commented', targetType: 'Task', targetId: tasks[1]._id, targetTitle: tasks[1].title, createdAt: daysAgo(1) },
      { project: proj2._id, actor: admin._id, action: 'created', targetType: 'Project', targetId: proj2._id, targetTitle: proj2.name, createdAt: daysAgo(30) },
      { project: proj2._id, actor: james._id, action: 'transitioned', targetType: 'Task', targetId: tasks[10]._id, targetTitle: tasks[10].title, metadata: { from: 'in_review', to: 'done' }, createdAt: daysAgo(5) },
      { project: proj2._id, actor: priya._id, action: 'updated', targetType: 'Task', targetId: tasks[9]._id, targetTitle: tasks[9].title, createdAt: daysAgo(1) },
      { project: proj2._id, actor: mike._id, action: 'created', targetType: 'Document', targetId: documents[2]._id, targetTitle: documents[2].title, createdAt: daysAgo(15) },
      { project: proj3._id, actor: sarah._id, action: 'created', targetType: 'Project', targetId: proj3._id, targetTitle: proj3.name, createdAt: daysAgo(7) },
      { project: proj4._id, actor: emily._id, action: 'transitioned', targetType: 'Task', targetId: tasks[23]._id, targetTitle: tasks[23].title, metadata: { from: 'in_review', to: 'done' }, createdAt: daysAgo(15) },
    ]);
    logger.info('  Created 13 activities');

    // -----------------------------------------------------------------------
    // 10. Notifications
    // -----------------------------------------------------------------------
    logger.info('Seeding notifications...');
    await Notification.create([
      { user: priya._id, type: 'task_assigned', title: 'New task assigned', message: `You have been assigned to "${tasks[2].title}" in ${proj1.name}`, entityType: 'Task', entityId: tasks[2]._id, actor: sarah._id, read: true, createdAt: daysAgo(15) },
      { user: priya._id, type: 'comment_mention', title: 'Mentioned in a comment', message: `Sarah Johnson mentioned you in a comment on "${tasks[1].title}"`, entityType: 'Task', entityId: tasks[1]._id, actor: sarah._id, read: false, createdAt: daysAgo(1) },
      { user: priya._id, type: 'bug_assigned', title: 'Bug assigned to you', message: `You have been assigned to bug "${bugs[1].title}"`, entityType: 'Bug', entityId: bugs[1]._id, actor: olivia._id, read: false, createdAt: daysAgo(2) },
      { user: alex._id, type: 'task_assigned', title: 'New task assigned', message: `You have been assigned to "${tasks[0].title}" in ${proj1.name}`, entityType: 'Task', entityId: tasks[0]._id, actor: sarah._id, read: true, createdAt: daysAgo(30) },
      { user: alex._id, type: 'comment_mention', title: 'Mentioned in a comment', message: `Emily Watson mentioned you in a comment on "${tasks[2].title}"`, entityType: 'Task', entityId: tasks[2]._id, actor: emily._id, read: false, createdAt: daysAgo(1) },
      { user: emily._id, type: 'deadline_approaching', title: 'Deadline approaching', message: `"${tasks[3].title}" is due in 5 days`, entityType: 'Task', entityId: tasks[3]._id, read: false, createdAt: daysAgo(0) },
      { user: olivia._id, type: 'comment_reply', title: 'Reply to your comment', message: `Priya Sharma replied to your comment on bug "${bugs[1].title}"`, entityType: 'Bug', entityId: bugs[1]._id, actor: priya._id, read: false, createdAt: daysAgo(1) },
      { user: mike._id, type: 'general', title: 'New bug reported', message: `Olivia Brown reported a bug "${bugs[4].title}" in CRM Dashboard`, entityType: 'Bug', entityId: bugs[4]._id, actor: olivia._id, read: true, createdAt: daysAgo(3) },
    ]);
    logger.info('  Created 10 notifications');

    // -----------------------------------------------------------------------
    // 11. Notification Preferences
    // -----------------------------------------------------------------------
    logger.info('Seeding notification preferences...');
    await NotificationPreference.create([
      { user: admin._id },
      { user: sarah._id, email: { task_assigned: true, bug_assigned: true, comment_mention: true, deadline_approaching: true, status_change: true, comment_reply: true } },
      { user: mike._id, email: { task_assigned: true, bug_assigned: true, comment_mention: true, deadline_approaching: true, status_change: false, comment_reply: false } },
      { user: priya._id, email: { task_assigned: false, bug_assigned: true, comment_mention: true, deadline_approaching: true, status_change: false, comment_reply: true } },
      { user: alex._id },
      { user: emily._id },
      { user: james._id },
      { user: olivia._id, email: { task_assigned: true, bug_assigned: true, comment_mention: true, deadline_approaching: false, status_change: false, comment_reply: true } },
    ]);
    logger.info('  Created 8 notification preferences');

    // -----------------------------------------------------------------------
    // 12. Audit Logs
    // -----------------------------------------------------------------------
    logger.info('Seeding audit logs...');
    await AuditLog.create([
      { userId: admin._id, action: 'Created user Sarah Johnson', module: 'users', targetId: sarah._id, targetModel: 'User', ipAddress: '192.168.1.10', createdAt: daysAgo(60) },
      { userId: admin._id, action: 'Created project E-Commerce Platform', module: 'projects', targetId: proj1._id, targetModel: 'Project', ipAddress: '192.168.1.10', createdAt: daysAgo(60) },
      { userId: sarah._id, action: 'Created task "Design product catalog UI"', module: 'tasks', targetId: tasks[0]._id, targetModel: 'Task', ipAddress: '192.168.1.15', createdAt: daysAgo(55) },
      { userId: priya._id, action: 'Transitioned task to in_review', module: 'tasks', targetId: tasks[1]._id, targetModel: 'Task', metadata: { from: 'in_progress', to: 'in_review' }, ipAddress: '192.168.1.20', createdAt: daysAgo(2) },
      { userId: olivia._id, action: 'Reported bug "Cart total rounds incorrectly"', module: 'bugs', targetId: bugs[1]._id, targetModel: 'Bug', ipAddress: '192.168.1.25', createdAt: daysAgo(2) },
      { userId: sarah._id, action: 'Updated document "E-Commerce PRD"', module: 'documents', targetId: documents[0]._id, targetModel: 'Document', ipAddress: '192.168.1.15', createdAt: daysAgo(20) },
      { userId: admin._id, action: 'Updated system settings', module: 'settings', ipAddress: '192.168.1.10', createdAt: daysAgo(50) },
      { userId: admin._id, action: 'Login', module: 'auth', metadata: { userAgent: 'Mozilla/5.0' }, ipAddress: '192.168.1.10', createdAt: daysAgo(0) },
      { userId: sarah._id, action: 'Login', module: 'auth', metadata: { userAgent: 'Mozilla/5.0' }, ipAddress: '192.168.1.15', createdAt: daysAgo(0) },
    ]);
    logger.info('  Created 11 audit logs');

    // -----------------------------------------------------------------------
    // 13. Settings
    // -----------------------------------------------------------------------
    logger.info('Seeding settings...');
    await Settings.create({
      appName: 'ProjectHub',
      defaultProjectType: 'time_and_material',
      defaultTaskPriority: 'medium',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip'],
      maintenanceMode: false,
    });
    logger.info('  Created settings');

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    logger.info('');
    logger.info('========================================');
    logger.info('  Seed completed successfully!');
    logger.info('========================================');
    logger.info(`  Users:          ${users.length}`);
    logger.info(`  Projects:       ${projects.length}`);
    logger.info(`  Milestones:     ${milestones.length}`);
    logger.info(`  Tasks:          ${tasks.length}`);
    logger.info(`  Bugs:           ${bugs.length}`);
    logger.info(`  Documents:      ${documents.length}`);
    logger.info(`  Comments:       ${comments.length + 1}`);
    logger.info(`  Activities:     13`);
    logger.info(`  Notifications:  10`);
    logger.info(`  Preferences:    8`);
    logger.info(`  Audit Logs:     11`);
    logger.info(`  Settings:       1`);
    logger.info('');
    logger.info('  Login credentials (all users):');
    logger.info('  Password: Admin@123');
    logger.info('');
    logger.info('  Admin:    admin@pms.com');
    logger.info('  PM:       sarah@pms.com / mike@pms.com');
    logger.info('  Dev:      priya@pms.com / alex@pms.com');
    logger.info('            emily@pms.com / james@pms.com');
    logger.info('  QA:       olivia@pms.com');
    logger.info('========================================');

    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
