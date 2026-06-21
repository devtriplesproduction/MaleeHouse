const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'projects.json');
const tasksPath = path.join(__dirname, 'tasks.json');
const commentsPath = path.join(__dirname, 'comments.json');
const quotationsPath = path.join(__dirname, 'quotations.json');
const assignmentsPath = path.join(__dirname, 'project_assignments.json');
const activityPath = path.join(__dirname, 'activity_logs.json');
const filesPath = path.join(__dirname, 'files.json');
const invoicesPath = path.join(__dirname, 'invoices.json');
const paymentsPath = path.join(__dirname, 'payments.json');
const visitsPath = path.join(__dirname, 'project_visits.json');
const cadPath = path.join(__dirname, 'cad_revisions.json');
const fieldPath = path.join(__dirname, 'field_reports.json');
const checklistPath = path.join(__dirname, 'delivery_checklist.json');
const historyPath = path.join(__dirname, 'workflow_history.json');

const ADMIN_USER_ID = "dcac6bfe-9f0f-4c94-9ff3-a4fd599ce5c6";
const SALES_USER_ID = "d05fa8bf-10be-41a1-942f-9dc103448329";
const FINANCE_USER_ID = "ba635e03-0a19-4267-b5d8-bfa422aeb250";
const ENGINEER_USER_ID = "6010a8cd-3b3f-4f5c-9929-5e8c81fffd04";
const CAD_USER_ID = "f75f172c-945a-4378-a26e-6aa348ed55ad";
const FIELD_USER_ID = "3c4fa07f-083a-4ea0-b88c-2dbfb1a9be1d";
const QC_USER_ID = "qc-id";

