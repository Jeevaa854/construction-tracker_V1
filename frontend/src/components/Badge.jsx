const colorMap = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'on-hold': 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  todo: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  review: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  low: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  available: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'in-use': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'under-maintenance': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const Badge = ({ value }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
      colorMap[value] || 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }`}
  >
    {value?.replace('-', ' ')}
  </span>
);

export default Badge;
