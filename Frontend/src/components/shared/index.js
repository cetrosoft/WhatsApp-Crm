/**
 * Shared Reusable Components
 * Barrel export for clean imports across the application
 *
 * Usage: import { SearchableSelect, MultiSelectTags } from '@/components/shared'
 */

// ==================== Shared/Universal Components ====================

export { default as SearchableSelect } from '../SearchableSelect';
export { default as MultiSelectTags } from '../MultiSelectTags';

// Filter Components
export { default as SearchableFilterDropdown } from '../Deals/SearchableFilterDropdown';
export { default as FilterValueRange } from '../Deals/FilterValueRange';
export { default as FilterDatePeriod } from '../Deals/FilterDatePeriod';

// Form Components
export { default as CountryCodeSelector } from '../Deals/CountryCodeSelector';

// ==================== Deals Module Components ====================

export { default as ContactSearchDropdown } from '../Deals/ContactSearchDropdown';
export { default as QuickAddFormFields } from '../Deals/QuickAddFormFields';
export { default as DealFormFields } from '../Deals/DealFormFields';
export { default as DealListView } from '../Deals/DealListView';

// ==================== Contacts Module Components ====================

export { default as ContactsTable } from '../Contacts/ContactsTable';
export { default as ContactsFilters } from '../Contacts/ContactsFilters';
export { default as ContactFormFields } from '../Contacts/ContactFormFields';

// ==================== Companies Module Components ====================

export { default as CompanyBasicTab } from '../Companies/CompanyBasicTab';
export { default as CompanyLegalTab } from '../Companies/CompanyLegalTab';
export { default as CompanyLocationTab } from '../Companies/CompanyLocationTab';
export { default as CompanyCardView } from '../Companies/CompanyCardView';
export { default as CompanyListView } from '../Companies/CompanyListView';

// ==================== Segments Module Components ====================

export { default as SegmentHeader } from '../Segments/SegmentHeader';
export { default as SegmentValueInput } from '../Segments/SegmentValueInput';
export { default as SegmentConditionRow } from '../Segments/SegmentConditionRow';

// ==================== Team Module Components ====================

export { default as RoleCard } from '../Team/RoleCard';
export { default as DeleteRoleModal } from '../Team/DeleteRoleModal';
export { default as UserPermissionsList } from '../Team/UserPermissionsList';
