const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-soft-pink via-cream to-peach">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-5xl opacity-20 animate-float">📚</div>
        <div className="absolute top-32 right-16 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🌸</div>
        <div className="absolute bottom-32 left-1/4 text-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>📖</div>
        <div className="absolute bottom-20 right-1/4 text-4xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>✨</div>
      </div>

      {/* Logo with animation */}
      <div className="relative animate-bounce-soft">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center shadow-float">
          <span className="text-5xl">🐝</span>
        </div>
      </div>

      {/* App name */}
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground font-nunito">
        Bookie<span className="text-warm-pink"> Bee</span>
      </h1>
      
      {/* Tagline */}
      <p className="mt-2 text-sm text-muted-foreground font-nunito">
        Đọc sách thông minh 🍯
      </p>

      {/* Loading indicator */}
      <div className="mt-8 flex space-x-2">
        <div className="h-2.5 w-2.5 rounded-full bg-warm-pink animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2.5 w-2.5 rounded-full bg-sage animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2.5 w-2.5 rounded-full bg-peach animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default SplashScreen;