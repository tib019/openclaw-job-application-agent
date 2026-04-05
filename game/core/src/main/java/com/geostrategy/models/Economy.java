package com.geostrategy.models;

/** Economic data for a country. GDP in billions USD. */
public class Economy {

    public double gdpBillions;
    public double gdpPerCapitaUSD;
    public int    industryLevel;    // 0–100
    public int    resourceLevel;    // 0–100 (oil, gas, minerals)
    public int    tradeOpenness;    // 0–100
    public int    militarySpendPct; // % of GDP

    // Derived / dynamic
    public double stabilityIndex;  // 0.0–1.0, affects growth
    public double growthRateAnnual; // % per year

    public Economy() {}

    public Economy(double gdpBillions, double gdpPerCapitaUSD, int industryLevel,
                   int resourceLevel, int tradeOpenness, int militarySpendPct,
                   double stabilityIndex, double growthRateAnnual) {
        this.gdpBillions       = gdpBillions;
        this.gdpPerCapitaUSD   = gdpPerCapitaUSD;
        this.industryLevel     = industryLevel;
        this.resourceLevel     = resourceLevel;
        this.tradeOpenness     = tradeOpenness;
        this.militarySpendPct  = militarySpendPct;
        this.stabilityIndex    = stabilityIndex;
        this.growthRateAnnual  = growthRateAnnual;
    }

    /** Apply one month of economic growth/decline. */
    public void applyMonthlyTick() {
        double monthlyGrowth = (growthRateAnnual / 100.0) / 12.0;
        gdpBillions     *= (1.0 + monthlyGrowth * stabilityIndex);
        gdpPerCapitaUSD *= (1.0 + monthlyGrowth * stabilityIndex);
    }

    @Override
    public String toString() {
        return String.format("BIP: $%.0fMrd  Pro Kopf: $%.0f  Wachstum: %.1f%%",
            gdpBillions, gdpPerCapitaUSD, growthRateAnnual);
    }
}
