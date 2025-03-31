-- Seed Data Part 1: Basic Tables

-- Insert resource types
INSERT INTO resource_types (name, description, icon_name)
VALUES
  ('Clinic', 'Medical clinics and health centers', 'clinic-icon'),
  ('Hospital', 'Full-service hospitals', 'hospital-icon'),
  ('Pharmacy', 'Pharmacies and medication services', 'pharmacy-icon'),
  ('Mental Health', 'Mental health services and counseling', 'mental-health-icon'),
  ('Social Services', 'Social service organizations', 'social-services-icon'),
  ('Transportation', 'Medical transportation services', 'transportation-icon'),
  ('Public Health', 'County and state public health services', 'public-health-icon'),
  ('Specialty Care', 'Specialized medical services', 'specialty-care-icon');

-- Insert services
INSERT INTO services (name, description, resource_type_id)
VALUES
  ('Primary Care', 'General medical care', 1),
  ('Pediatrics', 'Child healthcare', 1),
  ('Women''s Health', 'Women''s healthcare services', 1),
  ('Dental', 'Dental services', 1),
  ('Emergency', 'Emergency medical services', 2),
  ('Prescriptions', 'Prescription filling services', 3),
  ('Medication Assistance', 'Help with medication costs', 3),
  ('Counseling', 'Mental health counseling', 4),
  ('Food Assistance', 'Food pantries and meal services', 5),
  ('Medical Transport', 'Transportation to medical appointments', 6),
  ('Immunizations', 'Vaccines and immunization services', 7),
  ('STD Testing', 'Testing and treatment for STDs', 7),
  ('Family Planning', 'Reproductive health services', 8),
  ('Urgent Care', 'Walk-in medical care for non-emergency conditions', 1);

-- Insert insurance types
INSERT INTO insurance_types (name, description)
VALUES
  ('Medicaid', 'State and federal program for low-income individuals'),
  ('Medicare', 'Federal program primarily for people over 65'),
  ('NYRx', 'New York State Medicaid Pharmacy program'),
  ('Private Insurance', 'Commercial health insurance plans'),
  ('Sliding Scale', 'Fees based on ability to pay'),
  ('None', 'No insurance required');

-- Insert languages
INSERT INTO languages (name, code)
VALUES
  ('English', 'en'),
  ('Spanish', 'es'),
  ('Chinese', 'zh'),
  ('Arabic', 'ar');

-- Insert transportation options
INSERT INTO transportation_options (name, description, url, phone)
VALUES
  ('Mohawk Ambulance Service', 'Non-emergency medical transportation in Troy area', 'https://www.mohawkambulance.com', '518-274-4888'),
  ('Empire Ambulance Service', 'Medical transportation service in Troy', NULL, '518-244-3311'),
  ('Medicaid Transportation Program', 'Transportation for Medicaid members to medical appointments', 'https://www.health.ny.gov/health_care/medicaid/members/medtrans_overview.htm', '844-666-6270'),
  ('Suburban Transportation', 'Non-emergency medical transport for various needs', 'https://www.suburbantransport.com', '315-437-0058'),
  ('Uber Health', 'On-demand transportation through healthcare providers', 'https://www.uber.com/us/en/health/', NULL),
  ('Lyft Medical Transport', 'Transportation to medical appointments', 'https://www.lyft.com/healthcare', NULL);

  -- Seed Data Part 2: Resources (first 4)

