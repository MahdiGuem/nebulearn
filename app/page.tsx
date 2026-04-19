import { SpaceLandingPage } from './components/SpaceLandingPage';

export default function App() {
  return (
    <div className=" size-full min-h-screen overflow-auto">
      <div className="absolute inset-0 bg-stars"></div>

      <div className="relative z-10">
        <SpaceLandingPage />
      </div>
    </div>
  );
}