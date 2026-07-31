import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, Copy, Check, Upload, ArrowLeft } from 'lucide-react';
import { fetchPaymentMethods, submitDeposit } from '../../store/slices/packageSlice';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import PageSkeleton from '../../components/common/PageSkeleton';
import Logo from '../../components/common/Logo';

const DepositPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { paymentMethods, loading } = useSelector((state) => state.package);
  const { user } = useSelector((state) => state.auth);

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [senderHolderName, setSenderHolderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderBankName, setSenderBankName] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  // Set default method once loaded
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentMethods[0]._id);
    }
  }, [paymentMethods, selectedMethod]);

  const currentMethod = paymentMethods.find((m) => m._id === selectedMethod);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Payment address copied!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result);
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid deposit amount.');
      return;
    }
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    if (!senderHolderName.trim()) {
      toast.error('Sender holder name is required.');
      return;
    }
    if (!senderPhone.trim()) {
      toast.error('Sender phone number is required.');
      return;
    }
    if (!senderBankName.trim()) {
      toast.error('Sender bank or wallet name is required.');
      return;
    }
    if (!screenshotBase64) {
      toast.error('Payment screenshot proof is required.');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      paymentMethodId: selectedMethod,
      senderHolderName: senderHolderName.trim(),
      senderPhone: senderPhone.trim(),
      senderBankName: senderBankName.trim(),
      screenshot: screenshotBase64,
    };

    const res = await dispatch(submitDeposit(payload));
    if (!res.error) {
      toast.success(res.payload?.message || 'Deposit request submitted successfully!');
      navigate('/deposits');
    } else {
      toast.error(res.payload?.error?.message || 'Failed to submit deposit.');
    }
  };

  if (loading && !paymentMethods.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      <Header />

      <main className="max-w-xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">

        {/* BACK ACTION */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface font-bold transition-colors cursor-pointer font-heading"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-2 uppercase">
            <Wallet className="text-tertiary w-7 h-7" />
            Deposit Funds / Top Up
          </h1>
          <p className="text-on-surface-variant text-xs mt-1 font-heading font-medium">
            Top up your wallet balance. Once approved by the administrator, you can purchase any mining plan.
          </p>
        </div>

        {/* Balance Status - Aureus Dark Navy card */}
        <div className="bg-on-secondary-fixed rounded-xl border border-outline-variant p-card-padding flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider font-heading">Current Wallet Balance</p>
            <h2 className="text-2xl font-bold text-white font-mono mt-0.5">
              ${(user?.walletBalance || 0).toFixed(2)}
            </h2>
          </div>
          <div className="bg-primary-container text-on-primary-fixed p-3 rounded-lg border border-primary/20">
            <Wallet size={20} />
          </div>
        </div>

        {/* DEPOSIT FORM */}
        <div className="bg-white rounded-xl border border-outline-variant p-card-padding">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Deposit Amount (USD)*</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm font-bold text-on-surface-variant">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-bold border border-outline-variant rounded-lg pl-8 pr-4 py-3 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-mono"
                />
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Select Payment Method*
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
              >
                {!paymentMethods.length && <option>No payment methods available</option>}
                {paymentMethods.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {/* PAYMENT DETAILS / INSTRUCTIONS */}
            {currentMethod && (
              <div className="bg-surface-bright border border-outline-variant rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-tertiary/20">
                    Payment Transfer Destination
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentMethod.instructions)}
                    className="text-on-surface-variant hover:text-tertiary transition-colors flex items-center gap-1.5 text-xs font-bold font-heading"
                  >
                    {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    Copy Address
                  </button>
                </div>
                <pre className="text-xs font-mono font-semibold text-on-surface bg-white border border-outline-variant p-3 rounded-lg whitespace-pre-line leading-relaxed shadow-sm">
                  {currentMethod.instructions}
                </pre>
              </div>
            )}

            {/* SENDER INFO */}
            <div className="space-y-4 pt-2 border-t border-outline-variant">
              <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest font-heading">
                Your Payment Source Info
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Holder / Account Name*</label>
                  <input
                    type="text"
                    required
                    value={senderHolderName}
                    onChange={(e) => setSenderHolderName(e.target.value)}
                    placeholder="Enter account name"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Sender Phone Number*</label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="e.g., +44 7911 123456 (UK)"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase">Sender Bank / Wallet Name*</label>
                <input
                  type="text"
                  required
                  value={senderBankName}
                  onChange={(e) => setSenderBankName(e.target.value)}
                  placeholder="Binance"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-on-surface"
                />
              </div>
            </div>

            {/* SCREENSHOT UPLOAD */}
            <div className="space-y-2 border-t border-outline-variant pt-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Upload Payment Screenshot Proof*
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low max-h-60 flex items-center justify-center shadow-sm">
                  <img src={screenshotPreview} alt="Screenshot proof preview" className="object-contain max-h-60 w-full p-2" />
                  <button
                    type="button"
                    onClick={() => { setScreenshotBase64(''); setScreenshotPreview(null); }}
                    className="absolute top-2 right-2 bg-slate-900/85 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Upload size={14} className="rotate-180" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 bg-surface-container-low hover:bg-surface-container-high transition cursor-pointer">
                  <div className="bg-surface-container-high p-2.5 rounded-full text-on-surface-variant mb-2">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-on-surface">Select payment receipt screenshot</span>
                  <span className="text-[10px] text-on-surface-variant mt-1">PNG, JPG, or JPEG (Maximum size: 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-outline-variant flex justify-end">
              <button
                type="submit"
                disabled={!screenshotBase64 || loading}
                className="bg-primary-container hover:brightness-110 text-on-primary-fixed font-extrabold text-xs shadow-sm px-6 py-3 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
              >
                {loading ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </div>

          </form>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-on-secondary-fixed text-white/50 py-8 border-t border-outline-variant/20 mt-12">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-4">
          <Logo variant="dark" size="sm" className="h-8 opacity-80" />
          <p className="font-body-sm text-body-sm text-center">
            &copy; 2026 <span className="font-semibold text-white">AscendHash</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DepositPage;
