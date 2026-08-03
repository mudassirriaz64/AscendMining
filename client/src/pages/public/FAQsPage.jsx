import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHero from '../../components/landing/PageHero';
import FAQAccordion from '../../components/landing/FAQAccordion';

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

  const groupedFaqs = faqs.reduce((groups, faq) => {
    const category = faq.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(faq);
    return groups;
  }, {});

  return (
    <div className="relative py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PageHero
          eyebrow="FAQ Knowledge Base"
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions about payouts, wallets, packages, and technical requirements."
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : faqs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
            <HelpCircle className="mx-auto text-page-text-faint mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-page-text mb-2">No FAQs Yet</h3>
            <p className="text-xs text-page-text-soft">Please check back soon. Our FAQs are currently being compiled.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedFaqs).map((category) => (
              <div key={category} className="space-y-5">
                <h2 className="text-lg font-heading font-semibold text-gold tracking-wide border-b border-page-border pb-2 uppercase">
                  {category}
                </h2>
                <FAQAccordion
                  items={groupedFaqs[category].map((faq) => ({
                    id: faq._id,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                  expandedId={expandedFaqId}
                  onToggle={setExpandedFaqId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQsPage;
