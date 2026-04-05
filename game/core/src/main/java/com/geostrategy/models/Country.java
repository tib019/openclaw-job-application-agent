package com.geostrategy.models;

import java.util.ArrayList;
import java.util.List;

/**
 * Central game entity representing a nation-state.
 *
 * Separates WHAT a country is (political system, ideology)
 * from WHERE it aligns (geopolitical spectrum)
 * from HOW it operates (economy, military, mechanics).
 */
public class Country {

    // --- Identity ---
    public String id;           // ISO-3 code: "USA", "RUS", "CHN"
    public String name;         // Short name: "USA", "Russland"
    public String fullName;     // Full official name
    public String capitalCity;
    public long   population;
    public String flagColor;    // hex color for map rendering

    // --- Map position (normalized 0.0–1.0 of screen) ---
    public float mapX;
    public float mapY;
    public float mapW;
    public float mapH;

    // --- Core systems ---
    public PoliticalSystem      politics;
    public GeopoliticalAlignment alignment;
    public Economy              economy;
    public Military             military;

    // --- Dynamic state ---
    public int    stabilityPoints;     // 0–100, affects events + AI behavior
    public int    legitimacy;          // 0–100, government support
    public boolean isPlayerControlled;
    public List<String> activeEvents;  // event IDs currently running

    // --- Relations: countryId -> relation score (-100 to +100) ---
    public java.util.Map<String, Integer> relations;

    // --- Focus tree ---
    public String  activeFocusId;      // current national focus being researched
    public int     focusProgressDays;  // days accumulated on current focus

    public Country() {
        this.activeEvents = new ArrayList<>();
        this.relations    = new java.util.HashMap<>();
    }

    /** Global power score for rankings. */
    public int globalPowerScore() {
        double econScore = Math.log10(Math.max(1, economy.gdpBillions)) * 10;
        double milScore  = military.powerIndex();
        double popScore  = Math.log10(Math.max(1, population / 1_000_000.0)) * 5;
        return (int) Math.min(100, (econScore + milScore + popScore) / 3.0);
    }

    public void adjustRelation(String countryId, int delta) {
        int current = relations.getOrDefault(countryId, 0);
        relations.put(countryId, Math.max(-100, Math.min(100, current + delta)));
    }

    @Override
    public String toString() {
        return String.format("[%s] %s | %s | %s | Pop: %,d",
            id, name, politics, alignment.primaryLabel(), population);
    }
}
