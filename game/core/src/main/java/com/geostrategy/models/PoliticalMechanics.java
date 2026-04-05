package com.geostrategy.models;

/**
 * Numerical gameplay values that define HOW a country actually operates.
 * All values 0–100. These drive game mechanics, NOT the ideological label.
 *
 * Example: China and Vietnam both have MARKET_SOCIALISM as family,
 * but differ significantly in militaryInfluence, corruptionLevel, etc.
 */
public class PoliticalMechanics {

    /** How freely markets operate. 0 = full command economy, 100 = laissez-faire */
    public int marketFreedom;

    /** Degree of single-party or executive control. 0 = pluralist, 100 = total party */
    public int partyControl;

    /** Political repression of opposition. 0 = free, 100 = totalitarian */
    public int repression;

    /** Quality and freedom of elections. 0 = none, 100 = fully free */
    public int elections;

    /** Press and media freedom. 0 = state-controlled, 100 = fully free */
    public int pressFreedom;

    /** Degree of religious influence on law/policy. 0 = secular, 100 = theocratic */
    public int religiousInfluence;

    /** Perceived corruption level. 0 = clean, 100 = deeply corrupt */
    public int corruptionLevel;

    /** Military influence over civilian politics. 0 = civilian, 100 = military rules */
    public int militaryInfluence;

    /** Nationalism / xenophobia intensity. 0 = cosmopolitan, 100 = extreme nationalist */
    public int nationalism;

    public PoliticalMechanics() {}

    public PoliticalMechanics(int marketFreedom, int partyControl, int repression,
                               int elections, int pressFreedom, int religiousInfluence,
                               int corruptionLevel, int militaryInfluence, int nationalism) {
        this.marketFreedom     = clamp(marketFreedom);
        this.partyControl      = clamp(partyControl);
        this.repression        = clamp(repression);
        this.elections         = clamp(elections);
        this.pressFreedom      = clamp(pressFreedom);
        this.religiousInfluence = clamp(religiousInfluence);
        this.corruptionLevel   = clamp(corruptionLevel);
        this.militaryInfluence = clamp(militaryInfluence);
        this.nationalism       = clamp(nationalism);
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }

    /** Shift a value by delta, clamped to [0,100]. */
    public void shift(String field, int delta) {
        switch (field) {
            case "marketFreedom"      -> marketFreedom      = clamp(marketFreedom      + delta);
            case "partyControl"       -> partyControl       = clamp(partyControl       + delta);
            case "repression"         -> repression         = clamp(repression         + delta);
            case "elections"          -> elections          = clamp(elections          + delta);
            case "pressFreedom"       -> pressFreedom       = clamp(pressFreedom       + delta);
            case "religiousInfluence" -> religiousInfluence = clamp(religiousInfluence + delta);
            case "corruptionLevel"    -> corruptionLevel    = clamp(corruptionLevel    + delta);
            case "militaryInfluence"  -> militaryInfluence  = clamp(militaryInfluence  + delta);
            case "nationalism"        -> nationalism        = clamp(nationalism        + delta);
        }
    }

    @Override
    public String toString() {
        return String.format(
            "Markt:%d  Partei:%d  Repression:%d  Wahlen:%d  Presse:%d  Religion:%d  Korruption:%d  Militär:%d  Nationalismus:%d",
            marketFreedom, partyControl, repression, elections,
            pressFreedom, religiousInfluence, corruptionLevel, militaryInfluence, nationalism
        );
    }
}
