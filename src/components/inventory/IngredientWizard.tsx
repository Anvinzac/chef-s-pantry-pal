import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { categories } from "@/data/defaultIngredients";
import { api } from "@/lib/api";
import { ChevronLeft, Check, X } from "lucide-react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useOrder } from "@/hooks/useOrder";

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  category: string;
  subcategory?: string;
}

interface WizardResult {
  name: string;
  emoji: string;
  unit: string;
  quantity: string;
  note: string;
}

interface IngredientWizardProps {
  spaceId: string;
  onSelect: (data: WizardResult) => void;
  onCancel: () => void;
}

const STATUSES = ["Đủ", "Sắp hết", "Hết", "Mới nhập"];

/** Inline style for staggered entry animation */
const stagger = (i: number) => ({ animationDelay: `${i * 40}ms` } as React.CSSProperties);

export function IngredientWizard({ spaceId, onSelect, onCancel }: IngredientWizardProps) {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("Mới nhập");
  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible();

  useEffect(() => {
    api.getIngredients().then(setAllIngredients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!picked) setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 150);
  }, [picked]);

  useEffect(() => {
    if (picked) {
      setTimeout(() => {
        qtyRef.current?.focus({ preventScroll: true });
        // Scroll only the wizard's own scroll container, not cascading ancestors.
        const scroller = formRef.current?.closest<HTMLElement>('.overflow-y-auto');
        if (scroller && formRef.current) {
          const offset =
            formRef.current.offsetTop -
            scroller.clientHeight / 2 +
            formRef.current.offsetHeight / 2;
          scroller.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
        }
      }, 100);
    }
  }, [picked]);

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return allIngredients.filter(i => i.category === selectedCategory);
  }, [allIngredients, selectedCategory]);

  const filteredBySubcategory = useMemo(() => {
    if (!selectedCategory || !selectedSubcategory) return filteredByCategory;
    return filteredByCategory.filter(i => i.subcategory === selectedSubcategory);
  }, [filteredByCategory, selectedSubcategory]);

  const selectedCatMeta = useMemo(() => categories.find(c => c.id === selectedCategory), [selectedCategory]);
  const hasSubcategories = !!(selectedCatMeta?.subcategories && selectedCatMeta.subcategories.length > 0);

  const groupedBySubcategory = useMemo(() => {
    if (!hasSubcategories || !selectedCatMeta?.subcategories) return [];
    const subs = selectedCatMeta.subcategories;
    const groups = subs.map(sub => ({
      ...sub,
      items: selectedSubcategory ? (selectedSubcategory === sub.id ? filteredByCategory.filter(i => i.subcategory === sub.id) : []) : filteredByCategory.filter(i => i.subcategory === sub.id),
    }));
    if (selectedSubcategory) {
      return groups.find(g => g.id === selectedSubcategory) ? [groups.find(g => g.id === selectedSubcategory)!] : [];
    }
    const unmatched = filteredByCategory.filter(i => !i.subcategory || !subs.some(s => s.id === i.subcategory));
    if (unmatched.length > 0) groups.push({ id: '_other', name: 'Khác', emoji: '📦', items: unmatched });
    return groups.filter(g => g.items.length > 0);
  }, [filteredByCategory, hasSubcategories, selectedCatMeta, selectedSubcategory]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return allIngredients.filter(i => i.name.toLowerCase().startsWith(q)).slice(0, 15);
  }, [allIngredients, search]);

  const handlePick = useCallback((ing: Ingredient) => {
    setPicked(ing);
    setQuantity("");
    setNote("Mới nhập");
  }, []);

  const handleFinish = useCallback(() => {
    if (!picked) return;
    onSelect({ name: picked.name, emoji: picked.emoji, unit: picked.unit, quantity: quantity || "0", note });
  }, [picked, quantity, note, onSelect]);

  const handleBack = () => {
    if (picked) { setPicked(null); return; }
    if (selectedSubcategory) { setSelectedSubcategory(null); setSelectedCategory(null); return; }
    if (selectedCategory) { setSelectedCategory(null); return; }
    onCancel();
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0 animate-entry">
        <button onClick={handleBack} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <span className="font-extrabold text-sm text-foreground flex-1 truncate">
          {selectedSubcategory
            ? `${selectedCatMeta?.subcategories?.find(s => s.id === selectedSubcategory)?.emoji ?? ''} ${selectedCatMeta?.subcategories?.find(s => s.id === selectedSubcategory)?.name ?? ''}`
            : selectedCategory
            ? `${selectedCatMeta?.emoji ?? ''} ${selectedCatMeta?.name ?? ''}`
            : "Thêm nguyên liệu"}
        </span>
        {!picked && !selectedCategory && (
          <button onClick={onCancel} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors active:scale-95">
            <X size={14} />
            Hủy
          </button>
        )}
      </div>

      {/* Single scrollable area */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {/* Category listing — 3-column layout */}
        {!selectedCategory && (
          <div className="flex gap-1.5 p-2 h-[calc(100vh-160px)]">
            {/* Left: Vegetables container (40%) */}
            <div className="w-[50%] shrink-0 rounded-xl border-2 border-primary/30 bg-primary/5 flex flex-col">
              <div className="px-2 py-2 border-b border-primary/20 shrink-0">
                <span className="text-xs font-extrabold text-primary uppercase tracking-wide">🥬 Rau củ</span>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5">
                <div className="grid grid-cols-2 gap-1">
                  {categories.find(c => c.id === 'vegetables')?.subcategories?.map((sub, i) => {
                    const count = allIngredients.filter(ig => ig.category === 'vegetables' && ig.subcategory === sub.id).length;
                    return (
                      <button key={sub.id} onClick={() => { setSelectedCategory('vegetables'); setSelectedSubcategory(sub.id); }}
                        className="animate-entry flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border border-border/30 bg-card hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95"
                        style={stagger(i)}>
                        <span className="text-base">{sub.emoji}</span>
                        <span className="text-[9px] font-extrabold text-foreground leading-tight text-center line-clamp-2">{sub.name}</span>
                        <span className="text-[8px] text-muted-foreground font-semibold">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle + Right: remaining categories (~30% each) */}
            {(() => {
              const rest = categories.filter(c => c.id !== 'vegetables');
              const mid = Math.ceil(rest.length / 2);
              const leftCol = rest.slice(0, mid);
              const rightCol = rest.slice(mid);
              return (
                <>
                   <div className="w-[25%] shrink-0 overflow-y-auto">
                    <div className="flex flex-col gap-1.5">
                      {leftCol.map((cat, i) => {
                        const count = allIngredients.filter(ig => ig.category === cat.id).length;
                        return (
                          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                            className="animate-entry flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95"
                            style={stagger(mid + i)}>
                            <span className="text-xl">{cat.emoji}</span>
                            <span className="text-[11px] font-extrabold text-foreground leading-tight text-center">{cat.name}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                   <div className="w-[25%] shrink-0 overflow-y-auto">
                    <div className="flex flex-col gap-1.5">
                      {rightCol.map((cat, i) => {
                        const count = allIngredients.filter(ig => ig.category === cat.id).length;
                        return (
                          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                            className="animate-entry flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95"
                            style={stagger(mid + rightCol.length + i)}>
                            <span className="text-xl">{cat.emoji}</span>
                            <span className="text-[11px] font-extrabold text-foreground leading-tight text-center">{cat.name}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Ingredient chips — flat list */}
        {selectedCategory && !hasSubcategories && (
          <div className="flex flex-wrap gap-1.5 p-2">
            {filteredByCategory.map((ing, i) => (
              <IngredientChip key={ing.id} ing={ing} picked={picked?.id === ing.id} onSelect={handlePick} delay={i} />
            ))}
          </div>
        )}

        {/* Ingredient chips — with subcategory sections */}
        {selectedCategory && hasSubcategories && (
          <div className="p-2 space-y-3">
            {groupedBySubcategory.map((group, gi) => {
              const baseDelay = gi * 3;
              return (
                <div key={group.id}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1 animate-entry" style={stagger(baseDelay)}>
                    <span className="text-sm">{group.emoji}</span>
                    <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide">{group.name}</span>
                    <span className="text-[9px] text-muted-foreground">({group.items.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((ing, i) => (
                      <IngredientChip key={ing.id} ing={ing} picked={picked?.id === ing.id} onSelect={handlePick} delay={baseDelay + 1 + i} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline form — appears below chips when an ingredient is picked */}
        {picked && (
          <div ref={formRef} className="mx-2 mt-3 mb-8 p-3 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-3 animate-entry">
            {/* Selected item header */}
            <div className="flex items-center gap-2 animate-entry" style={stagger(0)}>
              <span className="text-2xl">{picked.emoji}</span>
              <div>
                <p className="font-extrabold text-sm text-foreground">{picked.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{picked.unit}</p>
              </div>
            </div>

            {/* Quantity */}
            <div className="animate-entry" style={stagger(1)}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">
                Số lượng
              </label>
              <div className="relative">
                <input
                  ref={qtyRef}
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleFinish(); }}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg bg-card border-2 border-border text-base font-extrabold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
                {/* Trailing unit label that follows the number */}
                <span
                  className="absolute top-0 bottom-0 flex items-center pointer-events-none text-base font-extrabold text-muted-foreground/60"
                  style={{ left: `calc(0.75rem + ${Math.max((quantity || "0").length, 1)}ch + 2px)` }}
                >
                  {picked.unit}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="animate-entry" style={stagger(2)}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s, i) => (
                  <button key={s} onClick={() => setNote(s)}
                    className={`animate-entry px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                      note === s
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 bg-card text-foreground hover:border-primary/40"
                    }`}
                    style={stagger(3 + i)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleFinish}
              className="animate-entry w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={stagger(7)}>
              <Check size={16} />
              Thêm vào kho
            </button>
          </div>
        )}
      </div>

      {/* Bottom search bar — fixed height, search input always at bottom edge */}
      <div 
        className="relative border-t border-border/50 bg-card shrink-0 animate-entry transition-[padding] duration-200" 
        style={{ 
          ...stagger(categories.length),
          paddingBottom: isKeyboardVisible ? `${keyboardHeight}px` : undefined 
        }}
      >
        {/* Recommendation chips — absolutely positioned above search bar, never pushes it */}
        {search.trim().length > 0 && (
          <div className="absolute bottom-full left-0 right-0 max-h-[120px] overflow-y-auto bg-card border-t border-border/50 px-2 pt-2 pb-1 z-10">
            {searchResults.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground py-1">Không tìm thấy "{search}"</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((ing, i) => (
                  <IngredientChip key={ing.id} ing={ing} picked={picked?.id === ing.id} onSelect={handlePick} size="sm" delay={i} />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Search input — stays at the bottom, right above keyboard */}
        <div className="px-2 pb-2 pt-1">
          <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Gõ tên để tìm nhanh..."
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>
    </div>
  );
}

function IngredientChip({ ing, picked, onSelect, size = "md", delay = 0 }: {
  ing: Ingredient; picked: boolean; onSelect: (ing: Ingredient) => void; size?: "sm" | "md"; delay?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(ing.name);
  const [lastTap, setLastTap] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateIngredient } = useOrder();

  useEffect(() => {
    if (editing) {
      setEditName(ing.name);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [editing, ing.name]);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 350) {
      e.preventDefault();
      setEditing(true);
    }
    setLastTap(now);
  }, [lastTap]);

  const handleSave = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== ing.name) {
      api.updateIngredient(ing.id, { name: trimmed }).catch((err) => {
        console.error('[IngredientChip] Failed to save name:', err);
      });
      updateIngredient(ing.id, { name: trimmed });
    }
    setEditing(false);
  }, [editName, ing.id, ing.name, updateIngredient]);

  const handleCancel = useCallback(() => {
    setEditName(ing.name);
    setEditing(false);
  }, [ing.name]);

  const handleBlur = useCallback(() => {
    if (editName.trim() && editName.trim() !== ing.name) {
      handleSave();
    } else {
      handleCancel();
    }
  }, [editName, ing.name, handleSave, handleCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }, [handleSave, handleCancel]);

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-primary bg-card px-2 py-1 animate-entry">
        <input
          ref={inputRef}
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-20 px-1 py-0.5 bg-transparent border-b border-primary text-xs font-bold text-foreground focus:outline-none"
        />
        <button onClick={handleSave} className="p-0.5 text-primary hover:text-primary/80">
          <Check size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(ing)}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      className={`animate-entry flex items-center gap-1 rounded-lg border transition-all active:scale-95 ${
        picked
          ? "border-primary bg-primary/15 ring-2 ring-primary/30"
          : "border-border/50 bg-muted/50 hover:bg-primary/10 hover:border-primary/40"
      } ${size === "sm" ? "px-2 py-1" : "px-2.5 py-1.5"}`}
      style={{ animationDelay: `${delay * 30}ms` }}>
      <span className={size === "sm" ? "text-sm" : "text-base"}>{ing.emoji}</span>
      <span className={`font-bold ${picked ? "text-primary" : "text-foreground"} ${size === "sm" ? "text-[10px]" : "text-xs"}`}>{ing.name}</span>
    </button>
  );
}
