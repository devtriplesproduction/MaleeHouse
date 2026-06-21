const fs = require('fs');

const PROJECTS_FILE = './projects.json';
const FILES_FILE = './files.json';

const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

// Find target projects
const prjDataCollection = projects.find(p => p.id === 'PRJ-LEAD-001');
if (prjDataCollection) {
  prjDataCollection.status = 'data_collection';
}

const prjReview = projects.find(p => p.id === 'PRJ-REV-001');
if (prjReview) {
  prjReview.status = 'review';
}

fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));

// Add files
let files = [];
if (fs.existsSync(FILES_FILE)) {
  const content = fs.readFileSync(FILES_FILE, 'utf8');
  if (content.trim()) {
    files = JSON.parse(content);
  }
}

const newFiles = [
  // For PRJ-LEAD-001 (data_collection) - requirements
  {
    id: `file-${Date.now()}-1`,
    project_id: 'PRJ-LEAD-001',
    uploaded_by: 'd05fa8bf-10be-41a1-942f-9dc103448329',
    category: 'requirements',
    file_name: 'Site_Map_Requirements.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mime_type: 'application/pdf',
    file_size: 1048576,
    uploaded_at: new Date().toISOString(),
    version: 1
  },
  {
    id: `file-${Date.now()}-2`,
    project_id: 'PRJ-LEAD-001',
    uploaded_by: 'd05fa8bf-10be-41a1-942f-9dc103448329',
    category: 'requirements',
    file_name: 'Client_Reference_Image.png',
    file_url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png',
    mime_type: 'image/png',
    file_size: 512000,
    uploaded_at: new Date().toISOString(),
    version: 1
  },
  // For PRJ-REV-001 (review) - prototype/cad_drawing
  {
    id: `file-${Date.now()}-3`,
    project_id: 'PRJ-REV-001',
    uploaded_by: 'd05fa8bf-10be-41a1-942f-9dc103448329',
    category: 'prototype',
    file_name: 'CAD_Prototype_v1.pdf',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mime_type: 'application/pdf',
    file_size: 2048576,
    uploaded_at: new Date().toISOString(),
    version: 1
  },
  {
    id: `file-${Date.now()}-4`,
    project_id: 'PRJ-REV-001',
    uploaded_by: 'd05fa8bf-10be-41a1-942f-9dc103448329',
    category: 'cad_drawing',
    file_name: 'Rendered_Layout.png',
    file_url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png',
    mime_type: 'image/png',
    file_size: 4096000,
    uploaded_at: new Date().toISOString(),
    version: 1
  }
];

files.push(...newFiles);
fs.writeFileSync(FILES_FILE, JSON.stringify(files, null, 2));

console.log('Dummy data added successfully.');
