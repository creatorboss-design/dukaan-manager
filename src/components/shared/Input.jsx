export default function Input({ label, type = "text", value, onChange, placeholder, required, className = "", min, step }) {
  return (
    <div className={`mb-3 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={required} min={min} step={step}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>
  );
}
