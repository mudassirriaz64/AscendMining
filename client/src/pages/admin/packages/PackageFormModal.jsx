import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createAdminPackage, updateAdminPackage, fetchAllCoins, clearPackageError } from '../../../store/slices/adminPackageSlice';
import Modal from '../../../components/common/Modal';
import InputField from '../../../components/common/InputField';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required.').max(100),
  description: z.string().max(500).optional().default(''),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
  dailyROI: z.coerce.number().min(0.01, 'Daily ROI must be positive.'),
  duration: z.coerce.number().int().min(1, 'Must be at least 1 day.'),
  hashRate: z.coerce.number().min(0).optional().default(0),
  coins: z.array(z.string()).min(1, 'Select at least one coin.'),
  status: z.enum(['active', 'inactive']).default('active'),
});

const PackageFormModal = ({ isOpen, onClose, pkg }) => {
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.adminPackages);
  const { allCoins } = useSelector((state) => state.adminPackages);
  const isEditing = !!pkg;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      dailyROI: 0,
      duration: 30,
      hashRate: 0,
      coins: [],
      status: 'active',
    },
  });

  const selectedCoins = watch('coins');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllCoins());
      if (pkg) {
        reset({
          name: pkg.name,
          description: pkg.description || '',
          price: pkg.price,
          dailyROI: pkg.dailyROI,
          duration: pkg.duration,
          hashRate: pkg.hashRate || 0,
          coins: pkg.coins?.map((c) => (typeof c === 'string' ? c : c._id)) || [],
          status: pkg.status,
        });
      } else {
        reset({ name: '', description: '', price: 0, dailyROI: 0, duration: 30, hashRate: 0, coins: [], status: 'active' });
      }
    }
  }, [isOpen, pkg, dispatch, reset]);

  const toggleCoinSelection = (coinId) => {
    const current = selectedCoins || [];
    if (current.includes(coinId)) {
      setValue('coins', current.filter((id) => id !== coinId), { shouldValidate: true });
    } else {
      setValue('coins', [...current, coinId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    if (isEditing) {
      const result = await dispatch(updateAdminPackage({ id: pkg._id, data }));
      if (!result.error) onClose();
    } else {
      const result = await dispatch(createAdminPackage(data));
      if (!result.error) onClose();
    }
  };

  const displayedCoins = allCoins.filter((coin) => {
    if (coin.isActive) return true;
    if (isEditing && pkg.coins?.some((c) => (typeof c === 'string' ? c : c._id) === coin._id)) {
      return true;
    }
    return false;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Package' : 'Create New Package'} size="lg">
      <ErrorMessage message={error} className="mb-4" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Package Name*" name="name" placeholder="Enter package name" error={errors.name?.message} {...register('name')} />
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              {...register('status')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-[#0d1420] transition"
            >
              <option value="active" className="bg-[#0d1420] text-white">Active</option>
              <option value="inactive" className="bg-[#0d1420] text-white">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Optional package description..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputField label="Price ($)*" name="price" type="number" step="any" error={errors.price?.message} {...register('price')} />
          <InputField label="Daily ROI (%)*" name="dailyROI" type="number" step="any" error={errors.dailyROI?.message} {...register('dailyROI')} />
          <InputField label="Duration (days)*" name="duration" type="number" error={errors.duration?.message} {...register('duration')} />
        </div>

        <InputField label="Hash Rate (MH/s)" name="hashRate" type="number" step="any" error={errors.hashRate?.message} {...register('hashRate')} />

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Available Coins* <span className="text-[11px] text-slate-500 lowercase normal-case font-normal">(select which coins this package offers)</span>
          </label>
          {errors.coins?.message && <p className="text-xs text-danger mb-2">{errors.coins.message}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-[#050811] border border-white/5 rounded-xl">
            {displayedCoins.length === 0 && (
              <p className="text-xs text-slate-400 col-span-3 text-center py-2">No active coins available.</p>
            )}
            {displayedCoins.map((coin) => (
              <label
                key={coin._id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedCoins?.includes(coin._id)
                    ? 'border-primary-container bg-primary-container/10 text-white'
                    : 'border-transparent hover:bg-white/5 hover:border-white/10 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCoins?.includes(coin._id)}
                  onChange={() => toggleCoinSelection(coin._id)}
                  className="w-4 h-4 rounded accent-amber-400 bg-white/5 border border-white/10"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">{coin.symbol}</span>
                  <span className="text-[11px] text-slate-450">{coin.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEditing ? 'Update Package' : 'Create Package'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PackageFormModal;
