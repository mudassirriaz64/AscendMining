import CountUp from '../CountUp';

const stats = [
  { target: 75000, suffix: '+', decimals: 0, label: 'Active Miners' },
  { target: 3.5, suffix: 'M+', decimals: 1, label: 'Total Payouts ($)' },
  { target: 99.9, suffix: '%', decimals: 1, label: 'Uptime SLA' },
  { target: 60, suffix: '+', decimals: 0, label: 'Supported Countries' },
];

const StatsBar = () => {
  return (
    <section className="relative z-20 pb-16 lg:pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl px-6 py-8 sm:px-10 shadow-[0_16px_60px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1.5">
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gold">
                  <CountUp target={stat.target} suffix={stat.suffix} decimals={stat.decimals} />
                </h2>
                <p className="text-xs sm:text-sm text-page-text-soft font-medium tracking-wide uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
