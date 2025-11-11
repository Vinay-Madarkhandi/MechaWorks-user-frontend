export const Hero = () => {
  return (
    <div className="relative min-h-[40vh] sm:min-h-[50vh] bg-black pt-24 sm:pt-32 pb-16 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-black to-purple-950 opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(0,0,0,0))]"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-x">
                Welcome to MechaWorks
              </span>
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-violet-500 to-violet-500"></div>
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></div>
              <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-violet-500 to-violet-500"></div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-violet-200/80 max-w-2xl mx-auto leading-relaxed px-4">
            Your{" "}
            <span className="text-violet-400 font-semibold">decentralized</span>{" "}
            destination for{" "}
            <span className="text-purple-400 font-semibold">data labeling</span>
            <br className="hidden sm:block" />
            powered by blockchain technology
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            {[
              { icon: "⚡", text: "Fast & Secure" },
              { icon: "🔗", text: "Blockchain Powered" },
              { icon: "🎯", text: "Accurate Results" },
            ].map((badge, index) => (
              <div
                key={index}
                className="group flex items-center space-x-2 bg-violet-950/30 border border-violet-500/20 rounded-full px-4 py-2 backdrop-blur-sm hover:bg-violet-900/30 hover:border-violet-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {badge.icon}
                </span>
                <span className="text-xs sm:text-sm text-violet-300 font-medium">
                  {badge.text}
                </span>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="pt-8 sm:pt-12 animate-bounce">
            <div className="inline-flex flex-col items-center space-y-2">
              <span className="text-xs text-violet-400/60 uppercase tracking-wider">
                Get Started
              </span>
              <svg
                className="w-5 h-5 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
