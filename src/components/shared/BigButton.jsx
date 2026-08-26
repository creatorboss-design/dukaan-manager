export default function BigButton({ children, onClick, variant = "primary", type = "button", className = "", disabled = false }) {
  const base = "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all active:scale-95 disabled:opacity-50";
  const variants = {
    primary:   "bg-blue-700 text-white shadow-md hover:bg-blue-800",
    success:   "bg-green-600 text-white shadow-md hover:bg-green-700",
    danger:    "bg-red-500 text-white shadow-md hover:bg-red-600",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline:   "border-2 border-blue-700 text-blue-700 hover:bg-blue-50",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant] || ""} ${className}`}>
      {children}
    </button>
  );
}
