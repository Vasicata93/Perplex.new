
import { db, STORES } from './db';
import { PortfolioAsset, PortfolioData, PortfolioTransaction, PortfolioSettings } from '../types';

export class PortfolioService {
    private static readonly ASSETS_KEY = 'portfolio_assets';
    private static readonly PERFORMANCE_KEY = 'portfolio_performance';
    private static readonly TRANSACTIONS_KEY = 'portfolio_transactions';
    private static readonly SETTINGS_KEY = 'portfolio_settings';

    static async getAssets(): Promise<PortfolioAsset[]> {
        const assets = await db.get<PortfolioAsset[]>(STORES.PORTFOLIO, this.ASSETS_KEY);
        return assets || [];
    }

    static async saveAssets(assets: PortfolioAsset[]): Promise<void> {
        await db.set(STORES.PORTFOLIO, this.ASSETS_KEY, assets);
    }

    static async addAsset(asset: PortfolioAsset): Promise<void> {
        const assets = await this.getAssets();
        assets.push(asset);
        await this.saveAssets(assets);
        
        // Add initial transaction
        if (asset.quantity && asset.purchasePrice) {
            await this.addTransaction({
                id: Math.random().toString(36).substring(2, 11),
                assetId: asset.id,
                assetTicker: asset.ticker,
                type: 'buy',
                quantity: asset.quantity,
                price: asset.purchasePrice,
                date: Date.now(),
                total: asset.quantity * asset.purchasePrice
            });
        }
    }

    static async updateAsset(id: string, updates: Partial<PortfolioAsset>): Promise<void> {
        const assets = await this.getAssets();
        const index = assets.findIndex(a => a.id === id);
        if (index !== -1) {
            assets[index] = { ...assets[index], ...updates };
            await this.saveAssets(assets);
        }
    }

    static async deleteAsset(id: string): Promise<void> {
        const assets = await this.getAssets();
        const filtered = assets.filter(a => a.id !== id);
        await this.saveAssets(filtered);
    }

    static async getPerformanceData(): Promise<{ month: string; value: number }[]> {
        const data = await db.get<{ month: string; value: number }[]>(STORES.PORTFOLIO, this.PERFORMANCE_KEY);
        return data || [];
    }

    static async savePerformanceData(data: { month: string; value: number }[]): Promise<void> {
        await db.set(STORES.PORTFOLIO, this.PERFORMANCE_KEY, data);
    }

    static async getTransactions(): Promise<PortfolioTransaction[]> {
        const data = await db.get<PortfolioTransaction[]>(STORES.PORTFOLIO, this.TRANSACTIONS_KEY);
        return data || [];
    }

    static async addTransaction(transaction: PortfolioTransaction): Promise<void> {
        const data = await this.getTransactions();
        data.unshift(transaction);
        await db.set(STORES.PORTFOLIO, this.TRANSACTIONS_KEY, data);
    }

    static async getSettings(): Promise<PortfolioSettings> {
        const data = await db.get<PortfolioSettings>(STORES.PORTFOLIO, this.SETTINGS_KEY);
        return data || {
            currency: 'EUR',
            riskTolerance: 'moderate',
            benchmark: 'S&P 500',
            notifications: true
        };
    }

    static async saveSettings(settings: PortfolioSettings): Promise<void> {
        await db.set(STORES.PORTFOLIO, this.SETTINGS_KEY, settings);
    }
}
