import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Video, Calendar, Copy, Check, Clock, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Meeting } from '../types';

// Mock data for initial UI dev
const MOCK_MEETINGS: Meeting[] = [
  { id: '1', roomId: 'standup-daily', title: 'Daily Standup', createdAt: new Date().toISOString(), createdBy: '1', status: 'active' },
  { id: '2', roomId: 'design-sync-123', title: 'Design Sync', createdAt: new Date(Date.now() - 86400000).toISOString(), createdBy: '1', status: 'ended' },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newMeetingInfo, setNewMeetingInfo] = useState<{roomId: string, title: string} | null>(null);

  // Avatar state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('user_avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver'
  ];

  const handleSelectAvatar = (url: string) => {
    setAvatar(url);
    localStorage.setItem('user_avatar', url);
    setShowAvatarModal(false);
  };

  const handleCreateMeeting = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);
    const newMeeting: Meeting = {
      id: Math.random().toString(),
      roomId: newRoomId,
      title: 'Instant Meeting',
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
      status: 'active'
    };
    
    setMeetings([newMeeting, ...meetings]);
    setNewMeetingInfo({ roomId: newRoomId, title: newMeeting.title });
    setShowModal(true);
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/meeting/${joinRoomId.trim()}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${text}`);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowAvatarModal(true)}
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-colors shadow-2xl shrink-0 bg-surface-light relative group"
          >
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white">Edit</span>
            </div>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-slate-400 text-sm">Manage your meetings and connect with your team.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/[0.05] rounded-full px-5 py-2.5 backdrop-blur-md">
          <div className="text-sm font-medium text-slate-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Zap className="w-5 h-5 text-accent mr-2" />
              Quick Actions
            </h2>
            
            <button
              onClick={handleCreateMeeting}
              className="w-full mb-6 py-4 px-4 bg-white hover:bg-slate-200 rounded-xl text-black font-semibold flex items-center justify-center space-x-2 group transition-all"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Meeting</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-surface-light/30 text-sm text-slate-500">or</span>
              </div>
            </div>

            <form onSubmit={handleJoinMeeting} className="mt-6">
              <label htmlFor="join-id" className="block text-sm font-medium text-slate-400 mb-2">
                Join with a code or link
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Video className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="join-id"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="block w-full pl-10 bg-white/5 border border-white/10 rounded-lg py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter meeting ID"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!joinRoomId.trim()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Recent Meetings */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card overflow-hidden flex flex-col h-full"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-light/50">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Clock className="w-5 h-5 text-primary-light mr-2" />
                Recent Meetings
              </h2>
            </div>
            
            <div className="p-0 flex-grow">
              {meetings.length > 0 ? (
                <ul className="divide-y divide-white/10">
                  {meetings.map((meeting) => (
                    <li key={meeting.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl ${meeting.status === 'active' ? 'bg-primary/20 text-primary-light border border-primary/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium">{meeting.title}</h3>
                            {meeting.status === 'active' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-1 flex items-center">
                            ID: <span className="font-mono ml-1">{meeting.roomId}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(meeting.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 self-start sm:self-center ml-14 sm:ml-0">
                        <button
                          onClick={() => copyToClipboard(meeting.roomId)}
                          className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors tooltip"
                          title="Copy Link"
                        >
                          {copiedId === meeting.roomId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            meeting.status === 'active' 
                              ? 'bg-primary/20 text-primary-light hover:bg-primary/30 border border-primary/30' 
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {meeting.status === 'active' ? 'Join Now' : 'Rejoin'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                  <Video className="w-12 h-12 mb-4 opacity-20" />
                  <p>No recent meetings</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* New Meeting Modal */}
      {showModal && newMeetingInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-light/80">
              <h3 className="text-xl font-semibold text-white">Meeting Ready</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-slate-300 text-sm">Your meeting room has been created. Share this link with others they want to join.</p>
              
              <div className="bg-surface-lighter rounded-xl p-4 border border-white/5">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Meeting Link</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/meeting/${newMeetingInfo.roomId}`}
                    className="flex-grow bg-surface border border-white/10 rounded-lg py-2 px-3 text-white text-sm font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(newMeetingInfo.roomId)}
                    className="p-2.5 bg-primary/20 text-primary-light hover:bg-primary/30 rounded-lg transition-colors shrink-0"
                  >
                    {copiedId === newMeetingInfo.roomId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => navigate(`/meeting/${newMeetingInfo.roomId}`)}
                className="w-full py-3 bg-gradient-primary text-white rounded-xl font-medium flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Join Meeting Now</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAvatarModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-semibold text-white tracking-tight">Choose Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {AVATARS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectAvatar(url)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === url ? 'border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent hover:border-white/30 hover:scale-105 bg-white/5'
                    }`}
                  >
                    <img src={url} alt={`Avatar option ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Zap icon was missing
function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export default DashboardPage;
