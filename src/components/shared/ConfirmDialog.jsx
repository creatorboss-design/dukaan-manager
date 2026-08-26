import Modal from "./Modal";
import BigButton from "./BigButton";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button 
          onClick={onClose} 
          className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => { onConfirm(); onClose(); }} 
          className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