// Helper to construct date offset from today
const getFutureDate = (daysOffset, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// 1. Projects Data Definition (Stages: lead_created, requirement_gathering, quotation_requested, quotation_sent, payment_pending, payment_done, review)
const projects = [
  {
    id: "PRJ-LEAD-001",
    name: "ITC Maratha Topographical Survey",
    client_name: "ITC Hotels Ltd",
    client_contact: "Phone: +91 99000 88888, Email: engineering.maratha@itchotels.in",
    client_address: "Sahar Road, Andheri East, Mumbai, Maharashtra",
    site_type: "commercial",
    site_coordinates: "19.1032° N, 72.8687° E",
    survey_requirements: "High-precision topographical mapping for the expansion of the outdoor recreational zone and green lawns.",
    services: ["Topographical Survey"],
    target_completion_date: "2026-09-10",
    status: "lead_created",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-2),
    updated_at: getFutureDate(-2),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-LEAD-002",
    name: "Phoenix Palladium Mall Boundary Check",
    client_name: "Phoenix Mills Ltd",
    client_contact: "Phone: +91 98222 33333, Email: security@phoenixpalladium.com",
    client_address: "Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra",
    site_type: "commercial",
    site_coordinates: "18.9944° N, 72.8277° E",
    survey_requirements: "Verifying exact boundary wall measurements before structural layout drawings.",
    services: ["Boundary Verification"],
    target_completion_date: "2026-08-25",
    status: "lead_created",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-1),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-REQ-001",
    name: "Godrej Reserve Demarcation Plan",
    client_name: "Godrej Properties Ltd",
    client_contact: "Phone: +91 91234 56789, Email: project.reserve@godrejproperties.com",
    client_address: "Devanahalli, Bangalore North, Karnataka",
    site_type: "residential",
    site_coordinates: "13.2501° N, 77.7123° E",
    survey_requirements: "Boundary demarcation and area verification of a 92-acre forest-themed layout for municipal zoning clearings.",
    services: ["Boundary Verification", "Topographical Survey"],
    target_completion_date: "2026-10-15",
    status: "requirement_gathering",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-5),
    updated_at: getFutureDate(-2),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-REQ-002",
    name: "Hiranandani Gardens Layout Survey",
    client_name: "Hiranandani Group",
    client_contact: "Phone: +91 98888 77777, Email: planning.powai@hiranandani.net",
    client_address: "Powai, Mumbai, Maharashtra",
    site_type: "commercial",
    site_coordinates: "19.1176° N, 72.9060° E",
    survey_requirements: "High-precision mapping of underground utility channels (water, electrical conduits, and fiber cables) before foundation excavations.",
    services: ["Utility Locating", "Boundary Verification"],
    target_completion_date: "2026-08-30",
    status: "requirement_gathering",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-4),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {}
  },
  {
    id: "PRJ-ACC-001",
    name: "Tata Power Solar Park Construction Staking",
    client_name: "Tata Power Renewables",
    client_contact: "Phone: +91 94444 33333, Email: renewables.grid@tatapower.com",
    client_address: "Mithapur, Dwarka, Gujarat",
    site_type: "industrial",
    site_coordinates: "22.4172° N, 69.0068° E",
    survey_requirements: "Establishing coordinate layout grid points and installing physical pegs for a new 50MW solar field array setup.",
    services: ["Construction Staking"],
    target_completion_date: "2026-07-20",
    status: "quotation_requested",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-7),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {
      "docs": true,
      "images": true,
      "measurements": true,
      "budget": true,
      "timeline": true
    }
  },
  {
    id: "PRJ-QS-001",
    name: "Oberoi Realty Garden City Survey",
    client_name: "Oberoi Realty Ltd",
    client_contact: "Phone: +91 95555 44444, Email: info@oberoirealty.com",
    client_address: "Goregaon East, Mumbai, Maharashtra",
    site_type: "residential",
    site_coordinates: "19.1663° N, 72.8596° E",
    survey_requirements: "Topographical and contour mapping of hilly terrain for the planning of a premium residential tower phase.",
    services: ["Topographical Survey"],
    target_completion_date: "2026-09-30",
    status: "quotation_sent",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-10),
    updated_at: getFutureDate(-3),
    deleted_at: null,
    requirement_checklist: {
      "docs": true,
      "images": true,
      "measurements": true,
      "budget": true,
      "timeline": true
    }
  },
  {
    id: "PRJ-PAY-001",
    name: "Adani Shantigram Infrastructure Drone Check",
    client_name: "Adani Infrastructure",
    client_contact: "Phone: +91 96666 55555, Email: contracts@adaniinfra.com",
    client_address: "S.G. Highway, Ahmedabad, Gujarat",
    site_type: "infrastructure",
    site_coordinates: "23.1259° N, 72.5350° E",
    survey_requirements: "Drone photogrammetry and high-resolution orthomosaic generation for an ongoing 600-acre township road expansion project.",
    services: ["Drone Photogrammetry", "Topographical Survey"],
    target_completion_date: "2026-08-15",
    status: "payment_pending",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-12),
    updated_at: getFutureDate(-2),
    deleted_at: null,
    requirement_checklist: {
      "docs": true,
      "images": true,
      "measurements": true,
      "budget": true,
      "timeline": true
    }
  },
  {
    id: "PRJ-OPS-001",
    name: "L&T Coastal Road Alignment Survey",
    client_name: "L&T Infrastructure & Co",
    client_contact: "Phone: +91 97777 66666, Email: planning.coastal@lntecc.com",
    client_address: "Marine Drive to Worli corridor, Mumbai, Maharashtra",
    site_type: "infrastructure",
    site_coordinates: "18.9750° N, 72.8011° E",
    survey_requirements: "High-precision structural alignment checks and bathymetric mapping for the coastal seawall reclamation zone.",
    services: ["Boundary Verification", "Utility Locating"],
    target_completion_date: "2026-11-30",
    status: "payment_done",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-15),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {
      "docs": true,
      "images": true,
      "measurements": true,
      "budget": true,
      "timeline": true
    }
  },
  {
    id: "PRJ-REV-001",
    name: "DLF CyberCity Topographical & QC Check",
    client_name: "DLF Offices Ltd",
    client_contact: "Phone: +91 98888 11111, Email: facilities.dlf@dlf.in",
    client_address: "DLF CyberCity, Gurugram, Haryana",
    site_type: "commercial",
    site_coordinates: "28.4951° N, 77.0898° E",
    survey_requirements: "Detailed topographical mapping and utility channel verification for the multi-building connecting walkway phase.",
    services: ["Topographical Survey", "Utility Locating"],
    target_completion_date: "2026-07-31",
    status: "review",
    created_by: SALES_USER_ID,
    created_at: getFutureDate(-20),
    updated_at: getFutureDate(-1),
    deleted_at: null,
    requirement_checklist: {
      "docs": true,
      "images": true,
      "measurements": true,
      "budget": true,
      "timeline": true
    }
  }
];

