package com.geostrategy.engine;

import com.geostrategy.models.Country;
import com.geostrategy.models.GameEvent;

import java.util.*;

/**
 * Central game state — single source of truth.
 * Passed to all systems; never duplicated.
 */
public class GameState {

    public GameDate currentDate;
    public Map<String, Country> countries;  // id -> Country
    public List<GameEvent>      pendingEvents;
    public List<GameEvent>      eventHistory;
    public String               playerCountryId;

    // Turn counter
    public int turnNumber;

    // Global flags (affect world dynamics)
    public boolean warOnTerrorActive;
    public boolean globalFinancialCrisis;
    public boolean covidPandemic;

    public GameState() {
        this.currentDate   = GameDate.start();
        this.countries     = new LinkedHashMap<>();
        this.pendingEvents = new ArrayList<>();
        this.eventHistory  = new ArrayList<>();
        this.turnNumber    = 0;
    }

    public Country getCountry(String id) {
        return countries.get(id);
    }

    public Country getPlayerCountry() {
        return countries.get(playerCountryId);
    }

    public void addCountry(Country c) {
        countries.put(c.id, c);
    }

    public List<Country> allCountries() {
        return new ArrayList<>(countries.values());
    }

    /** Returns events that should fire on the current date. */
    public List<GameEvent> getEventsForCurrentDate() {
        List<GameEvent> due = new ArrayList<>();
        for (GameEvent e : pendingEvents) {
            if (e.fired) continue;
            if (e.triggerYear == currentDate.year &&
                (e.triggerMonth == 0 || e.triggerMonth == currentDate.month)) {
                due.add(e);
            }
        }
        return due;
    }
}
