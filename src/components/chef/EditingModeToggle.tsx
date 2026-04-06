import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { LayoutList, Settings2, X } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

export function EditingModeToggle() {
  const navigate = useNavigate();
  const { editingEnabled, toggleEditing } = useAppSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none">
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="pointer-events-auto w-64 rounded-3xl border border-border bg-card/95 p-4 text-xs text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Settings
                </p>
                <p className="text-sm font-bold text-foreground">Temporary editing</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close settings"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Edit ingredients & menu</p>
                <p className="text-[11px] text-muted-foreground">Tap any item to update or delete it.</p>
              </div>
              <Switch checked={editingEnabled} onCheckedChange={toggleEditing} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Turn off this mode when the data is finalized. The toggle is stored locally for this browser.
            </p>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/ingredients-studio');
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground transition hover:bg-secondary/85"
            >
              <LayoutList size={16} />
              Open bulk editor
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.97]"
          aria-label="Open temporary editing settings"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </div>
  );
}
