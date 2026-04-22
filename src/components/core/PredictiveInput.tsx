import React, { useState, useEffect, useCallback } from 'react';
import { SimplePredictionEngine, PredictionResult } from '@/lib/predictionEngine';

interface PredictiveInputProps {
  onPrediction: (result: PredictionResult) => void;
  initialValue?: string;
  placeholder?: string;
}

const PredictiveInput: React.FC<PredictiveInputProps> = ({ 
  onPrediction, 
  initialValue = '', 
  placeholder = 'Enter ingredient name...' 
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuantity, setLastQuantity] = useState(1);
  
  const predictionEngine = new SimplePredictionEngine();

  const handleInputChange = useCallback(async (value: string) => {
    setInputValue(value);
    
    if (value.trim().length === 0) {
      setPredictions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const prediction = await predictionEngine.predict(
        { name: value, quantity: lastQuantity }, 
        'default-pantry-template'
      );
      setPredictions([prediction]);
      onPrediction(prediction);
    } catch (error) {
      console.error('Prediction error:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [lastQuantity, onPrediction]);

  useEffect(() => {
    const handler = setTimeout(() => {
      handleInputChange(inputValue);
    }, 300); // Debounce input

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, handleInputChange]);

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 border rounded-md pr-8"
      />
      {isLoading && (
        <div className="absolute right-2 top-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {/* Prediction chips display */}
      {predictions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {predictions.map((pred, index) => (
            <div 
              key={index}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
            >
              <span>{pred.category}</span>
              <span>•</span>
              <span>{pred.unit}</span>
              {pred.confidence >= 0.8 && (
                <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictiveInput;