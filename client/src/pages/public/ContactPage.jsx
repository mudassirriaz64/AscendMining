import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return toast.error('All fields are required.');
    }
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

  return (
    <div className="bg-bg-light-alt py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Get In Touch</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Contact Us</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Have questions about customized hash rate deployments, corporate accounts, or payment options? Contact our support staff.
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start max-w-5xl mx-auto">
          {/* Details Column */}
          <div className="space-y-8 bg-bg-dark text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/15 rounded-full filter blur-[40px] pointer-events-none" />
            <h2 className="text-xl font-heading font-semibold">Contact Information</h2>
            <p className="text-xs text-text-dark-bg/85 leading-relaxed">
              Our business operations and hardware deployment staff typically respond to inquiries within 12–24 business hours.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex gap-4">
                <Mail size={18} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold">Email Inquiry</h4>
                  <p className="text-xs text-text-secondary mt-1">support@ascendhash.com</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone size={18} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold">Call Support</h4>
                  <p className="text-xs text-text-secondary mt-1">+1 (800) 555-MINING</p>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin size={18} className="text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold">HQ Address</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    Suite 450, Crypto Tower Block A, George Town, Cayman Islands
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-white border border-border-light rounded-2xl p-8 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-6">Send A Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-text-secondary mb-1">Full Name*</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-text-secondary mb-1">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-text-secondary mb-1">Subject*</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Hardware/deposit inquiry"
                  className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-text-secondary mb-1">Message*</label>
                <textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detail your request here..."
                  className="w-full bg-[#fafbfc] border border-border-light rounded-lg px-3 py-2 text-sm text-text-light-bg focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-text-light-bg py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Sending...' : <><Send size={14} /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
