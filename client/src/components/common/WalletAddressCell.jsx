import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const WalletAddressCell = ({ address, maxWidth = '160px' }) => {
  const [expanded, setExpanded] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address).then(() => {
      toast.success('Wallet address copied');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`font-mono text-xs text-amber-400 bg-white/5 border border-amber-400/10 p-1.5 rounded-lg ${expanded ? 'max-w-none break-all' : 'truncate'}`}
        style={expanded ? {} : { maxWidth }}
        title={address}
      >
        {address}
      </span>
      <button
        type="button"
        onClick={copy}
        className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 text-slate-400"
        title="Copy address"
      >
        <Copy size={13} />
      </button>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 text-slate-400"
        title={expanded ? 'Hide full address' : 'View full address'}
      >
        {expanded ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
};

export default WalletAddressCell;
