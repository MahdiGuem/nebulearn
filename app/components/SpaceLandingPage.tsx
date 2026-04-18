export function SpaceLandingPage() {
  const features = [
    { title: 'Infinite Scale', description: 'Expand beyond limits' },
    { title: 'Zero Gravity Deploy', description: 'Weightless infrastructure' },
    { title: 'Light Speed', description: 'Performance at the edge' },
    { title: 'Quantum Security', description: 'Unbreakable protection' },
  ];

  const stars = [...Array(30)].map((_, i) => ({
    id: i,
    left: `${(i * 37 + 23) % 100}%`,
    top: `${(i * 53 + 17) % 100}%`,
  }));

  return (
    <div className="w-full relative">
      {/* Minimal Star Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-px h-px bg-white/40 rounded-full"
            style={{
              left: star.left,
              top: star.top,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="shiny-text text-8xl md:text-9xl tracking-tighter leading-none mb-12">
            STELLARIS
          </h1>

          <div className="space-y-8 mb-16">
            <div className="h-px w-24 bg-white/30 mx-auto"></div>
            <p className="text-white/50 text-xl md:text-2xl tracking-wide max-w-2xl mx-auto">
              Navigate the cosmos of possibilities
            </p>
            <div className="h-px w-24 bg-white/30 mx-auto"></div>
          </div>

          <button className="group relative inline-flex items-center gap-3">
            <span className="text-white text-sm tracking-widest uppercase">Explore</span>
            <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
            <div className="absolute -bottom-2 left-0 right-0 h-px bg-white/50"></div>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-40 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-32">
            {features.map((feature, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute left-0 top-1 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="absolute left-[2.5px] top-2 w-px h-full bg-white/10"></div>

                <h3 className="shiny-text text-4xl md:text-5xl tracking-tight mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/40 text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-40 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative py-16 border-y border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
              {[
                { value: '∞', label: 'Possibilities' },
                { value: '99.9%', label: 'Uptime' },
                { value: '<10ms', label: 'Latency' },
                { value: '24/7', label: 'Available' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="shiny-text text-5xl mb-3">{stat.value}</div>
                  <div className="text-white/30 text-sm tracking-widest uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-40 px-8">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="shiny-text text-6xl md:text-7xl tracking-tight">
            Ready to ascend?
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full sm:w-80 px-6 py-3 bg-transparent border-b border-white/20 focus:border-white text-white placeholder:text-white/30 outline-none transition-colors"
            />
            <button className="group relative inline-flex items-center gap-3 pb-1">
              <span className="text-white text-sm tracking-widest uppercase">Launch</span>
              <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-white/50"></div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-white/30 text-xs tracking-wider">
            <span>No commitment</span>
            <span>•</span>
            <span>Free forever</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="shiny-text text-xl tracking-tight">STELLARIS</div>

            <div className="flex items-center gap-12 text-white/40 text-sm tracking-wider uppercase">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="text-white/20 text-xs tracking-wider">
              © 2026
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
