-- =====================================================
-- Migration 016: Cleanup Duplicate Permissions
-- =====================================================
-- Removes duplicate permissions from roles table
-- This fixes the issue caused by running migration 015 multiple times
-- =====================================================

-- Function to remove duplicates from JSONB array
CREATE OR REPLACE FUNCTION jsonb_array_unique(arr jsonb)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  element jsonb;
BEGIN
  FOR element IN SELECT jsonb_array_elements(arr)
  LOOP
    IF NOT result @> jsonb_build_array(element) THEN
      result := result || jsonb_build_array(element);
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Clean up all roles by removing duplicate permissions
UPDATE roles
SET permissions = jsonb_array_unique(permissions)
WHERE is_system = true;

-- Verification: Show cleaned up permission counts
-- Uncomment to run verification query:
--
-- SELECT
--   organization_id,
--   slug,
--   jsonb_array_length(permissions) as permission_count
-- FROM roles
-- WHERE is_system = true
-- ORDER BY organization_id, slug;

-- =====================================================
-- Expected Results After Running This Migration:
-- =====================================================
-- admin: 55 permissions (no duplicates)
-- manager: 40 permissions (no duplicates)
-- agent: 20 permissions (no duplicates)
-- member: 11 permissions (no duplicates)
