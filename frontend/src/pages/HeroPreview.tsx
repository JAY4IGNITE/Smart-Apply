import { useNavigate } from 'react-router-dom';
import CinematicHeroSection from '../components/cinematic-hero/CinematicHeroSection';
import { ArrowLeft } from 'lucide-react';

export default function HeroPreview() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-[#050308] text-[#F7F2FF]">
      {/* Back to Home button */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider text-[#EAD7FF] bg-[#30006B]/40 hover:bg-[#7621B0]/50 border border-[#9B00FF]/30 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(155,0,255,0.2)] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      {/* Standalone Full Cinematic Hero */}
      <CinematicHeroSection onExploreClick={() => navigate('/')} />
    </div>
  );
}
