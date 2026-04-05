package com.geostrategy.models;

/** Military capabilities of a country. */
public class Military {

    public int armyStrength;     // 0–100 (manpower + equipment + training)
    public int navyStrength;     // 0–100
    public int airStrength;      // 0–100
    public int intelligenceRating; // 0–100 (espionage capability)
    public int cyberCapability;  // 0–100

    public boolean nuclearCapable;
    public int     nuclearWarheads; // 0 = none

    // Covert / asymmetric capabilities
    public int guerrillaCapability;   // 0–100
    public int propagandaReach;       // 0–100 (foreign political influence)
    public int proxyWarfare;          // 0–100 (ability to arm/fund proxies)

    // Active operations (set dynamically by game engine)
    public boolean atWar;
    public String  activeConflict; // null if at peace

    public Military() {}

    public Military(int armyStrength, int navyStrength, int airStrength,
                    int intelligenceRating, int cyberCapability,
                    boolean nuclearCapable, int nuclearWarheads,
                    int guerrillaCapability, int propagandaReach, int proxyWarfare) {
        this.armyStrength        = armyStrength;
        this.navyStrength        = navyStrength;
        this.airStrength         = airStrength;
        this.intelligenceRating  = intelligenceRating;
        this.cyberCapability     = cyberCapability;
        this.nuclearCapable      = nuclearCapable;
        this.nuclearWarheads     = nuclearWarheads;
        this.guerrillaCapability = guerrillaCapability;
        this.propagandaReach     = propagandaReach;
        this.proxyWarfare        = proxyWarfare;
        this.atWar               = false;
        this.activeConflict      = null;
    }

    /** Overall military power index (simplified). */
    public int powerIndex() {
        int base = (armyStrength + navyStrength + airStrength) / 3;
        int bonus = (intelligenceRating + cyberCapability) / 5;
        int nuclear = nuclearCapable ? 20 : 0;
        return Math.min(100, base + bonus + nuclear);
    }

    @Override
    public String toString() {
        return String.format("Land:%d  See:%d  Luft:%d  Geheimdienst:%d  Cyber:%d  Nuklear:%s(%d)",
            armyStrength, navyStrength, airStrength, intelligenceRating,
            cyberCapability, nuclearCapable ? "ja" : "nein", nuclearWarheads);
    }
}
