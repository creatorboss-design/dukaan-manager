import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function Toast({ message, type }) {
  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${styles[type]} animate-in slide-in-from-bottom-5 fade-in duration-300`}>
      {icons[type]}
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
