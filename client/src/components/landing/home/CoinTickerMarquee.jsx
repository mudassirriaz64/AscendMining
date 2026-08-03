import { m } from 'framer-motion';

const marqueeCoins = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: 'text-gold',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.035-1.244 15.525.362 9.103 1.96 2.67 8.471-1.24 14.9-.364c6.43 1.602 10.34 8.113 8.738 14.542zm-7.496-4.958c.323-2.164-1.323-3.327-3.575-4.103l.73-2.928-1.782-.444-.712 2.855c-.468-.117-.95-.226-1.428-.335l.72-2.883-1.782-.444-.73 2.928c-.387-.088-.767-.175-1.137-.267l.002-.008-2.46-.613-.474 1.9.993.227c.542.124.8.453.78 1.054L7.15 11.23c.037.094.086.23.14.364l-.946 3.79c-.066.41-.337.74-.78.63l-.994-.247-.947 3.8 2.32.578c.433.11.857.22 1.277.324l-.738 2.957 1.783.444.73-2.928c.487.133.957.256 1.418.373l-.726 2.91 1.782.444.738-2.96c3.044.576 5.334.344 6.297-2.41.776-2.217-.038-3.497-1.644-4.332 1.17-.27 2.05-1.037 2.285-2.625zm-4.083 5.742c-.552 2.215-4.28.877-5.49.576l.98-3.926c1.21.3 5.074.894 4.51 3.35zm.55-5.772c-.503 2.02-3.61.994-4.618.743l.888-3.56c1.008.25 4.24.717 3.73 2.817z" />
      </svg>
    ),
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    color: 'text-indigo-400',
    icon: (
      <svg className="w-3 h-4 fill-current" viewBox="0 0 784 1277">
        <path d="M392 0L383.5 28.5V870.5L392 879L784 647.5L392 0Z" />
        <path d="M392 956L387 962V1271.5L392 1277L784 724.5L392 956Z" />
        <path d="M392 879L784 647.5L392 522.5V879Z" />
      </svg>
    ),
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    color: 'text-emerald-400',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M4.6 15.3l3-3h11.8l-3 3zm14.8-6.6l-3 3H4.6l3-3zm-3-6.6l3 3H7.6l-3-3z"/>
      </svg>
    ),
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    color: 'text-teal-400',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm3.8 8.82h-2.3v3.91c0 .7-.37.99-1 .99s-1-.29-1-.99V8.82H9.2v-1.7h6.6v1.7zm1.1-2.9h-9.8v-1.6h9.8v1.6z" />
      </svg>
    ),
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    color: 'text-amber-400',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm1.74 15.82h-3.48v-2.31h1.16c1.19 0 1.94-.48 1.94-1.51s-.75-1.51-1.94-1.51h-1.16V8.18h3.48c2.25 0 3.73 1.15 3.73 3.82 0 2.67-1.48 3.82-3.73 3.82zm-4.64 0H7.94V8.18h1.16v7.64z" />
      </svg>
    ),
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    color: 'text-blue-500',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
    ),
  },
];

const CoinTickerMarquee = () => {
  const renderTrack = (prefix) => (
    <div className="flex items-center">
      {marqueeCoins.map((coin, idx) => (
        <div key={`${prefix}-${idx}`} className="flex items-center gap-3 mx-12">
          <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-page-fill border border-page-border ${coin.color}`}>
            {coin.icon}
          </span>
          <span className="text-xs font-medium text-page-text-soft tracking-wider">{coin.symbol}</span>
          <span className="text-[10px] text-page-text-faint font-medium tracking-wide uppercase">{coin.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="relative z-10 w-full overflow-hidden py-3.5 bg-transparent select-none pointer-events-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <m.div
        className="flex whitespace-nowrap min-w-full"
        animate={{ x: [0, '-50%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
      >
        {renderTrack('c1')}
        {renderTrack('c2')}
      </m.div>
    </div>
  );
};

export default CoinTickerMarquee;