-- Insert resources (real medical facilities in Troy, NY)
INSERT INTO resources (
  name, resource_type_id, address_line1, city, state, zip,
  phone, website, email, hours, eligibility_criteria,
  accepts_uninsured, sliding_scale, free_care_available, notes, 
  latitude, longitude
)
VALUES
  (
    'Troy Health Center', 1, '6 102nd St', 'Troy', 'NY', '12180',
    '518-833-6900', 'https://www.freeclinics.com/det/ny_Troy_Health_Center', NULL,
    'Mon-Fri 9AM-5PM', 'Community Health Center that operates under a sliding scale model. Federal funding allows service even without insurance.',
    true, true, true, 'Comprehensive primary care services for all ages.', 
    42.7372, -73.6807
  ),
  (
    'Troy Family Health Center', 1, '79 Vandenburgh Ave', 'Troy', 'NY', '12180',
    '518-271-0063', 'https://www.sphp.com/location/troy-family-health-center', NULL,
    'Mon-Fri 8AM-5PM', 'Accepts most insurance plans. Bring ID and insurance card.',
    true, true, false, 'Located across from Hudson Valley Community College. Services include routine pediatric exams, adult and geriatric care, immunizations, and wellness services.',
    42.6995, -73.6965
  ),
  (
    'Troy Medical Group', 1, '720 Hoosick Rd', 'Troy', 'NY', '12180',
    '518-272-7191', 'https://www.sphp.com/location/troy-medical-group', NULL,
    'Mon, Wed 8AM-5PM; Tue, Thu, Fri 8AM-4:30PM', 'Accepts most insurance plans. Call for details on self-pay options.',
    true, true, false, 'NCQA Level 3 Patient-Centered Medical Home (PCMH) located in Brunswick Plaza Shopping Center. Full range of adult and geriatric healthcare services.',
    42.7371, -73.6420
  ),
  (
    'Planned Parenthood Troy Health Center', 8, '120 Hoosick Street', 'Troy', 'NY', '12180',
    '518-434-5678', 'https://www.plannedparenthood.org/health-center/new-york/troy/12180/troy-health-center-2780-91020', NULL,
    'Call for hours; Teen clinic Tuesday 3-5PM', 'Available with or without insurance. Call for fee information.',
    true, true, true, E'Services include birth control, STD testing, and women''s health services. Teen clinic available. Walk-ins accepted for emergency contraception.',
    42.7316, -73.6757
  );

-- Seed Data Part 3: More Resources

-- Insert more resources
INSERT INTO resources (
  name, resource_type_id, address_line1, city, state, zip,
  phone, website, email, hours, eligibility_criteria,
  accepts_uninsured, sliding_scale, free_care_available, notes, 
  latitude, longitude
)
VALUES
  (
    'Samaritan Hospital', 2, '2215 Burdett Ave', 'Troy', 'NY', '12180',
    '518-271-3300', 'https://www.sphp.com/location/samaritan-hospital', NULL,
    '24/7', 'Emergency services available to all. Call about financial assistance programs.',
    true, true, false, '277-bed community hospital with emergency services, critical care, ambulatory surgery, cancer services, behavioral health services, and cardiac catheterization.',
    42.7338, -73.6599
  ),
  (
    'Rensselaer County Public Health', 7, '1600 7th Ave', 'Troy', 'NY', '12180',
    '518-270-2655', 'https://www.rensco.com/241/Public-Health', NULL,
    'Mon-Fri 8AM-4PM; Clinic hours vary', 'Must have updated immunization records and insurance card. Must be a Rensselaer County Resident.',
    true, false, false, 'Services include immunization clinics (Tuesday & Thursday 2-4PM) and STD clinic/HIV screening (Wednesday, appointment only).',
    42.7316, -73.6932
  ),
  (
    'Mohawk Ambulance Service', 6, '625 River St', 'Troy', 'NY', '12180',
    '518-274-4888', 'https://mohawkambulance.com', NULL,
    '24/7', 'Call to verify insurance coverage for transport.',
    true, false, false, 'One of the largest ambulance service providers in the area. Provides both emergency and non-emergency medical transportation.',
    42.7420, -73.6871
  ),
  (
    'Empire Ambulance Service', 6, '161 McChesney Ave', 'Troy', 'NY', '12180',
    '518-244-3311', NULL, NULL,
    '24/7', 'Medicaid and most insurances accepted. Call to verify coverage.',
    true, false, false, 'Provides medical transportation services in the Troy area.',
    42.7133, -73.6664
  );

-- Seed Data Part 4: Pharmacies