// 2. Comments Data Definition (Rich Follow-ups, Logs and Rework requests)
const comments = [
  {
    id: "cmt-seed-001",
    project_id: "PRJ-REQ-001",
    user_id: SALES_USER_ID,
    content: "Follow-up Outcome: Met with chief surveyor on-site. Discussed perimeter fence checks and forest buffer zones. Client requested a customized pricing breakdown for the buffer area.\nStatus: Interested\nNext Date: " + getFutureDate(1).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-3, 11),
    parent_comment_id: null,
    is_edited: false
  },
  {
    id: "cmt-seed-002",
    project_id: "PRJ-REQ-001",
    user_id: SALES_USER_ID,
    content: "Follow-up Outcome: Clarified site access permissions with Godrej forestry team. Obtained local clearance forms. Scheduled grid boundary checks for early next week.\nStatus: Waiting for Documents\nNext Date: " + getFutureDate(4).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-1, 15),
    parent_comment_id: null,
    is_edited: false
  },
  {
    id: "cmt-seed-003",
    project_id: "PRJ-REQ-002",
    user_id: SALES_USER_ID,
    content: "Follow-up Outcome: Discussed ground-penetrating radar scanning depth requirements. Powai municipal maps were shared. Client is reviewing pricing for utility locating.\nStatus: Negotiation\nNext Date: " + getFutureDate(2).split('T')[0],
    comment_type: "follow_up",
    created_at: getFutureDate(-1, 10),
    parent_comment_id: null,
    is_edited: false
  },
  {
    id: "cmt-seed-004",
    project_id: "PRJ-REV-001",
    user_id: QC_USER_ID,
    content: "[QC Review Rejection] Found alignment offset deviations exceeding 5cm on the northern walkway coordinates. Requesting CAD rework and additional on-site check pegs.",
    comment_type: "rejection",
    created_at: getFutureDate(-2, 16),
    parent_comment_id: null,
    is_edited: false
  }
];

// 3. Tasks Data Definition (Schedules and Milestones)
const tasks = [
  {
    id: "tsk-seed-001",
    projectId: "PRJ-REQ-001",
    title: "Follow-up Call: Discussion about forest buffer layout cost estimations",
    status: "pending",
    dueDate: getFutureDate(4, 10)
  },
  {
    id: "tsk-seed-002",
    projectId: "PRJ-REQ-002",
    title: "Follow-up Call: Price adjustments discussion regarding utility depth scans",
    status: "pending",
    dueDate: getFutureDate(2, 14)
  }
];

