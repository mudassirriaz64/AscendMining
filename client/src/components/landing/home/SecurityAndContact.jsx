import { useState } from 'react';
import { m } from 'framer-motion';
import { ShieldCheck, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import SectionHeading from '../SectionHeading';
import GlowButton from '../GlowButton';
import { TextField, TextArea } from '../FormInputs';
import api from '../../../services/api';

const securityPoints = [
  { icon: ShieldCheck, accent: 'text-emerald', title: 'Cold Storage Wallets', desc: '98% of customer funds are securely retained offline in hardware-isolated cold assets.' },
  { icon: Clock, accent: 'text-gold', title: 'Strict Payout Auditing', desc: 'Hourly payouts run through strict double-signature server verification bounds.' },
];

const SecurityAndContact = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', contactForm);
      toast.success('Your message has been sent successfully!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key) => (e) => setContactForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Left: Security */}
        <m.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-8"
        >
          <SectionHeading
            as="h2"
            eyebrow="Enterprise Trust"
            title="Uncompromising Safety Standards"
            subtitle="We leverage multi-tier encryption, secure hardware security modules (HSMs), and routine third-party smart contract audits to guarantee platform longevity and capital safety."
            align="left"
          />
          <div className="space-y-4">
            {securityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="glass-card rounded-2xl p-5 flex items-start gap-4 hover:border-emerald/25 transition-colors">
                  <div className={`w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0 ${point.accent}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{point.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{point.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </m.div>

        {/* Right: Contact form */}
        <m.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass-card rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <h3 className="text-lg font-heading font-semibold text-white mb-6">Send Us A Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="home-name"
                label="Full Name"
                value={contactForm.name}
                onChange={updateField('name')}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
              <TextField
                id="home-email"
                label="Email Address"
                type="email"
                value={contactForm.email}
                onChange={updateField('email')}
                placeholder="you@email.com"
                required
                autoComplete="email"
              />
            </div>
            <TextField
              id="home-subject"
              label="Subject"
              value={contactForm.subject}
              onChange={updateField('subject')}
              placeholder="How can we help?"
              required
            />
            <TextArea
              id="home-message"
              label="Message"
              rows={4}
              value={contactForm.message}
              onChange={updateField('message')}
              placeholder="Type your message here..."
              required
            />
            <GlowButton type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Sending...' : (
                <>
                  <Send size={14} /> Send Inquiry
                </>
              )}
            </GlowButton>
          </form>
        </m.div>
      </div>
    </section>
  );
};

export default SecurityAndContact;
