import { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown, Layers } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const FAQsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/faqs');
        setFaqs(response.data.data || []);
      } catch {
        console.warn('Failed to load FAQs.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFaq = (id) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  // Group by category helper
  const groupedFaqs = faqs.reduce((groups, faq) => {
    const category = faq.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(faq);
    return groups;
  }, {});

  return (
    <div className="bg-bg-light-alt py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">FAQ Knowledge Base</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Frequently Asked Questions</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Find answers to common questions about payouts, wallets, packages, and technical requirements.
          </p>
        </div>

        {/* FAQs */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : faqs.length === 0 ? (
          <div className="bg-white border border-border-light rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto">
            <HelpCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-2">No FAQs Yet</h3>
            <p className="text-xs text-text-secondary">Please check back soon. Our FAQs are currently being compiled.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedFaqs).map((category) => (
              <div key={category} className="space-y-4">
                <h2 className="text-lg font-heading font-semibold text-secondary tracking-wide border-b border-border-light pb-2 uppercase">
                  {category}
                </h2>
                <div className="space-y-3">
                  {groupedFaqs[category].map((faq) => {
                    const isExpanded = expandedFaqId === faq._id;
                    return (
                      <div 
                        key={faq._id}
                        className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq._id)}
                          className="w-full px-6 py-4 text-left flex justify-between items-center font-heading font-medium text-sm text-text-light-bg hover:bg-slate-50 transition-colors focus:outline-none"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown 
                            size={16} 
                            className={`text-text-secondary transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-secondary' : ''}`} 
                          />
                        </button>
                        <div 
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            isExpanded ? 'max-h-96 border-t border-border-light opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-6 py-4 text-sm text-text-secondary leading-relaxed bg-[#fafbfc]">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQsPage;