// 4. Quotations Data (Formulation phase, Sent phase, Approved phase)
const quotations = [
  {
    id: "QTN-REAL-001",
    project_id: "PRJ-ACC-001",
    quotation_number: "QTN-2026-0003",
    items: [
      {
        id: "1",
        service_name: "Construction Staking",
        description: "Installation of foundation staking and benchmark referencing points for 50MW solar field.",
        default_unit_price: 1500,
        default_quantity: 10,
        total: 15000
      }
    ],
    subtotal: 15000,
    gst_rate: 18,
    gst_amount: 2700,
    total_amount: 17700,
    status: "Draft",
    current_version: 1,
    created_by: FINANCE_USER_ID,
    created_at: getFutureDate(-1, 9),
    updated_at: getFutureDate(-1, 9)
  },
  {
    id: "QTN-REAL-002",
    project_id: "PRJ-QS-001",
    quotation_number: "QTN-2026-0004",
    items: [
      {
        id: "1",
        service_name: "Topographical Survey",
        description: "Hilly terrain high-resolution contour scanning and digital elevation model creation.",
        default_unit_price: 45000,
        default_quantity: 1,
        total: 45000
      }
    ],
    subtotal: 45000,
    gst_rate: 18,
    gst_amount: 8100,
    total_amount: 53100,
    status: "Sent",
    current_version: 1,
    created_by: FINANCE_USER_ID,
    created_at: getFutureDate(-3, 10),
    updated_at: getFutureDate(-3, 10)
  },
  {
    id: "QTN-REAL-003",
    project_id: "PRJ-PAY-001",
    quotation_number: "QTN-2026-0005",
    items: [
      {
        id: "1",
        service_name: "Drone Photogrammetry",
        description: "600-acre township road drone flyover, raw point cloud collection, and orthomosaic mapping.",
        default_unit_price: 90000,
        default_quantity: 1,
        total: 90000
      }
    ],
    subtotal: 90000,
    gst_rate: 18,
    gst_amount: 16200,
    total_amount: 106200,
    status: "Approved",
    current_version: 1,
    created_by: FINANCE_USER_ID,
    created_at: getFutureDate(-4, 14),
    updated_at: getFutureDate(-2, 10)
  },
  {
    id: "QTN-REAL-004",
    project_id: "PRJ-OPS-001",
    quotation_number: "QTN-2026-0006",
    items: [
      {
        id: "1",
        service_name: "Boundary Verification",
        description: "Coastal road marine reclamation high-precision alignment check pegs.",
        default_unit_price: 120000,
        default_quantity: 1,
        total: 120000
      }
    ],
    subtotal: 120000,
    gst_rate: 18,
    gst_amount: 21600,
    total_amount: 141600,
    status: "Approved",
    current_version: 1,
    created_by: FINANCE_USER_ID,
    created_at: getFutureDate(-5, 12),
    updated_at: getFutureDate(-3, 11)
  }
];

// 5. Invoices Data (Advance invoices generated for payment stages)
const invoices = [
  {
    id: "INV-REAL-001",
    project_id: "PRJ-PAY-001",
    invoice_number: "INV-2026-0002",
    amount: 90000,
    gst_rate: 18,
    gst_amount: 16200,
    total_amount: 106200,
    status: "sent",
    due_date: getFutureDate(10),
    notes: "100% advance payment required to schedule drone mapping mobilization clearance.",
    created_at: getFutureDate(-2),
    updated_at: getFutureDate(-2),
    created_by: FINANCE_USER_ID
  },
  {
    id: "INV-REAL-002",
    project_id: "PRJ-OPS-001",
    invoice_number: "INV-2026-0003",
    amount: 120000,
    gst_rate: 18,
    gst_amount: 21600,
    total_amount: 141600,
    status: "paid",
    due_date: getFutureDate(-1),
    notes: "Full billing payment verified for alignment check scheduling.",
    created_at: getFutureDate(-4),
    updated_at: getFutureDate(-1),
    created_by: FINANCE_USER_ID
  }
];

// 6. Payments Data (Verified ledger for completed operations)
const payments = [
  {
    id: "pay-real-001",
    invoice_id: "INV-REAL-002",
    project_id: "PRJ-OPS-001",
    amount: 141600,
    payment_method: "Bank Transfer",
    transaction_id: "TXNLTALIGNMENT999",
    receipt_url: "https://example.com/receipt-lt.pdf",
    status: "approved",
    verified_by: FINANCE_USER_ID,
    verified_at: getFutureDate(-1, 14),
    rejection_reason: null,
    created_at: getFutureDate(-2, 10)
  }
];

// 7. Team Assignments (Operations staffing)
const assignments = [
  {
    id: "asg-seed-001",
    project_id: "PRJ-LEAD-001",
    user_id: SALES_USER_ID,
    role: "sales",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-2)
  },
  {
    id: "asg-seed-002",
    project_id: "PRJ-REQ-001",
    user_id: SALES_USER_ID,
    role: "sales",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-5)
  },
  {
    id: "asg-seed-003",
    project_id: "PRJ-ACC-001",
    user_id: SALES_USER_ID,
    role: "sales",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-7)
  },
  {
    id: "asg-seed-004",
    project_id: "PRJ-OPS-001",
    user_id: ENGINEER_USER_ID,
    role: "engineer",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-1)
  },
  {
    id: "asg-seed-005",
    project_id: "PRJ-OPS-001",
    user_id: FIELD_USER_ID,
    role: "field",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-1)
  },
  {
    id: "asg-seed-006",
    project_id: "PRJ-REV-001",
    user_id: ENGINEER_USER_ID,
    role: "engineer",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-10)
  },
  {
    id: "asg-seed-007",
    project_id: "PRJ-REV-001",
    user_id: CAD_USER_ID,
    role: "cad",
    assigned_by: ADMIN_USER_ID,
    assigned_at: getFutureDate(-10)
  }
];

