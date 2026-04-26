import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { categories } from "@/data/defaultIngredients";
import { api } from "@/lib/api";
import { ChevronLeft } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  category: string;
  subcategory?: string;
}

interface IngredientWizardProps {
  spaceId: string;
  onSelect: (ingredient: Ingredient) => void;
  onCancel: () => void;
}

export function IngredientWizard({ spaceId, onSelect, onCancel }: IngredientWizardProps) {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getIngredients().then(setAllIngredients).catch(() => {});
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return allIngredients.filter(i => i.category === selectedCategory);
  }, [allIngredients, selectedCategory]);

  // Group by subcategory for categories that have them
  const selectedCatMeta = useMemo(() => categories.find(c => c.id === selectedCategory), [selectedCategory]);
  const hasSubcategories = !!(selectedCatMeta?.subcategories && selectedCatMeta.subcategories.length > 0);

  const groupedBySubcategory = useMemo(() => {
    if (!hasSubcategories || !selectedCatMeta?.subcategories) return [];
    const subs = selectedCatMeta.subcategories;
    const groups = subs.map(sub => ({
      ...sub,
      items: filteredByCategory.filter(i => i.subcategory === sub.id),
    }));
    // Also collect items with no subcategory
    const unmatched = filteredByCategory.filter(i => !i.subcategory || !subs.some(s => s.id === i.subcategory));
    if (unmatched.length > 0) {
      groups.push({ id: '_other', name: 'Khác', emoji: '📦', items: unmatched });
    }
    return groups.filter(g => g.items.length > 0);
  }, [filteredByCategory, hasSubcategories, selectedCatMeta]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return allIngredients.filter(i =>
      i.name.toLowerCase().startsWith(q)
    ).slice(0, 15);
  }, [allIngredients, search]);

  const handleSelect = useCallback((ing: Ingredient) => {
    onSelect(ing);
  }, [onSelect]);

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onCancel();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <button onClick={handleBack} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <span className="font-extrabold text-sm text-foreground flex-1">
          {selectedCategory
            ? `${selectedCatMeta?.emoji ?? ''} ${selectedCatMeta?.name ?? 'Chọn'}`
            : "Thêm nguyên liệu"}
        </span>
      </div>

      {/* Main scrollable area — always shows category grid or ingredient list */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {/* Category grid (when no category selected) */}
        {!selectedCategory && (
          <div className="grid grid-cols-3 gap-1.5 p-2">
            {categories.map(cat => {
              const count = allIngredients.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95 min-h-[64px]"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] font-extrabold text-foreground leading-tight text-center">{cat.name}</span>
                  <span className="text-[8px] text-muted-foreground font-semibold">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Ingredient list — with subcategory sections if applicable */}
        {selectedCategory && !hasSubcategories && (
          <div className="flex flex-wrap gap-1.5 p-2">
            {filteredByCategory.map(ing => (
              <IngredientChip key={ing.id} ing={ing} onSelect={handleSelect} />
            ))}
          </div>
        )}

        {selectedCategory && hasSubcategories && (
          <div className="p-2 space-y-3">
            {groupedBySubcategory.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <span className="text-sm">{group.emoji}</span>
                  <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide">{group.name}</span>
                  <span className="text-[9px] text-muted-foreground">({group.items.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(ing => (
                    <IngredientChip key={ing.id} ing={ing} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom search area — chips appear inside the input area */}
      <div className="border-t border-border/50 bg-card shrink-0 mb-8">
        {/* Search result chips */}
        {search.trim().length > 0 && (
          <div className="px-2 pt-2 pb-1 max-h-[120px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground py-1">Không tìm thấy "{search}"</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map(ing => (
                  <IngredientChip key={ing.id} ing={ing} onSelect={handleSelect} size="sm" />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="px-2 pb-2 pt-1">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Gõ tên để tìm nhanh..."
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
    </div>
  );
}

function IngredientChip({
  ing,
  onSelect,
  size = "md",
}: {
  ing: { id: string; name: string; emoji: string; unit: string };
  onSelect: (ing: any) => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={() => onSelect(ing)}
      className={`flex items-center gap-1 rounded-lg bg-muted/50 border border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95 ${
        size === "sm" ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
    >
      <span className={size === "sm" ? "text-sm" : "text-base"}>{ing.emoji}</span>
      <span className={`font-bold text-foreground ${size === "sm" ? "text-[10px]" : "text-xs"}`}>{ing.name}</span>
    </button>
  );
}
