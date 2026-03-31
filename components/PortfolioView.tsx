
import React from 'react';
import { PortfolioDashboard } from './PortfolioDashboard';
import { PortfolioData } from '../types';

const mockData: PortfolioData = {
    totalValue: 1420500,
    ytdReturns: 12.4,
    lastMonthReturns: 4.2,
    volatility: 8.4,
    assets: [
        { id: '1', name: 'Apple Inc.', ticker: 'AAPL', type: 'stock', value: 142400, change: 0.4 },
        { id: '2', name: 'Microsoft Corp', ticker: 'MSFT', type: 'stock', value: 98210, change: 1.2 },
        { id: '3', name: 'Vanguard S&P 500', ticker: 'VUSA', type: 'etf', value: 210000, change: 2.1 },
        { id: '4', name: 'iShares Gold', ticker: 'GOLD', type: 'commodity', value: 122800, change: 0.0 },
        { id: '5', name: 'Bitcoin', ticker: 'BTC', type: 'crypto', value: 45200, change: 5.4 },
    ],
    strategies: [
        { id: '1', name: 'Momentum Alpha', status: 'active', description: 'Multi-factor trend following across global markets' },
        { id: '2', name: 'Yield Guardian', status: 'defensive', description: 'Income generation focus with capital protection' },
    ],
    riskScore: 64,
    riskProfile: [
        { category: 'Growth', value: 85 },
        { category: 'Value', value: 65 },
        { category: 'Income', value: 45 },
        { category: 'Safety', value: 70 },
        { category: 'Volatility', value: 30 },
    ],
    performance: [
        { month: 'Jul 23', value: 10000 },
        { month: 'Aug 23', value: 12000 },
        { month: 'Sep 23', value: 11000 },
        { month: 'Oct 23', value: 13000 },
        { month: 'Nov 23', value: 14000 },
        { month: 'Dec 23', value: 15000 },
        { month: 'Jan 24', value: 16000 },
        { month: 'Feb 24', value: 17000 },
        { month: 'Mar 24', value: 18000 },
        { month: 'Apr 24', value: 19000 },
        { month: 'May 24', value: 20000 },
        { month: 'Jun 24', value: 21000 },
    ]
};

export const PortfolioView: React.FC = () => {
    return <PortfolioDashboard data={mockData} />;
};
