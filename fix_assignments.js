const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'local_db', 'projects.json');
const assignmentsPath = path.join(__dirname, 'local_db', 'project_assignments.json');

let projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
let assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));

const engineerId = "6010a8cd-3b3f-4f5c-9929-5e8c81fffd04";
let changed = false;

// only check non-completed, non-archived projects
const activeProjects = projects.filter(p => !p.deleted_at && p.status !== 'completed' && p.status !== 'archived');

for (const p of activeProjects) {
  const hasEngineer = assignments.some(a => a.project_id === p.id && a.role === 'engineer');
  if (!hasEngineer) {
    assignments.push({
      id: `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: p.id,
      user_id: engineerId,
      role: 'engineer',
      assigned_at: new Date().toISOString()
    });
    changed = true;
    console.log(`Assigned Rajesh to project ${p.id}`);
  }
}

if (changed) {
  fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
  console.log("Assignments updated.");
} else {
  console.log("No missing assignments found.");
}
