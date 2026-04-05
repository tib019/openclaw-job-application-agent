package com.geostrategy.models;

import java.util.List;

/**
 * One node in a national focus tree.
 * A focus takes N days to complete and unlocks effects + child focuses.
 */
public class FocusNode {

    public String       id;
    public String       title;
    public String       description;
    public int          daysToComplete;   // typically 70 (HoI4 standard)
    public List<String> prerequisites;   // IDs of focuses that must be completed first
    public List<GameEvent.EventEffect> effects;

    // UI position in focus tree (grid coords)
    public int gridX;
    public int gridY;

    // Runtime state
    public boolean completed;
    public boolean available; // prerequisites met?

    public FocusNode() {}

    @Override
    public String toString() {
        return "[" + id + "] " + title + " (" + daysToComplete + " Tage)";
    }
}
