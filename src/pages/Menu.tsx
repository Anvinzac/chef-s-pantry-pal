import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MenuPlanner } from '@/components/chef/MenuPlanner';

const Menu = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'max-w-md mx-auto' : 'w-full'}`}>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 font-bold">Thực đơn</div>
        </div>
      </header>
      <MenuPlanner />
    </div>
  );
};

export default Menu;
