import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHero from '../../components/landing/PageHero';
import GlowButton from '../../components/landing/GlowButton';
import { TextField, TextArea } from '../../components/landing/FormInputs';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', formData);
      toast.success('Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const contactDetails = [
    { icon: Mail, label: 'Email Inquiry', value: 'support@ascendhash.com' },
    { icon: Phone, label: 'Call Support', value: '+1 (800) 555-MINING' },
    { icon: MapPin, label: 'HQ Address', value: 'Suite 450, Crypto Tower Block A, George Town, Cayman Islands' },
  ];

  return (
    <div className="relative py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PageHero
          eyebrow="Get In Touch"
          title="Contact Us"
          subtitle="Have questions about customized hash rate deployments, corporate accounts, or payment options? Contact our support staff."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start max-w-5xl mx-auto">
          {/* Details Column */}
          <div className="relative overflow-hidden rounded-3xl border border-border-glass bg-gradient-to-br from-bg-void-soft to-bg-void p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-gold/10 rounded-full blur-[50px] pointer-events-none" />
            <h2 className="text-xl font-heading font-semibold text-white">Contact Information</h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Our business operations and hardware deployment staff typically respond to inquiries within 12–24 business hours.
            </p>

            <div className="space-y-6 pt-8">
              {contactDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-gold">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Column */}
          <div className="glass-card rounded-3xl p-8 lg:col-span-2">
            <h3 className="text-lg font-heading font-semibold text-page-text mb-6">Send A Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  id="contact-name"
                  label="Full Name"
                  value={formData.name}
                  onChange={updateField('name')}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
                <TextField
                  id="contact-email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={updateField('email')}
                  placeholder="john@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <TextField
                id="contact-subject"
                label="Subject"
                value={formData.subject}
                onChange={updateField('subject')}
                placeholder="Hardware/deposit inquiry"
                required
              />
              <TextArea
                id="contact-message"
                label="Message"
                rows={6}
                value={formData.message}
                onChange={updateField('message')}
                placeholder="Detail your request here..."
                required
              />
              <GlowButton type="submit" disabled={loading} className={loading ? 'w-full animate-pulse' : 'w-full'}>
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Message
                  </>
                )}
              </GlowButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
