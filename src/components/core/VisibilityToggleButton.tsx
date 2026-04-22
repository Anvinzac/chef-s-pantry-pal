import React from 'react';
import { Eye } from 'lucide-react';

interface VisibilityToggleButtonProps {
  onClick: () => void;
}

const VisibilityToggleButton: React.FC<VisibilityToggleButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg z-50"
      onClick={onClick}
      aria-label="Toggle component visibility"
    >
      <Eye size={20} />
    </button>
  );
};

export default VisibilityToggleButton;