import React from 'react';

interface ComponentDebugOverlayProps {
  name: string;
  description?: string;
  bindings?: Record<string, any>;
}

const ComponentDebugOverlay: React.FC<ComponentDebugOverlayProps> = ({ 
  name, 
  description, 
  bindings 
}) => {
  return (
    <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs p-2 rounded shadow-lg z-10">
      <div className="font-bold">{name}</div>
      {description && <div className="italic">{description}</div>}
      {bindings && (
        <div className="mt-1">
          <div className="font-semibold">Bindings:</div>
          {Object.entries(bindings).map(([key, value]) => (
            <div key={key} className="text-xs">
              {key}: {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComponentDebugOverlay;