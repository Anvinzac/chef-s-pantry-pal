import { useState } from 'react';
import { Ingredient, UNIT_LABELS } from '@/types/ingredient';
import { X, Delete, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NumpadModalProps {
  ingredient: Ingredient | null;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

export function NumpadModal({ ingredient, onConfirm, onClose }: NumpadModalProps) {
  const [value, setValue] = useState('');

  if (!ingredient) return null;

  const unit = UNIT_LABELS[ingredient.unit];

  const handleKey = (key: string) => {
    if (key === 'del') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) setValue(prev => prev + '.');
    } else {
      setValue(prev => {
        if (prev.length >= 6) return prev;
        return prev + key;
      });
    }
  };

  const handleConfirm = () => {
    const num = parseFloat(value);
    if (num > 0) {
      onConfirm(num);
      setValue('');
      onClose();
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="bg-card w-full max-w-md rounded-t-3xl p-5 safe-bottom"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ingredient.emoji}</span>
              <div>
                <p className="font-bold text-card-foreground">{ingredient.name}</p>
                <p className="text-xs text-muted-foreground">Nhập số lượng ({unit})</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Display */}
          <div className="bg-muted rounded-2xl px-4 py-3 mb-4 flex items-baseline justify-center gap-2">
            <span className="text-4xl font-extrabold text-foreground tabular-nums">
              {value || '0'}
            </span>
            <span className="text-lg font-bold text-muted-foreground">{unit}</span>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {keys.map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-14 rounded-2xl font-bold text-xl bg-muted text-card-foreground hover:bg-primary/10 active:scale-95 transition-all duration-100 flex items-center justify-center"
              >
                {key === 'del' ? <Delete size={22} /> : key}
              </button>
            ))}
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={!value || parseFloat(value) <= 0}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            <Check size={22} />
            Thêm {value || '0'}{unit} {ingredient.name}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
