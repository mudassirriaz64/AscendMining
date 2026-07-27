import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Sparkles, Copy, Check, Upload, X } from 'lucide-react';
import { fetchPackages, fetchPaymentMethods, purchasePlan } from '../../store/slices/packageSlice';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';

const StartMiningPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { packages, paymentMethods, loading } = useSelector((state) => state.package);
  
  // State for Purchase modal
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [senderHolderName, setSenderHolderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderBankName, setSenderBankName] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchPackages());
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

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

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result); // Base64 representation
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    if (!senderHolderName.trim()) {
      toast.error('Sender name / holder name is required.');
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
      packageId: selectedPlan._id,
      paymentMethodId: selectedMethod,
      senderHolderName: senderHolderName.trim(),
      senderPhone: senderPhone.trim(),
      senderBankName: senderBankName.trim(),
      screenshot: screenshotBase64,
    };

    const res = await dispatch(purchasePlan(payload));
    if (!res.error) {
      toast.success('Your payment proof was submitted! Admin will verify and activate your mining plan.');
      // Reset state & close modal
      closeModal();
      navigate('/mining/tracks');
    } else {
      toast.error(res.payload?.error?.message || 'Failed to submit purchase.');
    }
  };

  const openModal = (plan) => {
    setSelectedPlan(plan);
    // Auto-select first method if available
    if (paymentMethods.length > 0) {
      setSelectedMethod(paymentMethods[0]._id);
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setSelectedMethod('');
    setSenderHolderName('');
    setSenderPhone('');
    setSenderBankName('');
    setScreenshotBase64('');
    setScreenshotPreview(null);
  };

  if (loading && packages.length === 0) {
    return <PageSkeleton />;
  }

  const currentMethod = paymentMethods.find(m => m._id === selectedMethod);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans antialiased text-slate-800 pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-6 py-12 flex-grow space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin" /> Mining Hardware Nodes
          </div>
          <h1 className="text-3xl font-black text-[#001f3f] tracking-tight uppercase">
            Start Mining Crypto
          </h1>
          <p className="text-slate-500 text-sm">
            Choose a hardware lease plan below. Once purchased, upload your bank transfer or digital wallet proof to start receiving daily auto-mining payouts.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex flex-wrap justify-center gap-8">
          {packages.map((pkg) => (
            <div 
              key={pkg._id} 
              className="bg-[#e2b007] rounded-2xl shadow-xl border border-yellow-600/10 p-6 flex flex-col items-center justify-between text-center max-w-[280px] w-full transition-transform hover:scale-[1.03] duration-300 relative group overflow-hidden"
            >
              {/* Coin Badge */}
              <div className="flex flex-wrap justify-center gap-1 mb-6">
                {(pkg.coins || []).map((coin) => (
                  <span key={coin._id || coin} className="bg-[#001f3f] text-yellow-400 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md">
                    {coin.symbol || coin}
                  </span>
                ))}
              </div>

              {/* Smiley graphic matching screenshot */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-yellow-400 mb-6 shadow-inner text-yellow-500 transition-transform group-hover:rotate-12 duration-500">
                <svg className="w-12 h-12 text-[#e2b007]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              </div>

              {/* Package Details */}
              <div className="space-y-1 mb-2">
                <h3 className="text-white text-xl font-black tracking-wider uppercase drop-shadow-sm">
                  {pkg.name}
                </h3>
                <div className="text-white text-2xl font-black drop-shadow-sm">
                  ${pkg.price.toFixed(2)} <span className="text-white/80 text-xs font-semibold">/ {pkg.duration} Day</span>
                </div>
              </div>

              {/* Custom specs */}
              <div className="w-full border-t border-white/20 pt-4 pb-6 mt-2 space-y-1.5 text-white/90 text-xs font-bold">
                <p>Speed: {pkg.hashRate} Mhash/s</p>
                <p>Daily ROI: {(pkg.dailyROI || 0).toFixed(2)}%</p>
                <p className="text-amber-100 font-extrabold uppercase">Payout Target: {(pkg.coins || []).map(c => c.symbol || c).join(', ') || 'N/A'}</p>
              </div>

              {/* Buy Now Button */}
              <button 
                onClick={() => openModal(pkg)}
                className="w-full bg-[#001f3f] text-white hover:bg-[#083358] font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout Manual Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#001f3f] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wide">Manual Checkout</h2>
                <p className="text-xs text-yellow-400 font-bold mt-0.5">Lease: {selectedPlan.name} (${selectedPlan.price.toFixed(2)})</p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Admin Payment Gateway
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#001f3f] transition-all"
                >
                  {paymentMethods.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination Instructions Box */}
              {currentMethod && (
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#001f3f] bg-yellow-100 px-2 py-0.5 rounded-full uppercase">
                      Admin Payment Address
                    </span>
                    <button 
                      onClick={() => handleCopy(currentMethod.instructions)}
                      className="text-slate-500 hover:text-[#001f3f] transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      Copy Details
                    </button>
                  </div>
                  <pre className="text-xs font-mono font-semibold text-slate-700 bg-white border border-slate-100 p-3 rounded-lg whitespace-pre-line leading-relaxed shadow-sm">
                    {currentMethod.instructions}
                  </pre>
                </div>
              )}

              {/* User Payment Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                  Your Sender Account Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Holder Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sender / Account Holder Name</label>
                    <input 
                      type="text" 
                      value={senderHolderName}
                      onChange={(e) => setSenderHolderName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001f3f] transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sender Phone Number</label>
                    <input 
                      type="text" 
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001f3f] transition-all"
                    />
                  </div>
                </div>

                {/* Bank / App Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name / Wallet App</label>
                  <input 
                    type="text" 
                    value={senderBankName}
                    onChange={(e) => setSenderBankName(e.target.value)}
                    placeholder="e.g. EasyPaisa, JazzCash, Allied Bank"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#001f3f] transition-all"
                  />
                </div>
              </div>

              {/* Screenshot Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Payment Receipt Screenshot (Required)
                </label>
                
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/50 transition-colors relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {screenshotPreview ? (
                    <div className="space-y-3 text-center">
                      <img 
                        src={screenshotPreview} 
                        alt="Receipt preview" 
                        className="max-h-40 rounded-xl border border-slate-200 shadow-md object-contain mx-auto"
                      />
                      <p className="text-[10px] text-[#001f3f] font-bold">Click or drag to replace receipt image</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Upload Transaction Receipt Image</p>
                      <p className="text-[10px] text-slate-400">Supported formats: JPG, JPEG, PNG</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={closeModal}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPurchase}
                className="bg-[#001f3f] hover:bg-[#083358] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartMiningPage;
