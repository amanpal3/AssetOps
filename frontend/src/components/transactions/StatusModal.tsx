import React from 'react';

export const StatusModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-line">
        <h3 className="font-semibold text-ink">Transaction Status</h3>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">Close</button>
      </div>
    </div>
  );
};
