const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'projects.json');
const tasksPath = path.join(__dirname, 'tasks.json');
const commentsPath = path.join(__dirname, 'comments.json');

const projects = fs.existsSync(projectsPath) ? JSON.parse(fs.readFileSync(projectsPath, 'utf8')) : [];
const tasks = fs.existsSync(tasksPath) ? JSON.parse(fs.readFileSync(tasksPath, 'utf8')) : [];
const comments = fs.existsSync(commentsPath) ? JSON.parse(fs.readFileSync(commentsPath, 'utf8')) : [];

const DEFAULT_USER_ID = "d05fa8bf-10be-41a1-942f-9dc103448329";

// Helper to construct date offset from today
const getFutureDate = (daysOffset, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const newProjects = [
  {
    id: "PRJ-REAL-001",
    name: "Godrej Reserve Topographical Survey",
    client_name: "Godrej Properties Ltd",
    client_contact: "Phone: +91 91234 56789, Email: bangalore.sales@godrejproperties.com",
    client_address: "Devanahalli, Bangalore North, Karnataka",
    site_type: "residential",
    site_coordinates: "13.2501° N, 77.7123° E",
    survey_requirements: "Complete topographical grid mapping of 92 acres residential plotting project for municipal layout approvals.",
    services: ["Topographical Survey", "Boundary Demarcation"],
    target_completion_date: "2026-08-30",
    status: "requirement_gathering",
    created_by: DEFAULT_USER_ID,
    created_at: getFutureDate(-4),
    updated_at: getFutureDate(-4),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-REAL-002",
    name: "Hiranandani Gardens Boundary Verification",
    client_name: "Hiranandani Group",
    client_contact: "Phone: +91 98888 77777, Email: projects@hiranandani.net",
    client_address: "Powai, Mumbai, Maharashtra",
    site_type: "commercial",
    site_coordinates: "19.1176° N, 72.9060° E",
    survey_requirements: "High-precision boundary verification and encroachment mapping for commercial luxury tower extension project.",
    services: ["Boundary Verification", "Utility Locating"],
    target_completion_date: "2026-07-15",
    status: "requirement_gathering",
    created_by: DEFAULT_USER_ID,
    created_at: getFutureDate(-3),
    updated_at: getFutureDate(-3),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-REAL-003",
    name: "Shapoorji Pallonji Industrial Plot Layout",
    client_name: "Shapoorji Pallonji Engineering",
    client_contact: "Phone: +91 97777 66666, Email: industrial.estates@shapoorji.com",
    client_address: "Hadapsar Industrial Area, Pune, Maharashtra",
    site_type: "industrial",
    site_coordinates: "18.5089° N, 73.9259° E",
    survey_requirements: "Setting out layout plans and establishing coordinates for heavy machinery foundations.",
    services: ["Construction Staking"],
    target_completion_date: "2026-09-10",
    status: "lead_created",
    created_by: DEFAULT_USER_ID,
    created_at: getFutureDate(-1),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {}
  }
];

// Add projects if they don't exist
for (const p of newProjects) {
  const existingIdx = projects.findIndex(proj => proj.id === p.id);
  if (existingIdx > -1) {
    projects[existingIdx] = p;
  } else {
    projects.push(p);
  }
}

// Add comments (follow-up logs) for Godrej and Hiranandani
const newComments = [
  {
    id: "cmt-real-001",
    project_id: "PRJ-REAL-001",
    user_id: DEFAULT_USER_ID,
    content: "Follow-up Outcome: Discussed topographical requirements with Sr. Engineer. They requested 5m grid precision instead of 10m. Price needs to be adjusted accordingly.\nStatus: Interested\nNext Date: " + getFutureDate(1).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-2, 11),
    parent_comment_id: null,
    is_edited: false
  },
  {
    id: "cmt-real-002",
    project_id: "PRJ-REAL-001",
    user_id: DEFAULT_USER_ID,
    content: "Follow-up Outcome: Called client to clarify site access permissions. Security clearance from Godrej facility management is obtained. Ready to begin survey once contract is approved.\nStatus: Waiting for Documents\nNext Date: " + getFutureDate(3).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-1, 15),
    parent_comment_id: null,
    is_edited: false
  },
  {
    id: "cmt-real-003",
    project_id: "PRJ-REAL-002",
    user_id: DEFAULT_USER_ID,
    content: "Follow-up Outcome: Explored Powai site boundaries. Client shared physical maps. Scheduling on-site verification with Hiranandani site in-charge next week.\nStatus: Negotiation\nNext Date: " + getFutureDate(2).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-1, 10),
    parent_comment_id: null,
    is_edited: false
  }
];

// Add comments if they don't exist
for (const c of newComments) {
  const existingIdx = comments.findIndex(cmt => cmt.id === c.id);
  if (existingIdx > -1) {
    comments[existingIdx] = c;
  } else {
    comments.push(c);
  }
}

// Add pending tasks (follow-up schedulers)
const newTasks = [
  {
    id: "tsk-real-001",
    projectId: "PRJ-REAL-001",
    title: "Follow-up Call: Discussion about Grid Precision layout proposal",
    status: "pending",
    dueDate: getFutureDate(3, 10)
  },
  {
    id: "tsk-real-002",
    projectId: "PRJ-REAL-002",
    title: "Follow-up Call: Negotiation regarding price adjustments and boundary lines",
    status: "pending",
    dueDate: getFutureDate(2, 14)
  }
];

// Add tasks if they don't exist
for (const t of newTasks) {
  const existingIdx = tasks.findIndex(tsk => tsk.id === t.id);
  if (existingIdx > -1) {
    tasks[existingIdx] = t;
  } else {
    tasks.push(t);
  }
}

// Save all changes back to JSON files
fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));

console.log("Successfully created 3 realistic projects and associated follow-up logs!");
