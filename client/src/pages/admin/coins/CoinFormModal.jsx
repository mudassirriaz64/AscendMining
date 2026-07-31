import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCoin, updateCoin } from '../../../store/slices/adminCoinSlice';
import Modal from '../../../components/common/Modal';
import InputField from '../../../components/common/InputField';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';

const COIN_ICONS = [
  { symbol: 'BTC', label: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETH', label: 'Ethereum', color: '#627EEA' },
  { symbol: 'USDT', label: 'Tether', color: '#26A17B' },
  { symbol: 'USDC', label: 'USD Coin', color: '#2775CA' },
  { symbol: 'DOGE', label: 'Dogecoin', color: '#C2A633' },
  { symbol: 'LTC', label: 'Litecoin', color: '#BFBBBB' },
  { symbol: 'TRX', label: 'Tron', color: '#FF0013' },
  { symbol: 'BNB', label: 'BNB Chain', color: '#F0B90B' },
  { symbol: 'SOL', label: 'Solana', color: '#9945FF' },
  { symbol: 'MATIC', label: 'Polygon', color: '#8247E5' },
  { symbol: 'ADA', label: 'Cardano', color: '#0033AD' },
  { symbol: 'DOT', label: 'Polkadot', color: '#E6007A' },
  { symbol: 'AVAX', label: 'Avalanche', color: '#E84142' },
  { symbol: 'LINK', label: 'Chainlink', color: '#2A5ADA' },
  { symbol: 'UNI', label: 'Uniswap', color: '#FF007A' },
  { symbol: 'SHIB', label: 'Shiba Inu', color: '#FFA409' },
  { symbol: 'XRP', label: 'Ripple', color: '#23292F' },
  { symbol: 'BCH', label: 'Bitcoin Cash', color: '#8DC351' },
  { symbol: 'ETC', label: 'Ethereum Classic', color: '#328332' },
  { symbol: 'FIL', label: 'Filecoin', color: '#0090FF' },
  { symbol: 'APT', label: 'Aptos', color: '#4CD9C0' },
  { symbol: 'ARB', label: 'Arbitrum', color: '#28A0F0' },
  { symbol: 'OP', label: 'Optimism', color: '#FF0420' },
  { symbol: 'TON', label: 'Toncoin', color: '#0098EA' },
  { symbol: 'NOT', label: 'Notcoin', color: '#FFFFFF' },
];

const coinSchema = z.object({
  name: z.string().min(1, 'Coin name is required.').max(50),
  symbol: z.string().min(1, 'Symbol is required.').max(10),
  logoUrl: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  miningAvailable: z.boolean().default(true),
  usdRate: z.coerce.number().min(0.00000001, 'Rate must be positive.'),
  minWithdrawal: z.coerce.number().min(0, 'Must be positive.'),
  maxWithdrawal: z.coerce.number().min(0, 'Must be positive.'),
  isActive: z.boolean().default(false),
});

const CoinFormModal = ({ isOpen, onClose, coin }) => {
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.adminCoins);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const isEditing = !!coin;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(coinSchema),
    defaultValues: {
      name: '',
      symbol: '',
      logoUrl: '',
      miningAvailable: true,
      usdRate: 1.0,
      minWithdrawal: 1.0,
      maxWithdrawal: 10.0,
      isActive: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (coin) {
        reset({
          name: coin.name,
          symbol: coin.symbol,
          logoUrl: coin.logoUrl || '',
          miningAvailable: coin.miningAvailable,
          usdRate: coin.usdRate,
          minWithdrawal: coin.minWithdrawal,
          maxWithdrawal: coin.maxWithdrawal,
          isActive: coin.isActive,
        });
        const matchedIcon = COIN_ICONS.find((i) => i.symbol === coin.symbol);
        setSelectedIcon(matchedIcon || null);
      } else {
        reset({ name: '', symbol: '', logoUrl: '', miningAvailable: true, usdRate: 1.0, minWithdrawal: 1.0, maxWithdrawal: 10.0, isActive: false });
        setSelectedIcon(null);
      }
    }
  }, [isOpen, coin, reset]);

  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
    setValue('symbol', icon.symbol, { shouldValidate: true });
    setValue('name', icon.label, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      symbol: data.symbol.toUpperCase(),
      logoUrl: data.logoUrl || null,
    };

    if (isEditing) {
      const result = await dispatch(updateCoin({ id: coin._id, data: payload }));
      if (!result.error) onClose();
    } else {
      const result = await dispatch(createCoin(payload));
      if (!result.error) onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Coin' : 'Add New Coin'} size="lg">
      <ErrorMessage message={error} className="mb-4" />

      {!isEditing && (
        <div className="mb-4">
          <label className="block text-[13px] text-text-secondary mb-2 font-medium">Quick Select Coin</label>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-bg-light-alt rounded-lg">
            {COIN_ICONS.map((icon) => (
              <button
                key={icon.symbol}
                type="button"
                onClick={() => handleIconSelect(icon)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedIcon?.symbol === icon.symbol
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-white hover:border-border-light'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: icon.color }}
                >
                  {icon.symbol.substring(0, 2)}
                </div>
                <span className="text-[10px] text-text-secondary truncate w-full text-center">{icon.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Coin Name*" name="name" placeholder="Enter coin name" error={errors.name?.message} {...register('name')} />
          <InputField label="Symbol*" name="symbol" placeholder="Enter symbol (e.g. BTC)" error={errors.symbol?.message} {...register('symbol')} />
        </div>

        <InputField label="Custom Logo URL (optional)" name="logoUrl" placeholder="https://..." error={errors.logoUrl?.message} {...register('logoUrl')} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="USD Rate*" name="usdRate" type="number" step="any" error={errors.usdRate?.message} {...register('usdRate')} />
          <div className="flex items-center gap-3 pt-7">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('miningAvailable')} className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-text-secondary">Mining Available</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Min Withdrawal" name="minWithdrawal" type="number" step="any" error={errors.minWithdrawal?.message} {...register('minWithdrawal')} />
          <InputField label="Max Withdrawal" name="maxWithdrawal" type="number" step="any" error={errors.maxWithdrawal?.message} {...register('maxWithdrawal')} />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-text-secondary">Active (visible to users)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEditing ? 'Update Coin' : 'Create Coin'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CoinFormModal;
