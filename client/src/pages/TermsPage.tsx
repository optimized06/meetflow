import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, HelpCircle } from 'lucide-react';

const TermsPage: React.FC = () => {
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
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-slate-400 text-sm mt-1">Last Updated: September 2026</p>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base border border-white/10 mt-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">1.</span> Introduction & Acceptance of Terms
          </h2>
          <p>
            Welcome to MeetFlow (&quot;the Service&quot;). By accessing or using our video conferencing application, web client, or signaling services, you agree to be bound by these Terms &amp; Conditions. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">2.</span> Acceptable Use
          </h2>
          <p>
            You agree to use MeetFlow solely for lawful communication and collaboration purposes. You may not:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-400">
            <li>Transmit unlawful, harassing, defamatory, abusive, threatening, or harmful material.</li>
            <li>Interfere with or disrupt signaling servers, peer-to-peer WebRTC connections, or connected networks.</li>
            <li>Attempt unauthorized access to private meeting rooms, unauthorized host moderation actions, or other users&apos; accounts.</li>
            <li>Use the service to transmit automated spam, viruses, or malicious scripts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">3.</span> User Responsibilities &amp; Conduct
          </h2>
          <p>
            You are solely responsible for all activities conducted during your meetings and through your account credentials. You agree to maintain respectful conduct with all meeting participants and honor any rules established by room hosts or co-hosts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">4.</span> Meeting Content &amp; Media
          </h2>
          <p>
            MeetFlow transmits real-time audio, video, screen shares, and chat messages directly between participants. MeetFlow does not pre-screen or verify user-generated meeting content. You retain ownership of any media or intellectual property you share, and you represent that you have all necessary rights to broadcast such material.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">5.</span> Account Responsibility &amp; Security
          </h2>
          <p>
            If you create an account on MeetFlow, you are responsible for maintaining the confidentiality of your login credentials. You agree to immediately notify us of any unauthorized use of your account or room links.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">6.</span> Service Availability &amp; Quality
          </h2>
          <p>
            MeetFlow is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Because WebRTC connections depend on individual internet service providers, local network firewalls, and hardware capabilities, we do not warrant uninterrupted, error-free, or zero-latency performance. We reserve the right to modify, suspend, or discontinue any feature with reasonable notice where feasible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">7.</span> Limitations of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, MeetFlow and its operators shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or related to your use of or inability to use the service, including loss of data, loss of business opportunities, or interruptions in communication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-primary-light">8.</span> Changes to the Service &amp; Terms
          </h2>
          <p>
            We may revise these Terms &amp; Conditions from time to time. Any updates will be reflected on this page with an updated &quot;Last Updated&quot; date. Continued use of the platform after changes become effective constitutes your acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-light" /> Contact Information
          </h2>
          <p>
            For questions or inquiries regarding these Terms &amp; Conditions, please contact us at:
          </p>
          <p className="font-mono text-white/80 bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
            support@meetflow.app
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
