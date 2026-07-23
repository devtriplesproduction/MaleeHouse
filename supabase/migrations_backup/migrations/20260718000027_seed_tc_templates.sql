-- ============================================================
-- FILE: 54_seed_tc_templates.sql
-- PURPOSE: Insert default T&C templates for all services
-- ============================================================

INSERT INTO quotation_templates (id, name, category, is_default, clauses)
VALUES
  (
    'tpl-survey-default', 
    'Standard Survey T&C', 
    'Survey Projects', 
    true, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-lidar-default', 
    'LiDAR Project T&C', 
    'LiDAR Projects', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-cad-default', 
    'CAD Services T&C', 
    'CAD Services', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-drone-default', 
    'Drone Survey T&C', 
    'Drone Survey', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-govt-default', 
    'Government Contracts T&C', 
    'Government Contracts', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-commercial-default', 
    'Standard Commercial T&C', 
    'Standard Commercial', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  ),
  (
    'tpl-custom-default', 
    'Custom Project T&C', 
    'Custom', 
    false, 
    '[
      {"id": "c1", "title": "Data Collection & Purpose", "content": "Malee House Surveys collects client personal and project data — including names, contact details, site coordinates, and project specifications — solely for the purpose of delivering contracted survey and mapping services. Data is collected directly from the client or their authorized representative and is not sourced from third parties without explicit consent.", "display_order": 1},
      {"id": "c2", "title": "Data Storage & Security", "content": "All client data is stored securely on encrypted servers hosted within India, in compliance with applicable Indian data protection guidelines. Access to project data is restricted to authorized Malee House personnel on a need-to-know basis. Physical site documents and reports are stored in locked cabinets with controlled access.", "display_order": 2},
      {"id": "c3", "title": "Data Sharing & Third Parties", "content": "Malee House Surveys will not share, sell, or disclose client data to any third party without prior written consent of the client, except where required by law (e.g., regulatory authority requests, court orders, or statutory reporting obligations). Subcontractors engaged for specific project tasks are bound by equivalent confidentiality obligations.", "display_order": 3},
      {"id": "c4", "title": "Survey Data Ownership", "content": "Raw survey data and final deliverables remain the property of Malee House Surveys until full payment is received. Upon final settlement, ownership of deliverables is transferred to the client, but Malee House Surveys retains the right to use anonymized data for internal training or portfolio purposes.", "display_order": 4}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  clauses = EXCLUDED.clauses;