-- Insert pharmacy resources
INSERT INTO resources (
  name, resource_type_id, address_line1, city, state, zip,
  phone, website, email, hours, eligibility_criteria,
  accepts_uninsured, sliding_scale, free_care_available, notes, 
  latitude, longitude
)
VALUES
  (
    'Walmart Pharmacy', 3, '760 Hoosick Rd', 'Troy', 'NY', '12180',
    '518-279-0699', 'https://www.walmart.com/store/2370-troy-ny/pharmacy', NULL,
    'Hours vary; call for details', 'Open to all. Various prescription discount programs available.',
    true, false, false, 'Offers simple and affordable options for managing medications over the phone, online, and in person.',
    42.7372, -73.6424
  ),
  (
    'Walgreens Pharmacy', 3, '549 Hoosick St', 'Troy', 'NY', '12180',
    NULL, 'https://www.walgreens.com/locator/walgreens-549+hoosick+st-troy-ny-12180/id=10548', NULL,
    'Hours vary; call for details', 'Open to all. Various prescription discount programs available.',
    true, false, false, 'Full-service pharmacy with prescription services, immunizations, and health screenings.',
    42.7318, -73.6529
  ),
  (
    'Rite Aid Pharmacy', 3, '272 Hoosick Street', 'Troy', 'NY', '12180',
    '518-272-5735', 'https://www.riteaid.com/locations/ny/troy/272-hoosick-street.html', NULL,
    'Pharmacy: Mon-Fri 9AM-9PM, Sat-Sun varies', 'Open to all. Various prescription discount programs available.',
    true, false, false, 'Full-service pharmacy focused on improving health and wellness of the community.',
    42.7315, -73.6655
  ),
  (
    'Market 32 Pharmacy', 3, '79 Vandenburgh Ave', 'Troy', 'NY', '12180',
    NULL, 'https://www.pricechopper.com/stores/ny/troy/pharmacy-3.html', NULL,
    'Hours vary; call for details', 'Open to all. Various prescription discount programs available.',
    true, false, false, 'Offers medication delivery, Medicare consultations, immunizations, and nutritional guidance.',
    42.6995, -73.6965
  );

-- Seed Data Part 5: Relations

-- Connect resources with services
INSERT INTO resource_services (resource_id, service_id)
VALUES
  -- Troy Health Center
  (1, 1), (1, 2), (1, 3), 
  -- Troy Family Health Center
  (2, 1), (2, 2), (2, 3),
  -- Troy Medical Group
  (3, 1), (3, 3),
  -- Planned Parenthood
  (4, 3), (4, 12), (4, 13),
  -- Samaritan Hospital
  (5, 1), (5, 2), (5, 3), (5, 5), (5, 8),
  -- Rensselaer County Public Health
  (6, 11), (6, 12),
  -- Mohawk Ambulance
  (7, 10),
  -- Empire Ambulance
  (8, 10),
  -- Walmart Pharmacy
  (9, 6), (9, 7),
  -- Walgreens Pharmacy
  (10, 6), (10, 7),
  -- Rite Aid Pharmacy
  (11, 6), (11, 7),
  -- Market 32 Pharmacy
  (12, 6), (12, 7);

-- Connect resources with insurance
INSERT INTO resource_insurances (resource_id, insurance_id)
VALUES
  -- Troy Health Center
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
  -- Troy Family Health Center
  (2, 1), (2, 2), (2, 4), (2, 5),
  -- Troy Medical Group
  (3, 1), (3, 2), (3, 4), (3, 5),
  -- Planned Parenthood
  (4, 1), (4, 2), (4, 4), (4, 5), (4, 6),
  -- Samaritan Hospital
  (5, 1), (5, 2), (5, 4), (5, 5),
  -- Rensselaer County Public Health
  (6, 1), (6, 2), (6, 4), (6, 6),
  -- Mohawk Ambulance
  (7, 1), (7, 2), (7, 4),
  -- Empire Ambulance
  (8, 1), (8, 2), (8, 4),
  -- Walmart Pharmacy
  (9, 1), (9, 2), (9, 3), (9, 4),
  -- Walgreens Pharmacy
  (10, 1), (10, 2), (10, 3), (10, 4),
  -- Rite Aid Pharmacy
  (11, 1), (11, 2), (11, 3), (11, 4),
  -- Market 32 Pharmacy
  (12, 1), (12, 2), (12, 3), (12, 4);

-- Connect resources with languages
INSERT INTO resource_languages (resource_id, language_id)
VALUES
  -- Troy Health Center
  (1, 1), (1, 2),
  -- Troy Family Health Center
  (2, 1), (2, 2),
  -- Troy Medical Group
  (3, 1), (3, 2),
  -- Planned Parenthood
  (4, 1), (4, 2),
  -- Samaritan Hospital
  (5, 1), (5, 2), (5, 3),
  -- Rensselaer County Public Health
  (6, 1), (6, 2),
  -- Mohawk Ambulance
  (7, 1),
  -- Empire Ambulance
  (8, 1),
  -- Walmart Pharmacy
  (9, 1), (9, 2),
  -- Walgreens Pharmacy
  (10, 1), (10, 2),
  -- Rite Aid Pharmacy
  (11, 1), (11, 2),
  -- Market 32 Pharmacy
  (12, 1), (12, 2);

