import { SpaceLandingPage } from './components/SpaceLandingPage';

export default function App() {
  return (
    <div className="size-full min-h-screen bg-black overflow-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950/50 to-black"></div>

      <div className="relative z-10">
        <SpaceLandingPage />
      </div>
    </div>
  );
}