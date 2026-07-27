import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Monitor, X, Clock, HelpCircle } from 'lucide-react';
import { fetchUserMiningTracks } from '../../store/slices/packageSlice';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';

const MiningTracksPage = () => {
  const dispatch = useDispatch();
  const { tracks, loading } = useSelector((state) => state.package);

  const [activeTrack, setActiveTrack] = useState(null);

  useEffect(() => {
    dispatch(fetchUserMiningTracks());
  }, [dispatch]);

  const calculateProgress = (track) => {
    if (track.status !== 'active') {
      return { percent: 0, completed: 0, remaining: 0 };
    }
    const started = new Date(track.cycleStartedAt || track.createdAt).getTime();
    const durationMs = track.durationSnapshot * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - started;
    
    const percent = Math.min(100, Math.max(0, (elapsed / durationMs) * 100));
    const completed = Math.min(track.durationSnapshot, Math.max(0, Math.floor(elapsed / (24 * 60 * 60 * 1000))));
    const remaining = Math.max(0, track.durationSnapshot - completed);
    
    return { percent, completed, remaining };
  };

  const calculateEarnings = (track) => {
    const pkgCoins = track.packageId?.coins || [];
    const dailyProfitUsd = track.purchaseAmount * (track.dailyROISnapshot / 100);
    const progress = calculateProgress(track);

    const perCoin = pkgCoins.map((coin) => {
      const rate = coin?.usdRate || 1.0;
      const dailyProfitCoin = dailyProfitUsd / rate;
      return {
        symbol: coin?.symbol || 'Tx',
        dailyProfitCoin,
        totalEarned: track.status === 'active' ? (progress.completed * dailyProfitCoin) : 0,
        totalPotential: track.durationSnapshot * dailyProfitCoin,
        remainingPotential: progress.remaining * dailyProfitCoin,
      };
    });

    // For backward-compat: primary coin is the first one
    const primary = perCoin[0] || { symbol: 'Tx', dailyProfitCoin: 0, totalEarned: 0, totalPotential: 0, remainingPotential: 0 };

    return {
      ...primary,
      perCoin,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && tracks.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans antialiased text-slate-800 pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-6 py-12 flex-grow space-y-8">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-[#001f3f] tracking-tight uppercase">
            Active Mining Tracks
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Monitor lease nodes progress, daily yields, and activation states.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Clock size={28} />
            </div>
            <h3 className="text-lg font-black text-[#001f3f] uppercase">No Active Tracks Found</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              You haven't leased any hardware package yet. Go to "Start Mining" in the menu to lease a high-yield mining plan.
            </p>
            <a 
              href="/mining/plans" 
              className="inline-block bg-[#e2b007] hover:bg-[#001f3f] hover:text-white text-slate-900 font-bold px-6 py-2.5 rounded-xl text-xs uppercase transition-all duration-300"
            >
              Start Mining Now
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#e2b007] text-[#001f3f] text-xs font-black uppercase tracking-wider">
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Mining Progress</th>
                    <th className="px-6 py-4">Earnings</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {tracks.map((track) => {
                    const progress = calculateProgress(track);
                    const earnings = calculateEarnings(track);
                    
                    return (
                      <tr key={track._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Plan Specs */}
                        <td className="px-6 py-5">
                          <p className="font-extrabold text-slate-900 text-sm">{track.packageId?.name || 'Starter Plan'}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {earnings.perCoin.map((pc) => (
                              <span key={pc.symbol} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{pc.symbol}</span>
                            ))}
                          </div>
                          <p className="text-slate-500 text-[10px] font-medium mt-1">Speed: {track.hashRateSnapshot} Mhash/s</p>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-5 font-black text-slate-800 text-sm">
                          {track.purchaseAmount.toFixed(2)} USD
                        </td>

                        {/* Progress Bar matching screenshot */}
                        <td className="px-6 py-5 max-w-[280px]">
                          <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden relative shadow-inner">
                            {progress.percent > 0 ? (
                              <div 
                                className="bg-[#4caf50] h-full flex items-center justify-center text-[10px] text-white font-black"
                                style={{ width: `${progress.percent}%` }}
                              >
                                {progress.percent.toFixed(2)}%
                              </div>
                            ) : (
                              <div className="h-full w-full bg-slate-200"></div>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
                            <span>{progress.completed} / {track.durationSnapshot} days</span>
                            <span>{progress.remaining} days remaining</span>
                          </div>
                        </td>

                        {/* Earnings */}
                        <td className="px-6 py-5">
                          {earnings.perCoin.map((pc) => (
                            <div key={pc.symbol} className="mb-1 last:mb-0">
                              <p className="text-[#4caf50] font-extrabold text-sm">{pc.totalEarned.toFixed(2)} {pc.symbol}</p>
                              <p className="text-slate-400 font-bold text-[10px]">{pc.dailyProfitCoin.toFixed(2)} {pc.symbol} / day</p>
                            </div>
                          ))}
                        </td>

                        {/* Status badge matching screenshot */}
                        <td className="px-6 py-5">
                          {track.status === 'active' ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#d4edda] text-[#155724] border border-[#c3e6cb]">
                              Approved
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Unpaid
                            </span>
                          )}
                        </td>

                        {/* Action Details button */}
                        <td className="px-6 py-5 text-center">
                          <button 
                            onClick={() => setActiveTrack(track)}
                            className="bg-[#e2b007] text-[#001f3f] hover:bg-[#001f3f] hover:text-white p-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            <Monitor size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Track Details Modal matching Screenshot 3 */}
      {activeTrack && (() => {
        const progress = calculateProgress(activeTrack);
        const earnings = calculateEarnings(activeTrack);
        
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="bg-[#001f3f] text-white px-6 py-4 flex justify-between items-center border-b border-white/10">
                <h2 className="text-sm font-black uppercase tracking-wide">Track Details</h2>
                <button 
                  onClick={() => setActiveTrack(null)} 
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Grid content */}
              <div className="p-6 bg-[#eaeaea] text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 border-b border-slate-300 pb-5">
                  
                  {/* Row 1 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Created At</span>
                    <span className="text-slate-800 font-black">{formatDate(activeTrack.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Total Days</span>
                    <span className="text-slate-800 font-black">{activeTrack.durationSnapshot}</span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Plan Title</span>
                    <span className="bg-[#e2b007] text-[#001f3f] px-2 py-0.5 rounded font-black uppercase">
                      {activeTrack.packageId?.name || 'Starter Plan'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Days Completed</span>
                    <span className="text-slate-800 font-black">{progress.completed}</span>
                  </div>

                  {/* Row 3 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Plan Price</span>
                    <span className="text-slate-800 font-black">{activeTrack.purchaseAmount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Remaining Days</span>
                    <span className="text-slate-800 font-black">{progress.remaining}</span>
                  </div>

                  {/* Row 4 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Miner</span>
                    <div className="flex flex-wrap gap-1">
                      {earnings.perCoin.map((pc) => (
                        <span key={pc.symbol} className="bg-[#e2b007] text-[#001f3f] px-2 py-0.5 rounded font-black uppercase text-[10px]">{pc.symbol}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Total Earned</span>
                    <div className="text-right">
                      {earnings.perCoin.map((pc) => (
                        <p key={pc.symbol} className="text-[#4caf50] font-black">{pc.totalEarned.toFixed(2)} {pc.symbol}</p>
                      ))}
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Speed</span>
                    <span className="text-slate-800 font-black">{activeTrack.hashRateSnapshot} Mhash/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Total Potential</span>
                    <span className="text-[#001f3f] font-black">{earnings.totalPotential.toFixed(2)} {earnings.symbol}</span>
                  </div>

                  {/* Row 6 */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Return / Day</span>
                    <div className="text-right">
                      {earnings.perCoin.map((pc) => (
                        <p key={pc.symbol} className="text-slate-800 font-black">{pc.dailyProfitCoin.toFixed(2)} {pc.symbol}</p>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Remaining Potential</span>
                    <div className="text-right">
                      {earnings.perCoin.map((pc) => (
                        <p key={pc.symbol} className="text-slate-600 font-black">{pc.remainingPotential.toFixed(2)} {pc.symbol}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Yellow accent divider bar at bottom */}
                <div className="w-full bg-[#e2b007] h-2.5 rounded-full mt-5"></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MiningTracksPage;
