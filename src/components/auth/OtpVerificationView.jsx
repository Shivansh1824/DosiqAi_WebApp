import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DosiqLogo } from '../common/DosiqLogo';

export const OtpVerificationView = ({ email, fullName, onBackToSignIn, onSuccess }) => {
  const { verifyOtp, resendOtp } = useAuth();
  
  // Default to 6 digits (standard Supabase), but support 8 digits automatically if pasted or toggled
  const [numDigits, setNumDigits] = useState(6);
  const [otpValues, setOtpValues] = useState(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [alert, setAlert] = useState(null);

  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [numDigits]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, val) => {
    // Only accept numeric digits
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal && val !== '') return;

    const newOtp = [...otpValues];
    newOtp[index] = cleanVal.slice(-1); // Take last character entered
    setOtpValues(newOtp);
    setAlert(null);

    // Auto-advance to next input
    if (cleanVal && index < numDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        // Move to previous input and clear it
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < numDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    // Detect if pasted token is 8 digits or 6 digits
    const targetLength = pastedData.length === 8 ? 8 : 6;
    if (targetLength !== numDigits) {
      setNumDigits(targetLength);
    }

    const digits = pastedData.slice(0, targetLength).split('');
    const newOtp = Array(targetLength).fill('');
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtpValues(newOtp);

    // Focus last filled index or submit if full
    const nextIdx = Math.min(digits.length, targetLength - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  const toggleDigitCount = () => {
    const nextCount = numDigits === 6 ? 8 : 6;
    setNumDigits(nextCount);
    setOtpValues(Array(nextCount).fill(''));
    setAlert(null);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const token = otpValues.join('').trim();

    if (token.length !== numDigits) {
      setAlert({
        type: 'error',
        message: `Please enter all ${numDigits} digits of the verification code.`,
      });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      await verifyOtp(email, token, 'signup');
      setAlert({
        type: 'success',
        message: 'Account verified successfully! Entering your vault...',
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('OTP verification error:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Invalid or expired verification code. Please check and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setAlert(null);

    try {
      await resendOtp(email, 'signup');
      setAlert({
        type: 'success',
        message: `New verification code sent to ${email}.`,
      });
      setResendCooldown(60);
      setOtpValues(Array(numDigits).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Could not resend verification code. Please wait a moment.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-200 relative overflow-hidden text-center">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Envelope icon & Header */}
        <div className="mb-5 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-sm mb-3.5">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Verify Your Account</h3>
          <div className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-[300px]">
            <span>We sent a {numDigits}-digit confirmation code to</span>
            <span className="block mt-1 font-semibold text-slate-850 text-xs sm:text-sm tracking-tight text-slate-800 break-all">
              {email}
            </span>
          </div>
        </div>

        {/* Alert message */}
        {alert && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs text-left ${
              alert.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {alert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{alert.message}</span>
          </div>
        )}

        {/* OTP Input Fields */}
        <form onSubmit={handleVerify}>
          <div
            className="flex justify-center items-center gap-2 sm:gap-2.5 my-5"
            onPaste={handlePaste}
          >
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={val}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoComplete="one-time-code"
                className={`w-10 sm:w-11 h-12 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl border bg-slate-50/70 text-slate-900 focus:bg-white focus:outline-none transition-all duration-150 shadow-sm ${
                  val
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
                }`}
              />
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || otpValues.join('').length !== numDigits}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify &amp; Sign In</span>
            )}
          </button>
        </form>

        {/* Resend & format toggle options */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Didn't get the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="font-semibold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {resendLoading
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Code'}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <button
              type="button"
              onClick={toggleDigitCount}
              className="text-slate-500 hover:text-slate-700 underline transition-colors"
            >
              Switch to {numDigits === 6 ? '8-digit' : '6-digit'} code
            </button>

            <button
              type="button"
              onClick={onBackToSignIn}
              className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