// 8. Field Visits (Scheduled operations checks)
const visits = [
  {
    id: "vst-seed-001",
    project_id: "PRJ-OPS-001",
    visit_date: getFutureDate(2).split('T')[0],
    completed_at: null,
    status: "scheduled",
    reported_by: FIELD_USER_ID,
    description: "Aligning benchmarking markers along the marine seawall reclamation boundary.",
    invoice_id: null,
    created_at: getFutureDate(-1)
  }
];

// 9. CAD Drawings Revisions (Operational outputs)
const cadRevisions = [
  {
    id: "cad-seed-001",
    project_id: "PRJ-REV-001",
    submitted_by: CAD_USER_ID,
    file_name: "Walkway_Topographical_Layout_v1.dwg",
    file_url: "https://vault.maleehouse.local/drawings/walkway_v1.dwg",
    revision_number: 1,
    revision_notes: "Initial elevation grids and storm sewage piping alignments plotted.",
    status: "pending_review",
    created_at: getFutureDate(-3, 10)
  }
];

// 10. Field Survey Reports
const fieldReports = [
  {
    id: "fld-seed-001",
    project_id: "PRJ-REV-001",
    submitted_by: FIELD_USER_ID,
    report_type: "progress",
    description: "Completed perimeter checks on walkway path grids. Northern structures are successfully flagged.",
    location_notes: "North Mall connecting sector",
    status: "submitted",
    created_at: getFutureDate(-4, 15)
  }
];

// 11. Delivery Readiness Checklists
const checklists = [
  {
    id: "dlv-seed-001",
    project_id: "PRJ-REV-001",
    cad_approved: false,
    field_survey_complete: true,
    qc_approved: false,
    files_finalized: false,
    deliverables_uploaded: false,
    updated_at: getFutureDate(-2)
  }
];

// 12. Workflow History Log Trails
const workflowHistory = [
  {
    id: "hst-seed-001",
    project_id: "PRJ-ACC-001",
    from_stage: "requirement_gathering",
    to_stage: "quotation_requested",
    changed_by: SALES_USER_ID,
    comment: "Pushed to commercial department after client signed on-site parameters.",
    created_at: getFutureDate(-1, 8)
  },
  {
    id: "hst-seed-002",
    project_id: "PRJ-OPS-001",
    from_stage: "payment_pending",
    to_stage: "payment_done",
    changed_by: FINANCE_USER_ID,
    comment: "L&T advance bank transfer received. Coastal project is fully mobilized for field alignment visits.",
    created_at: getFutureDate(-1, 14)
  }
];

const activityLogs = [
  {
    id: "act-seed-001",
    project_id: "PRJ-ACC-001",
    user_id: SALES_USER_ID,
    action: "QUOTATION_REQUESTED",
    details: { message: "Sales finalized all requirements checklist fields and successfully pushed the project into the Accounts pipeline for quotation formulation." },
    created_at: getFutureDate(-1, 8)
  }
];

// Unregistered file vault
const files = [];

// Write everything to the database JSON files cleanly
fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
fs.writeFileSync(quotationsPath, JSON.stringify(quotations, null, 2));
fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
fs.writeFileSync(activityPath, JSON.stringify(activityLogs, null, 2));
fs.writeFileSync(filesPath, JSON.stringify(files, null, 2));
fs.writeFileSync(invoicesPath, JSON.stringify(invoices, null, 2));
fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));
fs.writeFileSync(visitsPath, JSON.stringify(visits, null, 2));
fs.writeFileSync(cadPath, JSON.stringify(cadRevisions, null, 2));
fs.writeFileSync(fieldPath, JSON.stringify(fieldReports, null, 2));
fs.writeFileSync(checklistPath, JSON.stringify(checklists, null, 2));
fs.writeFileSync(historyPath, JSON.stringify(workflowHistory, null, 2));

console.log("Database successfully populated with a production-grade, highly-integrated sample dataset!");
