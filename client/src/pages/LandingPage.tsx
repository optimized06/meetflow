import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-full mb-8">
          <Video className="w-12 h-12 text-primary-light" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Next-Gen <span className="text-white">Video Conferencing</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Experience ultra-low latency, crystal clear video calls with seamless screen sharing and real-time chat.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 transition-all duration-300"
          >
            Get Started Free
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-4 glass rounded-xl font-semibold text-white hover:bg-surface-lighter transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
