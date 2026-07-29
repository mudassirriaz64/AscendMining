import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, Copy, Check, Upload, ArrowLeft } from 'lucide-react';
import { fetchPaymentMethods, submitDeposit } from '../../store/slices/packageSlice';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import PageSkeleton from '../../components/common/PageSkeleton';

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
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
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      <Header />

      <main className="max-w-xl w-full mx-auto px-6 py-10 flex-grow space-y-6">
        
        {/* BACK ACTION */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="text-[#185adb] w-7 h-7" />
            Deposit Funds / Top Up
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Top up your wallet balance. Once approved by the administrator, you can purchase any mining plan.
          </p>
        </div>

        {/* Balance Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Wallet Balance</p>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              ${(user?.walletBalance || 0).toFixed(2)}
            </h2>
          </div>
          <div className="bg-blue-50 text-[#185adb] p-3 rounded-xl border border-blue-100">
            <Wallet size={20} />
          </div>
        </div>

        {/* DEPOSIT FORM */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-250 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Deposit Amount (USD)*</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-bold border border-slate-200 rounded-xl pl-8 pr-4 py-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#185adb] transition"
                />
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Payment Method*
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#185adb] transition"
              >
                {!paymentMethods.length && <option>No payment methods available</option>}
                {paymentMethods.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            {/* PAYMENT DETAILS / INSTRUCTIONS */}
            {currentMethod && (
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#185adb] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-150">
                    Payment Transfer Destination
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(currentMethod.instructions)}
                    className="text-slate-500 hover:text-[#185adb] transition-colors flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    Copy Address
                  </button>
                </div>
                <pre className="text-xs font-mono font-semibold text-slate-700 bg-white border border-slate-100 p-3 rounded-lg whitespace-pre-line leading-relaxed shadow-sm">
                  {currentMethod.instructions}
                </pre>
              </div>
            )}

            {/* SENDER INFO */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Your Payment Source Info
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Holder / Account Name*</label>
                  <input 
                    type="text" 
                    required
                    value={senderHolderName}
                    onChange={(e) => setSenderHolderName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#185adb] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Sender Phone Number*</label>
                  <input 
                    type="text" 
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="e.g. 03001234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#185adb] transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Sender Bank / Wallet Name*</label>
                <input 
                  type="text" 
                  required
                  value={senderBankName}
                  onChange={(e) => setSenderBankName(e.target.value)}
                  placeholder="e.g. EasyPaisa, CashApp, Binance Pay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#185adb] transition"
                />
              </div>
            </div>

            {/* SCREENSHOT UPLOAD */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Upload Payment Screenshot Proof*
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-250 bg-slate-50 max-h-60 flex items-center justify-center shadow-sm">
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
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-350 transition cursor-pointer">
                  <div className="bg-slate-200/60 p-2.5 rounded-full text-slate-500 mb-2">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Select payment receipt receipt</span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, or JPEG up to 5MB</span>
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
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                loading={loading}
                disabled={!screenshotBase64 || loading}
                className="bg-[#185adb] hover:bg-[#1242a3] text-white font-bold text-xs shadow-md px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Submit Deposit Request
              </Button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
};

export default DepositPage;
