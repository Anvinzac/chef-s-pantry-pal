import { Ingredient, UNIT_LABELS } from "@/types/ingredient";
import { cn } from "@/lib/utils";
import { Settings2, X, AlertTriangle } from "lucide-react";
import { getPriceK, formatPriceK } from "@/data/referencePrices";
import { ReorderAlert } from "@/hooks/useReorderAlerts";
import { useEffect, useRef, useState } from "react";

interface IngredientCardProps {
  ingredient: Ingredient;
  isInOrder: boolean;
  orderQuantity?: number;
  onQuickAdd: (quantity: number) => void;
  onCustomQuantity: () => void;
  onEdit: () => void;
  onClear: () => void;
  reorderAlert?: ReorderAlert;
  isOutOfStock?: boolean;
  onReportOutOfStock?: () => void;
  reportMode?: boolean;
  remainingQuantity?: number | null;
  onReportRemaining?: () => void;
}

export function IngredientCard({
  ingredient,
  isInOrder,
  orderQuantity,
  onQuickAdd,
  onCustomQuantity,
  onEdit,
  onClear,
  reorderAlert,
  isOutOfStock,
  onReportOutOfStock,
  reportMode,
  remainingQuantity,
  onReportRemaining,
}: IngredientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const viewportHeight = window.innerHeight;
            const middle = viewportHeight / 2;
            const elementMiddle = rect.top + rect.height / 2;
            
            // Expand if element is near the middle of the viewport (within 25% range)
            const distanceFromMiddle = Math.abs(elementMiddle - middle);
            const threshold = viewportHeight * 0.25;
            
            setIsExpanded(distanceFromMiddle < threshold);
          } else {
            setIsExpanded(false);
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -10% 0px"
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);
  const unit = UNIT_LABELS[ingredient.unit];
  const priceK = getPriceK(ingredient.id);

  const handleQuickAdd = (qty: number) => {
    onQuickAdd(Math.round(((orderQuantity || 0) + qty) * 1000) / 1000);
  };

  const isAlerted = false;

  // Report-only mode for kitchen members
  if (reportMode) {
    return (
      <div
        ref={cardRef}
        className={cn(
          "relative rounded-xl flex flex-col transition-all duration-300 border-2 cursor-pointer",
          isExpanded ? "p-3 gap-2" : "p-2 gap-1",
          isOutOfStock
            ? "border-destructive bg-destructive/10"
            : remainingQuantity != null
              ? "border-primary/50 bg-primary/5"
              : "border-transparent bg-card shadow-sm",
        )}
        onClick={() => onReportRemaining?.()}
      >
        {/* Compact mode: just name */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{ingredient.emoji}</span>
            <span className="text-sm font-bold text-card-foreground leading-tight flex-1 truncate">
              {ingredient.name}
            </span>
          </div>
        )}

        {/* Expanded mode: full details */}
        {isExpanded && (
          <>
            {/* Name row with remaining label */}
            <div className="flex items-center gap-1.5">
              <span className="text-xl leading-none">{ingredient.emoji}</span>
              <span className="text-[16px] font-bold text-card-foreground leading-tight flex-1">
                {ingredient.name}
              </span>
              {remainingQuantity != null ? (
                <span className="text-[14px] font-extrabold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
                  còn {remainingQuantity}
                  {unit}
                </span>
              ) : (
                <span className="text-[14px] text-muted-foreground/50 italic shrink-0">còn ...</span>
              )}
            </div>

            {/* Report buttons */}
            {isOutOfStock ? (
              <div className="flex items-center gap-1.5 bg-destructive/15 text-destructive rounded-lg px-2.5 py-2.5 justify-center">
                <AlertTriangle size={14} />
                <span className="text-xs font-extrabold">Đã báo hết hàng</span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReportOutOfStock?.();
                }}
                className="flex items-center gap-1.5 bg-muted hover:bg-destructive/15 hover:text-destructive text-muted-foreground rounded-lg px-2.5 py-2.5 justify-center transition-colors active:scale-95"
              >
                <AlertTriangle size={14} />
                <span className="text-xs font-bold">Báo hết hàng</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Chef mode (full ordering UI)
  const hasRemaining = remainingQuantity != null && !isInOrder;

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-xl flex flex-col transition-all duration-300 border-2 cursor-pointer",
        isExpanded ? "p-3 gap-2" : "p-2 gap-1",
        isInOrder
          ? "border-primary bg-card shadow-md shadow-primary/15"
          : "border-transparent bg-card shadow-sm",
      )}
      onClick={onCustomQuantity}
    >
      {/* Compact mode: just name */}
      {!isExpanded && (
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{ingredient.emoji}</span>
          <span className="text-sm font-bold text-card-foreground leading-tight flex-1 truncate">
            {ingredient.name}
          </span>
          {isInOrder && orderQuantity && (
            <span className="text-xs font-bold text-primary">
              {orderQuantity}{unit}
            </span>
          )}
        </div>
      )}

      {/* Expanded mode: full details */}
      {isExpanded && (
        <>
          {/* Top-left badge: order quantity (priority) or remaining quantity */}
          {isInOrder && orderQuantity ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -top-2 -left-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center shadow-md animate-pop-in gap-0.5 z-10 hover:bg-destructive transition-colors"
            >
              <span>
                {orderQuantity}
                {unit}
              </span>
              <X size={10} />
            </button>
          ) : hasRemaining ? (
            <span className="absolute -top-2 -left-1.5 bg-[hsl(160,60%,40%)] text-white text-[14px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center shadow-md z-10">
              {remainingQuantity}
              {unit}
            </span>
          ) : null}

          {/* Top row: alert/emoji + name + price + edit */}
          <div className="flex items-center gap-1.5">
            <span className="relative text-xl leading-none shrink-0 w-6 h-6 flex items-center justify-center">
              {ingredient.emoji}
            </span>
            <span className="text-[16px] font-bold text-card-foreground leading-tight flex-1">
              {ingredient.name}
            </span>
            {priceK !== undefined && (
              <span className="text-[14px] text-foreground font-semibold flex-shrink-0">{formatPriceK(priceK)}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <Settings2 size={12} />
            </button>
          </div>

          {/* Bottom row: quick buttons */}
          <div className="flex items-center gap-1.5">
            {ingredient.quickQuantities.map((qty, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAdd(qty);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 min-h-[36px]",
                  isAlerted
                    ? "bg-[hsl(var(--reorder-glow)/0.15)] text-[hsl(var(--reorder-glow))] hover:bg-[hsl(var(--reorder-glow)/0.25)]"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                {qty}
                {unit}
              </button>
            ))}
          </div>
          {isOutOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReportOutOfStock?.();
              }}
              className="flex items-center gap-1 bg-destructive/15 text-destructive rounded-lg px-2 py-1.5 hover:bg-destructive/25 transition-colors"
              title="Nhấn để xác nhận đã xem"
            >
              <AlertTriangle size={12} />
              <span className="text-[10px] font-extrabold">Hết hàng • Nhấn để xoá</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
