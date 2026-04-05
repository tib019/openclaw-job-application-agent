package com.geostrategy.models;

/**
 * Geopolitical alignment as independent spectrum axes (NOT mutually exclusive).
 * India can have high US-influence AND high autonomy AND moderate Russia-influence.
 *
 * Values 0–100 per axis. Sum may exceed 100.
 */
public class GeopoliticalAlignment {

    public int usInfluence;      // Nähe zu USA / westlichem Block
    public int chinaInfluence;   // Nähe zu China
    public int russiaInfluence;  // Nähe zu Russland
    public int euInfluence;      // Nähe zur EU (kann von US-Nähe divergieren: Ungarn)
    public int autonomy;         // Eigenständigkeit / Non-Alignment

    public GeopoliticalAlignment() {}

    public GeopoliticalAlignment(int usInfluence, int chinaInfluence,
                                  int russiaInfluence, int euInfluence, int autonomy) {
        this.usInfluence     = clamp(usInfluence);
        this.chinaInfluence  = clamp(chinaInfluence);
        this.russiaInfluence = clamp(russiaInfluence);
        this.euInfluence     = clamp(euInfluence);
        this.autonomy        = clamp(autonomy);
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    public void shift(String axis, int delta) {
        switch (axis) {
            case "us"      -> usInfluence     = clamp(usInfluence     + delta);
            case "china"   -> chinaInfluence  = clamp(chinaInfluence  + delta);
            case "russia"  -> russiaInfluence = clamp(russiaInfluence + delta);
            case "eu"      -> euInfluence     = clamp(euInfluence     + delta);
            case "autonomy"-> autonomy        = clamp(autonomy        + delta);
        }
    }

    /** Primary alignment label for UI display */
    public String primaryLabel() {
        int max = Math.max(Math.max(usInfluence, chinaInfluence),
                           Math.max(russiaInfluence, autonomy));
        if (max == autonomy && autonomy > 50) return "Non-Aligned";
        if (max == usInfluence)              return "US-orientiert";
        if (max == chinaInfluence)           return "China-orientiert";
        if (max == russiaInfluence)          return "Russland-orientiert";
        return "Ungebunden";
    }

    @Override
    public String toString() {
        return String.format("USA:%d  China:%d  Russland:%d  EU:%d  Autonomie:%d",
            usInfluence, chinaInfluence, russiaInfluence, euInfluence, autonomy);
    }
}
