import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  Monitor, 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Mic, 
  MicOff, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const handleCreateMeeting = () => {
    if (user) {
      const instantRoomId = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      navigate(`/meeting/${instantRoomId}`);
    } else {
      navigate('/register');
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/meeting/${joinCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs sm:text-sm font-medium text-slate-300 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Next-Gen WebRTC Peer Video Collaboration</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Seamless Video Meetings for <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">High-Performing Teams</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Crystal-clear HD video, ultra-low latency audio, real-time messaging, and comprehensive host moderation. Connect instantly without downloads.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-16">
            <button
              onClick={handleCreateMeeting}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
            >
              <Video className="w-5 h-5 text-black" />
              <span>Create Meeting</span>
            </button>

            <form onSubmit={handleJoinMeeting} className="w-full sm:w-auto flex items-center gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter meeting code"
                className="w-full sm:w-56 px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="px-5 py-3.5 glass hover:bg-white/10 rounded-xl font-medium text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              >
                Join
              </button>
            </form>
          </div>

          {/* Modern Visual Treatment: Interactive Mock UI Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-card max-w-4xl mx-auto overflow-hidden border border-white/[0.12] shadow-2xl p-2 sm:p-4 relative"
          >
            {/* Window bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 font-mono text-[11px] text-slate-400">meetflow.app/meeting/standup-daily</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE HD MESH
              </div>
            </div>

            {/* Simulated Video Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 aspect-[3/4] sm:aspect-[2.2/1]">
              <div className="rounded-xl bg-surface-lighter/80 border border-white/10 relative overflow-hidden flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[11px]">Alex (Host)</span>
                  <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Mic className="w-3 h-3" /></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-700 to-slate-500 border border-white/20 flex items-center justify-center text-xl font-bold">
                    A
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-left">Speaking...</div>
              </div>

              <div className="rounded-xl bg-surface-lighter/80 border border-white/10 relative overflow-hidden flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[11px]">Sarah (Co-host)</span>
                  <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Mic className="w-3 h-3" /></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-900 to-slate-700 border border-white/20 flex items-center justify-center text-xl font-bold">
                    S
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-left">Active Connection</div>
              </div>

              <div className="rounded-xl bg-surface-lighter/80 border border-white/10 relative overflow-hidden flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[11px]">You</span>
                  <div className="p-1 rounded-full bg-red-500/20 text-red-400"><MicOff className="w-3 h-3" /></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-900 to-slate-700 border border-white/20 flex items-center justify-center text-xl font-bold">
                    Y
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-left">Muted</div>
              </div>
            </div>

            {/* Simulated Control Bar */}
            <div className="mt-3 py-2 flex items-center justify-center gap-2 border-t border-white/5 bg-surface/40 rounded-xl">
              <span className="p-2 rounded-full bg-white/10 text-white"><Mic className="w-3.5 h-3.5" /></span>
              <span className="p-2 rounded-full bg-white/10 text-white"><Video className="w-3.5 h-3.5" /></span>
              <span className="p-2 rounded-full bg-white/10 text-white"><Monitor className="w-3.5 h-3.5" /></span>
              <span className="p-2 rounded-full bg-white/10 text-white"><MessageSquare className="w-3.5 h-3.5" /></span>
              <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-xs font-semibold">End Call</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="py-20 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">Engineered for Performance</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Everything You Need for Flawless Collaboration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">HD Video &amp; Audio</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Direct peer-to-peer WebRTC streaming with automatic resolution scaling and noise-resilient audio pipelines.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Screen Sharing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Share entire desktop displays, application windows, or browser tabs in real-time with host-level permission controls.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">In-Call Chat &amp; Files</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Integrated real-time text chat, file transfers, emoji reactions, and formatted system activity events.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure Meetings</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Protected by DTLS-SRTP end-to-end peer encryption, room locking, and granular access moderation.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Host &amp; Co-Host Controls</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Server-validated permissions: mute disruptive participants, promote co-hosts, lock rooms, and manage chat rights.
              </p>
            </div>

            <div className="glass-card p-6 sm:p-8 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5 text-white">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Adaptive Reconnection</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automated ICE restart and WebSocket fallback ensure stable reconnections during network drops or Wi-Fi handoffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 border-t border-white/10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">Simple 3-Step Flow</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Start Calling in Seconds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="glass-card p-8 text-center relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Create or Join a Meeting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Spin up an instant room with a single click or enter an existing meeting ID without complicated setups.
              </p>
            </div>

            <div className="glass-card p-8 text-center relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Share the Meeting Link</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Copy your unique room invite link and send it via Slack, email, or calendar invite to your colleagues.
              </p>
            </div>

            <div className="glass-card p-8 text-center relative flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Start Collaborating</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enjoy ultra-fast video, low latency audio, synchronized chat, and seamless screen sharing right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECURITY & RELIABILITY SECTION */}
      <section id="security" className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-8 sm:p-12 border border-white/10 relative overflow-hidden">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Security &amp; Reliability By Design</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Built for Confidential &amp; Uninterrupted Work
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                Communication privacy and call uptime are foundational. MeetFlow minimizes server footprint by executing media transmission peer-to-peer, backed by server-validated room permissions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>DTLS / SRTP Encryption:</strong> Direct peer connections are encrypted at the transport layer.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Meeting Lock:</strong> Hosts can lock rooms at any point to restrict any new entry.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Role Hierarchies:</strong> Host and co-host actions are strictly validated on the signaling backend.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Ephemeral State:</strong> In-memory room signaling is cleared as soon as calls finish.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ABOUT SECTION */}
      <section id="about" className="py-20 border-t border-white/10 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-3">About MeetFlow</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">Designed for Modern Distributed Teams</h3>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
            MeetFlow was built to eliminate the bloat, delayed sign-ins, and sluggish client apps common in modern video tools. Intended for agile software teams, design critiques, quick standups, remote classrooms, and private client meetings, MeetFlow offers instant accessibility right from the modern browser.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Downloads Needed</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Web Standards</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Low Latency Mesh</span>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-black/60 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Info */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg">
                <Video className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">MeetFlow</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ultra-fast video conferencing built on open web standards and robust host moderation.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security &amp; Reliability</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About MeetFlow</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <p className="text-xs text-slate-400 mb-2">Have questions or feedback? Reach our engineering team:</p>
            <p className="text-sm font-mono text-white/90">support@meetflow.app</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} MeetFlow. All rights reserved.</p>
          <p>Built with WebRTC, React, and Socket.IO.</p>
        </div>
      </footer>
    </div>
  );
}
