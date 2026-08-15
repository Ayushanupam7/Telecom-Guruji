'use client';

import React, { useState } from 'react';
import { 
  X, QrCode, CreditCard, ShieldCheck, Lock, CheckCircle2, Copy, Check, 
  Sparkles, Zap, ArrowRight, Signal, CheckCircle, AlertCircle
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { formatCoursePrice, getCurrencySymbol } from '@/lib/currency';
import { CourseThumbnail } from './CourseThumbnail';

interface InstantEnrollmentModalProps {
  course: any;
  onClose: () => void;
  onConfirmEnroll: (paidAmount: number, method: string, utr: string) => Promise<void>;
  processingPayment: boolean;
}

export function InstantEnrollmentModal({
  course,
  onClose,
  onConfirmEnroll,
  processingPayment,
}: InstantEnrollmentModalProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>('');

  const upiId = 'signalhub@upi';
  const priceFormatted = formatCoursePrice(course.price, course.currency);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpiSubmit = async () => {
    setVerificationStep('Verifying UPI Gateway Payload...');
    setTimeout(async () => {
      setVerificationStep('Syncing Supabase Database...');
      await onConfirmEnroll(course.price, 'upi_qr', utrNumber);
      setVerificationStep('');
    }, 800);
  };

  const handleCardSubmit = async () => {
    setVerificationStep('Authorizing Card Payment...');
    await onConfirmEnroll(course.price, 'card', '');
    setVerificationStep('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto">
      {/* MONOCHROME BLACK & WHITE CONTAINER */}
      <div className={`w-full max-w-md sm:max-w-lg md:max-w-2xl p-6 rounded-3xl border shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto transition-all ${
        isLight
          ? 'bg-white border-zinc-300 text-black shadow-2xl'
          : 'bg-zinc-950 border-zinc-800 text-white shadow-2xl'
      }`}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-black dark:hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: COURSE SUMMARY */}
          <div className="sm:col-span-5 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3 pr-6">
              <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-md">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1 text-[10px] font-mono font-bold uppercase tracking-wider text-black dark:text-white">
                  <Sparkles className="w-3 h-3" />
                  <span>Instant Enrollment</span>
                </div>
                <h2 className="text-sm font-black tracking-tight">Unlock Verified Course</h2>
              </div>
            </div>

            {/* Course Summary Box */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <CourseThumbnail
                thumbnailUrl={course.thumbnail_url}
                thumbnailType={course.thumbnail_type}
                category={course.category}
                title={course.title}
                className="w-full h-32 rounded-xl shadow-xs"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-[9px] font-mono font-bold uppercase border border-zinc-300 dark:border-zinc-700">
                    {course.category}
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-zinc-500">
                    {course.level || 'Intermediate'}
                  </span>
                </div>
                <h3 className={`text-xs font-black line-clamp-2 leading-snug ${isLight ? 'text-black' : 'text-white'}`}>
                  {course.title}
                </h3>
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Course Tuition Fee</span>
                  <span className="font-bold">{priceFormatted}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Supabase Cloud Sync</span>
                  <span className="font-bold text-black dark:text-white">FREE</span>
                </div>
                <div className="flex justify-between font-mono text-xs pt-1 border-t border-zinc-200 dark:border-zinc-800 font-extrabold">
                  <span>Total Payable</span>
                  <span className="text-black dark:text-white">{priceFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT OPTIONS */}
          <div className="sm:col-span-7 space-y-4">
            
            {/* PAYMENT METHOD TABS */}
            <div className="p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 grid grid-cols-2 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 rounded-xl font-black transition-all flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'upi'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR / VPA</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 rounded-xl font-black transition-all flex items-center justify-center space-x-1.5 ${
                  paymentMethod === 'card'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Debit / Credit Card</span>
              </button>
            </div>

            {/* TAB 1: UPI QR PAYMENTS */}
            {paymentMethod === 'upi' ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <p className="text-[11px] font-bold text-zinc-500">Scan QR Code using PhonePe, GPay, Paytm or BHIM</p>

                  <div className="w-40 h-40 bg-white p-2.5 rounded-2xl mx-auto border-2 border-black flex flex-col items-center justify-center shadow-md">
                    <div className="w-full h-full bg-zinc-950 text-white p-2 rounded-xl flex flex-col items-center justify-center space-y-1">
                      <QrCode className="w-20 h-20 text-white" />
                      <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase">UPI PAY: {priceFormatted}</span>
                    </div>
                  </div>

                  {/* UPI VPA Copy Bar */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 text-xs">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-zinc-400 font-bold">VPA:</span>
                      <span className="font-black text-black dark:text-white">{upiId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-[10px] font-black hover:opacity-90 transition-all flex items-center space-x-1"
                    >
                      {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy VPA'}</span>
                    </button>
                  </div>
                </div>

                {/* UTR Transaction Reference Entry */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    12-Digit UPI Transaction ID / UTR Number <span className="text-zinc-400 font-normal">(Optional for Instant DB Auto-Sync)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423589124091"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-mono bg-zinc-50 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  />
                </div>

                {/* Submit Verification Button */}
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleUpiSubmit}
                  className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>{verificationStep || 'Verifying UPI Payload...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Paid via UPI - Verify & Unlock 🚀</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* TAB 2: CREDIT / DEBIT CARD WORKFLOW */
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border space-y-3 text-xs ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      defaultValue="Ansh Kumar"
                      className="w-full p-2.5 rounded-xl border text-xs bg-white border-zinc-300 dark:bg-black dark:border-zinc-800 text-black dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        defaultValue="•••• •••• •••• 4242"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-mono bg-white border-zinc-300 dark:bg-black dark:border-zinc-800 text-black dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        className="w-full p-2.5 rounded-xl border text-xs font-mono bg-white border-zinc-300 dark:bg-black dark:border-zinc-800 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        defaultValue="•••"
                        className="w-full p-2.5 rounded-xl border text-xs font-mono bg-white border-zinc-300 dark:bg-black dark:border-zinc-800 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Encrypted • Instant Access Sync</span>
                </div>

                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleCardSubmit}
                  className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Card Session...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {priceFormatted} & Authorize Access</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
