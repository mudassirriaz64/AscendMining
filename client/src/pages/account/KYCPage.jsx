import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Upload, AlertCircle, FileText, CheckCircle2, Clock, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { submitKYC, clearKYCStatus } from '../../store/slices/kycSlice';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const KYCPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { loading, error, success, actionSuccessMessage } = useSelector((state) => state.kyc);

  const [documentType, setDocumentType] = useState('cnic');
  const [documentImage, setDocumentImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (success) {
      toast.success(actionSuccessMessage || 'KYC submitted successfully!');
      dispatch(clearKYCStatus());
      setDocumentImage('');
      setImagePreview('');
    }
    if (error) {
      toast.error(error);
      dispatch(clearKYCStatus());
    }
  }, [success, error, actionSuccessMessage, dispatch]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!documentImage) {
      toast.error('Please upload your document image.');
      return;
    }
    dispatch(submitKYC({ documentType, documentImage }));
  };

  const status = user?.kycStatus || 'none';

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      <Header />

      <main className="max-w-3xl w-full mx-auto px-6 py-10 flex-grow space-y-6">
        
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
            <ShieldCheck className="text-[#185adb] w-7 h-7" />
            Identity Verification (KYC)
          </h1>
          <p className="text-slate-500 text-xs mt-1">Verify your identity to unlock withdrawal operations and secure your account.</p>
        </div>

        {/* STATUS VIEWS */}
        {status === 'approved' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center space-y-4">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-green-500">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-950">Identity Verified ✅</h2>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Thank you! Your identity has been successfully verified. All platform restrictions and limits on your withdrawals have been unlocked.
              </p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate('/withdraw')} className="bg-[#185adb] hover:bg-[#1242a3] text-white font-bold text-xs px-6 py-2.5">
                Go to Withdrawals
              </Button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center space-y-4">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-blue-500 animate-pulse">
              <Clock size={36} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-950">Verification in Progress</h2>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Your verification documents have been submitted and are currently pending review by our administrator. This process usually takes less than 24 hours. You will receive a notification when verification is complete.
              </p>
            </div>
            <div className="pt-4">
              <Button onClick={() => navigate('/dashboard')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {(status === 'none' || status === 'rejected') && (
          <div className="space-y-6">
            
            {status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 text-red-800 text-xs shadow-sm">
                <ShieldAlert size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">KYC Verification Failed</p>
                  <p className="text-red-600 mt-1 font-semibold">Reason: {user?.kycRejectionReason || 'No reason provided.'}</p>
                  <p className="text-red-500/80 mt-1">Please read the rejection reason carefully, update your document selection or photo quality, and re-submit below.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 md:p-8 space-y-6">
              <h2 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-3">Submit Documents</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* DOCUMENT TYPE */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Document Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['cnic', 'driver_license', 'passport'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDocumentType(type)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          documentType === type
                            ? 'border-[#185adb] bg-blue-50/20 text-[#185adb] font-bold'
                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        <FileText size={20} className="mb-1" />
                        <span className="text-[10px] uppercase tracking-wider">
                          {type === 'cnic' ? 'National ID / CNIC' : type.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UPLOADER */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Document Photo</label>
                  
                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-250 bg-slate-50 max-h-72 flex items-center justify-center group shadow-sm">
                      <img src={imagePreview} alt="Document preview" className="object-contain max-h-72 w-full p-2" />
                      <button
                        type="button"
                        onClick={() => { setDocumentImage(''); setImagePreview(''); }}
                        className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Upload size={14} className="rotate-180" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300 transition-colors cursor-pointer">
                      <div className="bg-slate-200/60 p-3 rounded-full text-slate-500 mb-3">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Choose file or drag & drop</span>
                      <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, or WEBP up to 5MB</span>
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
                    disabled={!documentImage || loading}
                    className="bg-[#185adb] hover:bg-[#1242a3] text-white font-bold text-xs shadow-md px-6 py-2.5 rounded-xl cursor-pointer"
                  >
                    Submit Verification Request
                  </Button>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default KYCPage;
