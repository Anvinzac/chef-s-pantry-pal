import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChefHat, LogIn, Eye } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-primary rounded-2xl p-3">
            <ChefHat size={32} className="text-primary-foreground" />
          </div>
          <h1 className="font-extrabold text-2xl text-foreground">Đặt Hàng Bếp</h1>
          <p className="text-sm text-muted-foreground font-semibold">Đăng nhập để tiếp tục</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="email@kitchen.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-destructive text-xs font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <LogIn size={16} />
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground font-semibold">hoặc</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
        >
          <Eye size={16} />
          Dùng thử không cần đăng nhập
        </button>
      </div>
    </div>
  );
};

export default Login;
