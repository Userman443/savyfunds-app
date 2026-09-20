import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthCheck {
  label: string;
  test: (password: string) => boolean;
}

const strengthChecks: StrengthCheck[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: 'Contains special character',
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
  {
    label: 'No common weak patterns',
    test: (password) => {
      const weakPatterns = [
        /123456/, /password/, /qwerty/, /admin/, /letmein/,
        /welcome/, /monkey/, /dragon/, /master/, /shadow/
      ];
      return !weakPatterns.some(pattern => pattern.test(password.toLowerCase()));
    },
  },
];

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const passedChecks = strengthChecks.filter(check => check.test(password));
  const strengthScore = passedChecks.length;
  
  const getStrengthLevel = () => {
    if (strengthScore <= 2) return { level: 'weak', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (strengthScore <= 4) return { level: 'fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (strengthScore === 5) return { level: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { level: 'strong', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const strength = getStrengthLevel();
  const progressWidth = (strengthScore / strengthChecks.length) * 100;

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={cn('text-sm font-medium capitalize', strength.color)}>
            {strength.level}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              strengthScore <= 2 && 'bg-red-500',
              strengthScore === 3 && 'bg-yellow-500',
              strengthScore === 4 && 'bg-yellow-500',
              strengthScore === 5 && 'bg-blue-500',
              strengthScore === 6 && 'bg-green-500'
            )}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className={cn('p-3 rounded-lg border', strength.bgColor)}>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements</h4>
        <div className="space-y-1">
          {strengthChecks.map((check, index) => {
            const isPassed = check.test(password);
            return (
              <div key={index} className="flex items-center space-x-2">
                {isPassed ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    isPassed ? 'text-green-700' : 'text-gray-600'
                  )}
                >
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Tips */}
      {strengthScore < 6 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Security Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use a mix of uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid personal information like names or birthdays</li>
            <li>• Consider using a passphrase with random words</li>
            <li>• Use a unique password for each account</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function getPasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  isValid: boolean;
} {
  const passedChecks = strengthChecks.filter(check => check.test(password));
  const score = passedChecks.length;
  
  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 2) level = 'weak';
  else if (score <= 4) level = 'fair';
  else if (score === 5) level = 'good';
  else level = 'strong';
  
  return {
    score,
    level,
    isValid: score === strengthChecks.length
  };
}