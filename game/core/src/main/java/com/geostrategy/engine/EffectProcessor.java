package com.geostrategy.engine;

import com.geostrategy.models.Country;
import com.geostrategy.models.GameEvent;

import java.util.List;

/**
 * Applies EventEffect deltas to GameState.
 * Decouples effect resolution from UI and event loading.
 *
 * Field path format:
 *   "stability"                  → country.stabilityPoints
 *   "legitimacy"                 → country.legitimacy
 *   "mechanics.repression"       → country.politics.mechanics.repression
 *   "alignment.us"               → country.alignment.usInfluence
 *   "alignment.china"            → country.alignment.chinaInfluence
 *   "alignment.russia"           → country.alignment.russiaInfluence
 *   "alignment.eu"               → country.alignment.euInfluence
 *   "alignment.autonomy"         → country.alignment.autonomy
 *   "economy.gdpBillions"        → country.economy.gdpBillions += delta
 *   "economy.growthRateAnnual"   → country.economy.growthRateAnnual += delta*0.1
 *   "economy.tradeOpenness"      → country.economy.tradeOpenness += delta
 *   "military.armyStrength"      → country.military.armyStrength += delta
 *   "relation.XXX"               → country.adjustRelation("XXX", delta)
 */
public class EffectProcessor {

    private final GameState state;

    public EffectProcessor(GameState state) {
        this.state = state;
    }

    public void apply(String actorCountryId, List<GameEvent.EventEffect> effects) {
        if (effects == null) return;
        for (GameEvent.EventEffect eff : effects) {
            String targetId = eff.targetCountry.equals("self") ? actorCountryId : eff.targetCountry;
            Country target = state.getCountry(targetId);
            if (target == null) continue;
            applyField(target, eff.field, eff.delta);
        }
    }

    private void applyField(Country c, String field, int delta) {
        switch (field) {
            case "stability"  -> c.stabilityPoints = clamp(c.stabilityPoints + delta);
            case "legitimacy" -> c.legitimacy      = clamp(c.legitimacy      + delta);

            // Mechanics
            case "mechanics.marketFreedom"      -> c.politics.mechanics.shift("marketFreedom",      delta);
            case "mechanics.partyControl"       -> c.politics.mechanics.shift("partyControl",       delta);
            case "mechanics.repression"         -> c.politics.mechanics.shift("repression",         delta);
            case "mechanics.elections"          -> c.politics.mechanics.shift("elections",          delta);
            case "mechanics.pressFreedom"       -> c.politics.mechanics.shift("pressFreedom",       delta);
            case "mechanics.religiousInfluence" -> c.politics.mechanics.shift("religiousInfluence", delta);
            case "mechanics.corruptionLevel"    -> c.politics.mechanics.shift("corruptionLevel",    delta);
            case "mechanics.militaryInfluence"  -> c.politics.mechanics.shift("militaryInfluence",  delta);
            case "mechanics.nationalism"        -> c.politics.mechanics.shift("nationalism",        delta);

            // Alignment
            case "alignment.us"      -> c.alignment.shift("us",      delta);
            case "alignment.china"   -> c.alignment.shift("china",   delta);
            case "alignment.russia"  -> c.alignment.shift("russia",  delta);
            case "alignment.eu"      -> c.alignment.shift("eu",      delta);
            case "alignment.autonomy"-> c.alignment.shift("autonomy",delta);

            // Economy
            case "economy.gdpBillions"       -> c.economy.gdpBillions      += delta;
            case "economy.growthRateAnnual"  -> c.economy.growthRateAnnual  += delta * 0.1;
            case "economy.tradeOpenness"     -> c.economy.tradeOpenness     = clamp(c.economy.tradeOpenness + delta);
            case "economy.industryLevel"     -> c.economy.industryLevel     = clamp(c.economy.industryLevel + delta);
            case "economy.stabilityIndex"    -> c.economy.stabilityIndex    = Math.max(0.0, Math.min(1.0, c.economy.stabilityIndex + delta * 0.01));

            // Military
            case "military.armyStrength"   -> c.military.armyStrength   = clamp(c.military.armyStrength   + delta);
            case "military.navyStrength"   -> c.military.navyStrength   = clamp(c.military.navyStrength   + delta);
            case "military.airStrength"    -> c.military.airStrength    = clamp(c.military.airStrength    + delta);
            case "military.intelligenceRating" -> c.military.intelligenceRating = clamp(c.military.intelligenceRating + delta);
            case "military.cyberCapability"    -> c.military.cyberCapability    = clamp(c.military.cyberCapability    + delta);
            case "military.proxyWarfare"       -> c.military.proxyWarfare       = clamp(c.military.proxyWarfare       + delta);

            default -> {
                // relation.XXX
                if (field.startsWith("relation.")) {
                    String other = field.substring("relation.".length());
                    c.adjustRelation(other, delta);
                }
            }
        }
    }

    private static int clamp(int v) { return Math.max(0, Math.min(100, v)); }
}
