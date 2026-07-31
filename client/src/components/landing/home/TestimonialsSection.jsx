import { m } from 'framer-motion';
import { Star } from 'lucide-react';
import SectionHeading from '../SectionHeading';

const testimonials = [
  { name: 'Michael Chen', quote: 'AscendHash has completely changed my passive income strategy. The platform is reliable and payouts are always on time! Highly recommended!', tenure: 'Mining for 3 years' },
  { name: 'Sarah Johnson', quote: 'Excellent customer service and a very user-friendly interface. I started with the Starter plan and upgraded to Professional within 2 months!', tenure: 'Mining for 1.5 years' },
  { name: 'David Williams', quote: "Best investment I've made. The returns are consistent and the platform is always up and running. Couldn't be happier!", tenure: 'Mining for 2.5 years' },
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h2"
          eyebrow="Testimonials"
          title={<>What Our <span className="bg-gradient-to-r from-yellow-300 via-cyan-400 to-emerald-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer-text">Miners Say</span></>}
          subtitle="Real reviews from real miners worldwide"
          className="mb-14"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <m.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: 'easeOut' }}
              className="flex flex-col justify-between h-full bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-gold/25 hover:shadow-[0_16px_50px_rgba(255,184,0,0.08)] transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-1 mb-5 text-gold drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-sm text-slate-300 italic mb-6 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-cyan-400 font-mono mt-1">{item.tenure}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
