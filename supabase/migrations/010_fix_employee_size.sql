-- =============================================
-- Fix existing employee_size data to match CHECK constraint
-- Run this if migration 010 already partially ran
-- =============================================

-- Drop the failing CHECK constraint if it exists
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_employee_size_check;

-- Normalize existing employee_size values
UPDATE companies
SET employee_size = CASE
  WHEN employee_size IN ('small', 'Small', 'SMALL') THEN '1-10'
  WHEN employee_size IN ('medium', 'Medium', 'MEDIUM') THEN '11-50'
  WHEN employee_size IN ('large', 'Large', 'LARGE') THEN '51-200'
  WHEN employee_size IN ('enterprise', 'Enterprise', 'ENTERPRISE') THEN '201-500'
  WHEN employee_size = '1-10' THEN '1-10'
  WHEN employee_size = '11-50' THEN '11-50'
  WHEN employee_size = '51-200' THEN '51-200'
  WHEN employee_size = '201-500' THEN '201-500'
  WHEN employee_size = '500+' THEN '500+'
  ELSE '11-50' -- Default for unrecognized values
END
WHERE employee_size IS NOT NULL;

-- Add the CHECK constraint back
ALTER TABLE companies
ADD CONSTRAINT companies_employee_size_check
CHECK (employee_size IS NULL OR employee_size IN ('1-10', '11-50', '51-200', '201-500', '500+'));
