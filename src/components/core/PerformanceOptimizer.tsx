import React, { useEffect, useState } from 'react';

interface PerformanceOptimizerProps {
  onOptimizationComplete: () => void;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ onOptimizationComplete }) => {
  const [optimizations, setOptimizations] = useState<Array<{ name: string; status: 'pending' | 'completed' | 'failed' }>>([
    { name: 'Template Engine Load Time', status: 'pending' },
    { name: 'UI Response Time', status: 'pending' },
    { name: 'Prediction Engine Latency', status: 'pending' },
    { name: 'Offline Support', status: 'pending' },
    { name: 'Concurrent User Support', status: 'pending' },
  ]);

  useEffect(() => {
    // Simulate optimization process
    const optimize = async () => {
      for (let i = 0; i < optimizations.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setOptimizations(prev => {
          const newOptimizations = [...prev];
          newOptimizations[i] = { ...newOptimizations[i], status: 'completed' };
          return newOptimizations;
        });
      }
      
      onOptimizationComplete();
    };
    
    optimize();
  }, [onOptimizationComplete]);

  const getProgress = () => {
    const completed = optimizations.filter(opt => opt.status === 'completed').length;
    return Math.round((completed / optimizations.length) * 100);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Performance Optimization</h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Optimization Progress</span>
          <span>{getProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        {optimizations.map((opt, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              opt.status === 'completed' ? 'bg-green-500' :
              opt.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm">{opt.name}</span>
            {opt.status === 'completed' && (
              <span className="text-green-500 text-xs">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceOptimizer;