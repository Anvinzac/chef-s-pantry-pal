import { useState } from 'react';
import { Ingredient, UnitOfMeasurement, UNIT_FULL_LABELS } from '@/types/ingredient';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingredient: Omit<Ingredient, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<Ingredient>) => void;
  onDelete?: (id: string) => void;
  editIngredient?: Ingredient | null;
  categoryId: string;
}

const UNITS: UnitOfMeasurement[] = ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'bottle', 'box', 'bag', 'can', 'roll', 'dozen', 'tank', 'pair'];

const EMOJIS = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍇', '🍓', '🫐', '🍑', '🥝', '🍍', '🥭', '🥥', '🥑', '🌮', '🍕', '🥗', '🍖', '🧃', '📦', '🧊', '🌡️', '🔪', '🍳', '🥄'];

export function AddIngredientModal({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  editIngredient,
  categoryId,
}: AddIngredientModalProps) {
  const [name, setName] = useState(editIngredient?.name || '');
  const [emoji, setEmoji] = useState(editIngredient?.emoji || '🍎');
  const [unit, setUnit] = useState<UnitOfMeasurement>(editIngredient?.unit || 'kg');
  const [price, setPrice] = useState(editIngredient?.referencePrice?.toString() || '');
  const [q1, setQ1] = useState(editIngredient?.quickQuantities[0]?.toString() || '1');
  const [q2, setQ2] = useState(editIngredient?.quickQuantities[1]?.toString() || '2');

  if (!isOpen) return null;

  const isEditing = !!editIngredient;

  const handleSubmit = () => {
    if (!name.trim()) return;

    const data: Omit<Ingredient, 'id'> = {
      name: name.trim(),
      emoji,
      unit,
      category: categoryId,
      referencePrice: price ? parseFloat(price) : undefined,
      quickQuantities: [parseFloat(q1) || 1, parseFloat(q2) || 2],
    };

    if (isEditing && onUpdate) {
      onUpdate(editIngredient!.id, data);
    } else {
      onAdd(data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && onDelete) {
      onDelete(editIngredient!.id);
      onClose();
    }
  };

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
          className="bg-card w-full max-w-md rounded-t-3xl p-5 safe-bottom max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-lg text-foreground">
              {isEditing ? 'Edit Ingredient' : 'Add Ingredient'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Emoji picker */}
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Emoji</label>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-2xl p-1.5 rounded-xl transition-all ${emoji === e ? 'bg-primary/15 scale-110 ring-2 ring-primary' : 'hover:bg-muted'}`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Name */}
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ingredient name"
            className="w-full px-4 py-3 bg-muted rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 mb-4 outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Unit */}
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Unit of measurement</label>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {UNITS.map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${unit === u ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
              >
                {UNIT_FULL_LABELS[u]}
              </button>
            ))}
          </div>

          {/* Reference price */}
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Reference price</label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
            type="number"
            step="0.01"
            className="w-full px-4 py-3 bg-muted rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 mb-4 outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Quick quantities */}
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Quick buttons</label>
          <div className="flex gap-2 mb-6">
            <input
              value={q1}
              onChange={e => setQ1(e.target.value)}
              placeholder="1"
              type="number"
              step="0.1"
              className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm font-semibold text-foreground text-center outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={q2}
              onChange={e => setQ2(e.target.value)}
              placeholder="2"
              type="number"
              step="0.1"
              className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm font-semibold text-foreground text-center outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isEditing && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-3.5 rounded-2xl bg-destructive text-destructive-foreground font-bold flex items-center gap-2"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              {isEditing ? <Save size={18} /> : <Plus size={18} />}
              {isEditing ? 'Save Changes' : 'Add Ingredient'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
