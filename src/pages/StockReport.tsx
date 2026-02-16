import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { useStockReports, StockReport } from '@/hooks/useStockReports';
import { categories } from '@/data/defaultIngredients';
import { UNIT_LABELS, UnitOfMeasurement } from '@/types/ingredient';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Vừa báo';
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function groupByCategory(reports: StockReport[]): Record<string, StockReport[]> {
  const groups: Record<string, StockReport[]> = {};
  for (const r of reports) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  return groups;
}

const StockReportPage = () => {
  const navigate = useNavigate();
  const { reports, loading, resolveReport } = useStockReports();
  const grouped = groupByCategory(reports);
  const categoryKeys = Object.keys(grouped);

  const handleNavigateToItem = (report: StockReport) => {
    // Navigate to ordering page with category and subcategory pre-selected
    const params = new URLSearchParams({ category: report.category });
    if (report.subcategory) params.set('subcategory', report.subcategory);
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-base text-foreground leading-tight flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              Hết Hàng
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold">
              {reports.length} mặt hàng cần nhập thêm
            </p>
          </div>
        </div>
      </header>

      <div className="px-3 py-3 pb-8 space-y-3">
        {loading && (
          <div className="text-center py-12 text-muted-foreground text-sm font-semibold">Đang tải...</div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl">✅</span>
            <p className="text-muted-foreground text-sm font-bold mt-3">Không có mặt hàng hết hàng</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Tất cả đều đầy đủ!</p>
          </div>
        )}

        {categoryKeys.map(catKey => {
          const cat = categories.find(c => c.id === catKey);
          const items = grouped[catKey];

          return (
            <div key={catKey} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                <span className="text-xs font-bold text-foreground">
                  {cat?.emoji ?? '📦'} {cat?.name ?? catKey}
                </span>
                <span className="text-[10px] font-semibold text-destructive">
                  {items.length} hết hàng
                </span>
              </div>

              <div className="divide-y divide-border">
                {items.map(report => (
                  <div key={report.id} className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      onClick={() => handleNavigateToItem(report)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span className="text-lg">{report.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {report.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatTimeAgo(report.reported_at)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => resolveReport(report.ingredient_id)}
                      className="p-1.5 rounded-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:opacity-80 transition-opacity flex-shrink-0"
                      title="Đã nhập hàng"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockReportPage;
