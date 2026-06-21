const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'projects.json');
const tasksPath = path.join(__dirname, 'tasks.json');

const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
const tasksData = fs.existsSync(tasksPath) ? JSON.parse(fs.readFileSync(tasksPath, 'utf8')) : [];

// Update existing projects to requirement_gathering
const prj1 = projectsData.find(p => p.id === 'PRJ-995373-1147');
if (prj1) prj1.status = 'requirement_gathering';

const prj2 = projectsData.find(p => p.id === 'PRJ-IN-002');
if (prj2) prj2.status = 'requirement_gathering';

// Add new dummy projects
const dummyProjects = [
  { id: 'PRJ-DUMMY-1', name: 'Alpha Tower Followup', client_name: 'Alpha Corp', status: 'requirement_gathering', created_at: new Date().toISOString() },
  { id: 'PRJ-DUMMY-2', name: 'Beta Complex Followup', client_name: 'Beta LLC', status: 'requirement_gathering', created_at: new Date().toISOString() },
  { id: 'PRJ-DUMMY-3', name: 'Gamma Site Followup', client_name: 'Gamma Inc', status: 'requirement_gathering', created_at: new Date().toISOString() },
];

for (const dp of dummyProjects) {
  if (!projectsData.find(p => p.id === dp.id)) {
    projectsData.push(dp);
  }
}

// Write back projects
fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));

// Create dummy tasks
const today = new Date();

const createDate = (daysOffset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

const dummyTasks = [
  { id: 'tsk-dum-1', projectId: 'PRJ-995373-1147', title: 'Follow-up Call', status: 'pending', dueDate: createDate(0) }, // Today
  { id: 'tsk-dum-2', projectId: 'PRJ-IN-002', title: 'Follow-up Email', status: 'pending', dueDate: createDate(-2) }, // Overdue
  { id: 'tsk-dum-3', projectId: 'PRJ-DUMMY-1', title: 'Follow-up Meeting', status: 'pending', dueDate: createDate(0) }, // Today
  { id: 'tsk-dum-4', projectId: 'PRJ-DUMMY-2', title: 'Follow-up Proposal', status: 'pending', dueDate: createDate(3) }, // Next 7 days
  { id: 'tsk-dum-5', projectId: 'PRJ-DUMMY-3', title: 'Follow-up Check-in', status: 'pending', dueDate: createDate(10) }, // Future
];

for (const dt of dummyTasks) {
  const existing = tasksData.findIndex(t => t.id === dt.id);
  if (existing > -1) {
    tasksData[existing] = dt;
  } else {
    tasksData.push(dt);
  }
}

// Write back tasks
fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));
console.log('Dummy follow-ups created successfully.');
