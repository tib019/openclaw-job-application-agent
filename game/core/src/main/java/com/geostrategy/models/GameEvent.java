package com.geostrategy.models;

import java.util.List;

/**
 * A historical or dynamic event that fires under certain conditions.
 * Events can be scripted (historical) or procedurally generated.
 */
public class GameEvent {

    public String id;
    public String title;
    public String description;
    public String targetCountryId;  // which country this fires for
    public EventType type;

    public List<EventOption> options; // player choices (or AI picks weighted)

    // Trigger conditions (simplified for Phase 1)
    public int     triggerYear;
    public int     triggerMonth;  // 0 = any month
    public String  triggerCondition; // e.g. "stabilityPoints < 30"

    public boolean fired;
    public boolean isHistorical;

    public enum EventType {
        POLITICAL,
        MILITARY,
        ECONOMIC,
        ESPIONAGE,
        DIPLOMATIC,
        DISASTER
    }

    public static class EventOption {
        public String id;
        public String text;
        public List<EventEffect> effects;
    }

    public static class EventEffect {
        public String targetCountry;  // "self" or country ID
        public String field;          // e.g. "stability", "alignment.us", "mechanics.repression"
        public int    delta;
        public String description;
    }
}
