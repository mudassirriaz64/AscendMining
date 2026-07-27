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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Package' : 'Create New Package'} size="lg">
      <ErrorMessage message={error} className="mb-4" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Package Name*" name="name" placeholder="e.g. Gold Plan" error={errors.name?.message} {...register('name')} />
          <div>
            <label className="block text-[13px] text-text-secondary mb-1.5 font-medium">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm text-text-light-bg bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-text-secondary mb-1.5 font-medium">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Optional package description..."
            className="w-full px-4 py-2.5 border border-border-light rounded-lg text-sm text-text-light-bg bg-white placeholder:text-text-secondary/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputField label="Price ($)*" name="price" type="number" step="any" error={errors.price?.message} {...register('price')} />
          <InputField label="Daily ROI (%)*" name="dailyROI" type="number" step="any" error={errors.dailyROI?.message} {...register('dailyROI')} />
          <InputField label="Duration (days)*" name="duration" type="number" error={errors.duration?.message} {...register('duration')} />
        </div>

        <InputField label="Hash Rate (MH/s)" name="hashRate" type="number" step="any" error={errors.hashRate?.message} {...register('hashRate')} />

        <div>
          <label className="block text-[13px] text-text-secondary mb-2 font-medium">
            Available Coins* <span className="text-xs text-text-secondary/60">(select which coins this package offers)</span>
          </label>
          {errors.coins?.message && <p className="text-xs text-danger mb-2">{errors.coins.message}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-bg-light-alt rounded-lg border border-border-light">
            {allCoins.length === 0 && (
              <p className="text-xs text-text-secondary col-span-3 text-center py-2">No coins available. Create coins first.</p>
            )}
            {allCoins.map((coin) => (
              <label
                key={coin._id}
                className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCoins?.includes(coin._id)
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-white hover:border-border-light'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCoins?.includes(coin._id)}
                  onChange={() => toggleCoinSelection(coin._id)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-light-bg">{coin.symbol}</span>
                  <span className="text-[11px] text-text-secondary">{coin.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEditing ? 'Update Package' : 'Create Package'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PackageFormModal;
