/**
 * Filter Utilities
 * Helper functions for filter operations
 */

/**
 * Get month name in current language
 */
export const getMonthName = (monthIndex, language = 'en') => {
  const months = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
};

/**
 * Get last 3 months as options
 */
export const getLastThreeMonths = (language = 'en') => {
  const now = new Date();
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    months.push({
      value: `month-${year}-${monthIndex}`,
      label: `${getMonthName(monthIndex, language)} ${year}`
    });
  }
  return months;
};

/**
 * Get period options for date filters
 */
export const getPeriodOptions = (language = 'en') => {
  const currentYear = new Date().getFullYear();
  const lastThreeMonths = getLastThreeMonths(language);

  return [
    ...lastThreeMonths,
    { value: 'q1', label: 'Q1 (Jan-Mar)' },
    { value: 'q2', label: 'Q2 (Apr-Jun)' },
    { value: 'q3', label: 'Q3 (Jul-Sep)' },
    { value: 'q4', label: 'Q4 (Oct-Dec)' },
    { value: 'thisYear', label: `${currentYear}` },
    { value: 'lastYear', label: `${currentYear - 1}` },
  ];
};

/**
 * Count active filters
 */
export const countActiveFilters = (filters) => {
  let count = 0;
  if (filters.assignedTo) count++;
  if (filters.tags && filters.tags.length > 0) count++;
  if (filters.probability) count++;
  if (filters.valueMin) count++;
  if (filters.valueMax) count++;
  if (filters.expectedClosePeriod) count++;
  if (filters.createdPeriod) count++;
  return count;
};
