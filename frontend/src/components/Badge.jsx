const variants = {
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
  upcoming: 'bg-purple-100 text-purple-800',
  past: 'bg-gray-100 text-gray-700',
};

export default function Badge({ status, children, className = '' }) {
  const style = variants[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style} ${className}`}>
      {children || status}
    </span>
  );
}