-- Connect resources with transportation options
INSERT INTO resource_transportation (resource_id, transportation_id, notes)
VALUES
  -- Troy Health Center
  (1, 1, 'Available for patients who qualify'),
  (1, 3, 'Available for Medicaid members'),
  -- Troy Family Health Center
  (2, 1, 'Available for patients who qualify'),
  (2, 3, 'Available for Medicaid members'),
  (2, 5, 'Ask staff about Uber Health for eligible patients'),
  (2, 6, 'Ask staff about Lyft Medical Transport for eligible patients'),
  -- Troy Medical Group
  (3, 1, 'Available for patients who qualify'),
  (3, 3, 'Available for Medicaid members'),
  (3, 5, 'Ask staff about Uber Health for eligible patients'),
  -- Planned Parenthood
  (4, 3, 'Available for Medicaid members'),
  -- Samaritan Hospital
  (5, 1, 'Available for patients who qualify'),
  (5, 2, 'Available for patients who qualify'),
  (5, 3, 'Available for Medicaid members'),
  (5, 4, 'Available for patients who qualify');

-- Seed Data Part 6: Programs and Feedback

-- Insert medication assistance programs
INSERT INTO medication_programs (
  name, provider, program_type, website, phone,
  eligibility_criteria, application_process, covered_medications, notes
)
VALUES
  (
    'NYRx', 'New York State Medicaid', 'Government Program',
    'https://www.health.ny.gov/health_care/medicaid/program/pharmacy.htm', NULL,
    'Must be eligible for Medicaid and enrolled in mainstream Managed Care plans, Health and Recovery Plans, or HIV-Special Needs Plans',
    'Apply through NY State of Health or local Department of Social Services',
    'Medically necessary FDA approved prescription and non-prescription drugs',
    'The New York State Medicaid Pharmacy program covers medically necessary FDA approved prescription and non-prescription drugs for Medicaid members.'
  ),
  (
    'New York Rx Card', 'New York Rx Card', 'Discount Card',
    'https://newyorkrxcard.com/', NULL,
    'All New Yorkers are eligible; no restrictions to membership and no applications to fill out',
    'Download free card from website or visit participating pharmacies',
    'Brand and generic medications with discounts up to 80%',
    'Compatible with all insurances and can be used during deductible periods or for medications not covered by insurance plans.'
  ),
  (
    'EPIC (Elderly Pharmaceutical Insurance Coverage)', 'New York State', 'Government Program',
    'https://www.health.ny.gov/health_care/epic/', NULL,
    'New York residents aged 65 or older with income up to $75,000 (single) or $100,000 (married)',
    'Complete application online or by mail',
    'Many prescription medications',
    'Helps seniors pay for prescription drugs with savings averaging 90% of the cost of medicines.'
  ),
  (
    'Walmart Prescription Program', 'Walmart', 'Retail Program',
    'https://www.walmart.com/cp/4-dollar-prescriptions/1078664', '518-279-0699',
    'Anyone can use this program',
    'No application needed, just ask pharmacy staff',
    'Selected generic medications starting at $4 for 30-day supply',
    'Available at Walmart Pharmacy on Hoosick Rd.'
  ),
  (
    'Walgreens Prescription Savings Club', 'Walgreens', 'Membership Program',
    'https://www.walgreens.com/topic/promotion/prescription-savings-club.jsp', NULL,
    'Annual membership fee required ($20 individual, $35 family)',
    'Sign up at any Walgreens location or online',
    'Thousands of medications with special pricing',
    'Available at Walgreens Pharmacy on Hoosick St.'
  ),
  (
    'Rite Aid Rx Savings Program', 'Rite Aid', 'Retail Program',
    'https://www.riteaid.com/pharmacy/prescription-savings', '518-272-5735',
    'Anyone without insurance can use this program',
    'Sign up at any Rite Aid location',
    'Generic medications at special pricing',
    'Available at Rite Aid Pharmacy on Hoosick Street.'
  );

-- Add some sample feedback
INSERT INTO resource_feedback (resource_id, rating, comment)
VALUES
  (1, 5, 'Very helpful staff and they worked with me on a payment plan.'),
  (1, 4, 'Good care but had to wait a while.'),
  (2, 5, 'The doctors are great with my kids, very patient and thorough.'),
  (3, 3, 'Long wait times but knowledgeable staff.'),
  (4, 5, 'Respectful, confidential service. Very supportive staff.'),
  (5, 4, 'Emergency department was fast and professional.'),
  (9, 5, 'Their discount program saved me a lot on my medications!'),
  (10, 4, 'Pharmacist took time to explain all my medications.');

