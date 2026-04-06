import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '@/data/defaultIngredients';
import ingredientSchema from '@/data/ingredients.schema.json';
import { useOrder } from '@/hooks/useOrder';
import { Ingredient, UNIT_FULL_LABELS, UnitOfMeasurement } from '@/types/ingredient';
import { ArrowLeft, Copy, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const UNIT_OPTIONS = Object.keys(UNIT_FULL_LABELS) as UnitOfMeasurement[];

function formatSchema(ingredients: Ingredient[]) {
  return JSON.stringify(ingredients, null, 2);
}

const IngredientsStudio = () => {
  const navigate = useNavigate();
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    resetIngredients,
  } = useOrder();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewMode, setPreviewMode] = useState<'data' | 'schema'>('data');

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      const matchesCategory = categoryFilter === 'all' || ingredient.category === categoryFilter;
      const matchesQuery =
        query.length === 0 ||
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.id.toLowerCase().includes(query) ||
        ingredient.emoji.includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [ingredients, search, categoryFilter]);

  const dataPreview = useMemo(() => formatSchema(ingredients), [ingredients]);
  const schemaPreview = useMemo(() => JSON.stringify(ingredientSchema, null, 2), []);

  const handleCopyPreview = async () => {
    const payload = previewMode === 'data' ? dataPreview : schemaPreview;
    await navigator.clipboard.writeText(payload);
    toast.success(previewMode === 'data' ? 'Đã sao chép ingredients.json' : 'Đã sao chép ingredients.schema.json');
  };

  const handleAddIngredient = () => {
    const category = categories.find((item) => item.id === categoryFilter) ?? categories[0];
    addIngredient({
      name: 'Nguyên liệu mới',
      emoji: category.emoji,
      unit: 'kg',
      category: category.id,
      subcategory: category.subcategories?.[0]?.id,
      referencePrice: undefined,
      quickQuantities: [1, 2],
    });
  };

  const handleReset = () => {
    if (!window.confirm('Reset toàn bộ danh sách nguyên liệu về mặc định?')) return;
    resetIngredients();
    toast.success('Đã khôi phục danh sách mặc định');
  };

  const handleCategoryChange = (ingredient: Ingredient, nextCategory: string) => {
    const category = categories.find((item) => item.id === nextCategory);
    updateIngredient(ingredient.id, {
      category: nextCategory,
      subcategory: category?.subcategories?.[0]?.id,
      emoji: ingredient.emoji || category?.emoji || '📦',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-4 lg:px-6">
        <header className="sticky top-0 z-30 rounded-b-3xl border-b border-border bg-background/90 pb-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate('/')}
                className="mt-1 rounded-2xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Ingredients Studio
                </p>
                <h1 className="text-2xl font-black text-foreground">Bulk edit everything in one place</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Every field updates the shared ingredient catalog immediately, and the export panel mirrors the reusable files for other apps.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddIngredient}
                className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus size={16} />
                Add row
              </button>
              <button
                onClick={handleCopyPreview}
                className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                <Copy size={16} />
                Copy {previewMode === 'data' ? 'data' : 'schema'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition hover:bg-destructive/15"
              >
                <RefreshCcw size={16} />
                Reset defaults
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_220px_180px]">
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or id..."
                className="w-full bg-transparent font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>

            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
              {filteredIngredients.length} / {ingredients.length} rows
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
          <section className="space-y-3">
            {filteredIngredients.map((ingredient) => {
              const category = categories.find((item) => item.id === ingredient.category);
              const subcategories = category?.subcategories ?? [];

              return (
                <article
                  key={ingredient.id}
                  className="rounded-3xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="grid gap-3 md:grid-cols-[88px_minmax(0,1.3fr)_120px_140px_140px_1fr_auto]">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Emoji
                      <input
                        value={ingredient.emoji}
                        onChange={(event) => updateIngredient(ingredient.id, { emoji: event.target.value })}
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-center text-xl font-semibold text-foreground outline-none focus:border-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-muted-foreground">
                      Name
                      <input
                        value={ingredient.name}
                        onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value })}
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-muted-foreground">
                      Unit
                      <select
                        value={ingredient.unit}
                        onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value as UnitOfMeasurement })}
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {UNIT_FULL_LABELS[unit]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-muted-foreground">
                      Price
                      <input
                        type="number"
                        step="0.1"
                        value={ingredient.referencePrice ?? ''}
                        onChange={(event) => updateIngredient(ingredient.id, {
                          referencePrice: event.target.value === '' ? undefined : Number(event.target.value),
                        })}
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-muted-foreground">
                      Category
                      <select
                        value={ingredient.category}
                        onChange={(event) => handleCategoryChange(ingredient, event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                      >
                        {categories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Subcategory
                        <select
                          value={ingredient.subcategory ?? ''}
                          onChange={(event) => updateIngredient(ingredient.id, {
                            subcategory: event.target.value || undefined,
                          })}
                          disabled={subcategories.length === 0}
                          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">None</option>
                          {subcategories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-muted-foreground">
                        Quick 1
                        <input
                          type="number"
                          step="0.1"
                          value={ingredient.quickQuantities[0] ?? ''}
                          onChange={(event) => updateIngredient(ingredient.id, {
                            quickQuantities: [
                              event.target.value === '' ? 0 : Number(event.target.value),
                              ingredient.quickQuantities[1] ?? 0,
                            ],
                          })}
                          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                        />
                      </label>

                      <label className="text-xs font-semibold text-muted-foreground">
                        Quick 2
                        <input
                          type="number"
                          step="0.1"
                          value={ingredient.quickQuantities[1] ?? ''}
                          onChange={(event) => updateIngredient(ingredient.id, {
                            quickQuantities: [
                              ingredient.quickQuantities[0] ?? 0,
                              event.target.value === '' ? 0 : Number(event.target.value),
                            ],
                          })}
                          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                        />
                      </label>

                      <label className="text-xs font-semibold text-muted-foreground">
                        Frequency
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={ingredient.orderFrequencyDays ?? ''}
                          onChange={(event) => updateIngredient(ingredient.id, {
                            orderFrequencyDays: event.target.value === '' ? undefined : Number(event.target.value),
                          })}
                          className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => deleteIngredient(ingredient.id)}
                      className="self-end rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-destructive transition hover:bg-destructive/15"
                      title={`Delete ${ingredient.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="rounded-full bg-background px-2.5 py-1">id: {ingredient.id}</span>
                    <span className="rounded-full bg-background px-2.5 py-1">
                      freq: {ingredient.orderFrequencyDays ?? 'n/a'}
                    </span>
                    <span className="rounded-full bg-background px-2.5 py-1">
                      quick: {(ingredient.quickQuantities[0] ?? 0)} / {(ingredient.quickQuantities[1] ?? 0)}
                    </span>
                  </div>
                </article>
              );
            })}

            {filteredIngredients.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm font-semibold text-muted-foreground">
                No ingredient matches this filter yet.
              </div>
            )}
          </section>

          <aside className="xl:sticky xl:top-28 xl:h-[calc(100vh-8rem)]">
            <div className="flex h-full flex-col rounded-[2rem] border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Live schema</p>
                  <h2 className="text-lg font-black text-foreground">
                    {previewMode === 'data' ? 'Reusable ingredients.json' : 'Reusable ingredients.schema.json'}
                  </h2>
                </div>
                <button
                  onClick={handleCopyPreview}
                  className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted"
                >
                  Copy
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setPreviewMode('data')}
                  className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                    previewMode === 'data'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  ingredients.json
                </button>
                <button
                  onClick={() => setPreviewMode('schema')}
                  className={`rounded-2xl px-3 py-2 text-xs font-bold transition ${
                    previewMode === 'schema'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  schema
                </button>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {previewMode === 'data'
                  ? 'This mirrors the shared ingredient catalog, so the ordering screen and reusable data file stay aligned.'
                  : 'This is the portable JSON Schema another app can validate against before importing ingredient data.'}
              </p>

              <textarea
                readOnly
                value={previewMode === 'data' ? dataPreview : schemaPreview}
                className="mt-4 min-h-[420px] flex-1 rounded-3xl border border-border bg-background px-4 py-4 font-mono text-[11px] leading-5 text-foreground outline-none"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default IngredientsStudio;
