import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
};

const CURRENCY_KEY = 'resellr_currency';

interface CurrencyContextType {
  currency: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amount: number, showSign?: boolean) => string;
  formatAmountCompact: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(CURRENCIES.USD);

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY).then((code) => {
      if (code && CURRENCIES[code as CurrencyCode]) {
        setCurrencyState(CURRENCIES[code as CurrencyCode]);
      }
    });
  }, []);

  const setCurrency = async (code: CurrencyCode) => {
    await AsyncStorage.setItem(CURRENCY_KEY, code);
    setCurrencyState(CURRENCIES[code]);
  };

  const formatAmount = (amount: number, showSign = false): string => {
    const absAmount = Math.abs(amount);
    const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : (amount < 0 ? '-' : '');
    
    // Format with space between symbol and number
    if (currency.code === 'JPY') {
      return `${sign}${currency.symbol} ${Math.round(absAmount).toLocaleString()}`;
    }
    const hasFraction = Math.abs(absAmount % 1) > 0;
    return `${sign}${currency.symbol} ${absAmount.toLocaleString(undefined, {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 2,
    })}`;
  };

  const formatAmountCompact = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
      return `${currency.symbol} ${(absAmount / 1000).toFixed(1)}k`;
    }
    return formatAmount(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, formatAmountCompact }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

// Standalone formatter for use outside React components
export function formatCurrency(amount: number, symbol = '$', showSign = false): string {
  const absAmount = Math.abs(amount);
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : (amount < 0 ? '-' : '');
  const hasFraction = Math.abs(absAmount % 1) > 0;
  return `${sign}${symbol} ${absAmount.toLocaleString(undefined, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 2,
  })}`;
}
