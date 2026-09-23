import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Database, Camera, Lock, Eye, HelpCircle } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mt-1">Last Updated: September 2026</p>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base border border-white/10 mt-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-light" /> 1. Overview
          </h2>
          <p>
            MeetFlow values your privacy. This Privacy Policy details what information our application collects, how it is used, and how it is protected. We collect only what is necessary to deliver fast, secure real-time video communication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-light" /> 2. Information We Collect
          </h2>
          <p>
            Depending on how you use MeetFlow, we collect the following limited categories of information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Account Credentials:</strong> When you register or sign in, we process your display name, email address, and authentication credentials (managed via Supabase Auth or mock local authentication).
            </li>
            <li>
              <strong className="text-slate-200">User Profile:</strong> Optional avatar selections stored in your local browser preferences.
            </li>
            <li>
              <strong className="text-slate-200">Meeting Metadata:</strong> Room identifiers, participant names, and meeting timestamps used solely to connect and coordinate active sessions.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-light" /> 3. Video, Audio &amp; Device Permissions
          </h2>
          <p>
            MeetFlow requests explicit browser permission to access your camera and microphone via standard browser media APIs (`getUserMedia`).
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>We do not access or stream your camera or microphone without your explicit browser consent.</li>
            <li>Video and audio streams are exchanged directly peer-to-peer using standard WebRTC encryption protocols (DTLS-SRTP).</li>
            <li>MeetFlow does not record, archive, or retain your raw audio or video streams on our servers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-light" /> 4. In-Call Chat &amp; Signaling Data
          </h2>
          <p>
            Signaling data (WebRTC session descriptions, ICE connection candidates, hand-raise indicators, and in-call chat messages) is processed in temporary volatile memory on our signaling server to route messages between active participants.
          </p>
          <p className="text-slate-400">
            Active room state and chat history are discarded once a meeting room closes and all participants have disconnected. Permanent cloud logging of chat text is not enabled by default.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">5.</span> Local Storage &amp; Cookies
          </h2>
          <p>
            We use your browser&apos;s local storage (`localStorage`) strictly for functional application state, such as remembering your authentication session, chosen display name, and avatar preference. We do not use third-party tracking or advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">6.</span> Third-Party Service Providers
          </h2>
          <p>
            Where enabled, authentication and database persistence may be facilitated through Supabase. Signaling is operated through our dedicated WebSocket servers. We do not sell or rent your personal data to data brokers or advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">7.</span> Data Retention &amp; User Control
          </h2>
          <p>
            You can sign out of your session at any time through your Profile menu. You may also clear your browser&apos;s local storage to remove any stored local session preferences.
          </p>
        </section>

        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-light" /> 8. Privacy Inquiries
          </h2>
          <p>
            If you have questions about how your information is handled within MeetFlow, please contact:
          </p>
          <p className="font-mono text-white/80 bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
            privacy@meetflow.app
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
