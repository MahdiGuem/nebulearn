export function QuizDashboard() {
  const quizResults = {
    score: 87,
    totalQuestions: 20,
    correctAnswers: 17,
    timeSpent: '12:34',
    accuracy: 85,
    streak: 5,
  };

  const categoryResults = [
    { name: 'Astrophysics', score: 92, color: 'from-purple-500 to-indigo-500' },
    { name: 'Planetary Science', score: 88, color: 'from-indigo-500 to-blue-500' },
    { name: 'Cosmology', score: 81, color: 'from-blue-500 to-cyan-500' },
    { name: 'Space Exploration', score: 86, color: 'from-cyan-500 to-teal-500' },
  ];

  const achievements = [
    { label: 'Perfect Week', earned: true },
    { label: 'Rising Star', earned: true },
    { label: 'Quick Learner', earned: false },
  ];

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-[16px] bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-400/30 shadow-3d">
          <span className="text-purple-300 text-2xl">🏆</span>
        </div>
        <div>
          <h1 className="text-purple-100 text-3xl tracking-wide glow-text">Quiz Results</h1>
          <p className="text-purple-300/70 text-sm mt-1">Cosmic Exploration Series</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphic-card rounded-[24px] p-6 border border-purple-500/30 shadow-3d">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[12px] bg-purple-500/20 border border-purple-400/20">
              <span className="text-purple-300">🎯</span>
            </div>
            <h3 className="text-purple-200 text-sm">Overall Score</h3>
          </div>
          <div className="text-5xl glow-text mb-2">{quizResults.score}%</div>
          <p className="text-purple-300/60 text-sm">
            {quizResults.correctAnswers}/{quizResults.totalQuestions} correct
          </p>
        </div>

        <div className="glassmorphic-card rounded-[24px] p-6 border border-purple-500/30 shadow-3d">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[12px] bg-indigo-500/20 border border-indigo-400/20">
              <span className="text-indigo-300">⏱</span>
            </div>
            <h3 className="text-purple-200 text-sm">Time Spent</h3>
          </div>
          <div className="text-5xl glow-text mb-2">{quizResults.timeSpent}</div>
          <p className="text-purple-300/60 text-sm">Average: 38s per question</p>
        </div>

        <div className="glassmorphic-card rounded-[24px] p-6 border border-purple-500/30 shadow-3d">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[12px] bg-cyan-500/20 border border-cyan-400/20">
              <span className="text-cyan-300">📈</span>
            </div>
            <h3 className="text-purple-200 text-sm">Accuracy</h3>
          </div>
          <div className="text-5xl glow-text mb-2">{quizResults.accuracy}%</div>
          <p className="text-purple-300/60 text-sm">{quizResults.streak} question streak</p>
        </div>
      </div>

      <div className="glassmorphic-card rounded-[24px] p-6 border border-purple-500/30 shadow-3d">
        <h3 className="text-purple-100 mb-6 tracking-wide">Category Breakdown</h3>
        <div className="space-y-4">
          {categoryResults.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-purple-200/90 text-sm">{category.name}</span>
                <span className="text-purple-300/70 text-sm">{category.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-purple-950/50 overflow-hidden backdrop-blur-sm border border-purple-500/20">
                <div
                  className={`h-full bg-gradient-to-r ${category.color} rounded-full progress-glow transition-all duration-1000`}
                  style={{ width: `${category.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glassmorphic-card rounded-[24px] p-6 border border-purple-500/30 shadow-3d">
        <h3 className="text-purple-100 mb-6 tracking-wide">Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.label}
              className={`relative rounded-[16px] p-4 border transition-all duration-300 ${
                achievement.earned
                  ? 'bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border-purple-400/30 shadow-3d'
                  : 'bg-purple-950/20 border-purple-500/10 opacity-50'
              }`}
            >
              {achievement.earned && (
                <div className="absolute inset-0 rounded-[16px] achievement-glow"></div>
              )}
              <div className="relative flex flex-col items-center gap-3">
                <div
                  className={`p-3 rounded-full ${
                    achievement.earned
                      ? 'bg-purple-500/30 border border-purple-400/40'
                      : 'bg-purple-950/30 border border-purple-500/20'
                  }`}
                >
                  <span className={`text-2xl ${achievement.earned ? 'text-purple-200' : 'text-purple-400/50'}`}>
                    ⭐
                  </span>
                </div>
                <span
                  className={`text-sm text-center ${
                    achievement.earned ? 'text-purple-200' : 'text-purple-300/50'
                  }`}
                >
                  {achievement.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
