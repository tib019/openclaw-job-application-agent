package com.geostrategy.engine;

import com.geostrategy.models.Country;
import com.geostrategy.models.GameEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * Processes one monthly turn:
 *  1. Advance date
 *  2. Economy tick (all countries)
 *  3. Check and fire events
 *  4. AI decisions for non-player countries
 *  5. Relation drift
 */
public class TurnSystem {

    private final GameState state;
    private final List<TurnListener> listeners = new ArrayList<>();

    public TurnSystem(GameState state) {
        this.state = state;
    }

    public void addListener(TurnListener l) {
        listeners.add(l);
    }

    /** Process one full monthly turn. Returns events that fired. */
    public List<GameEvent> processTurn() {
        state.turnNumber++;
        state.currentDate = state.currentDate.nextMonth();

        // 1. Economy tick
        for (Country c : state.allCountries()) {
            c.economy.applyMonthlyTick();
            applyStabilityDrift(c);
        }

        // 2. Check historical/triggered events
        List<GameEvent> firedEvents = checkEvents();

        // 3. Simple AI relation drift
        applyRelationDrift();

        // 4. Global flags check
        checkGlobalFlags();

        // Notify listeners
        for (TurnListener l : listeners) {
            l.onTurnProcessed(state, firedEvents);
        }

        return firedEvents;
    }

    private void applyStabilityDrift(Country c) {
        // Stability slowly recovers toward equilibrium based on legitimacy
        int target = c.legitimacy;
        int current = c.stabilityPoints;
        if (current < target) {
            c.stabilityPoints = Math.min(target, current + 1);
        } else if (current > target + 10) {
            c.stabilityPoints = Math.max(target, current - 1);
        }
        // High repression slowly erodes legitimacy
        if (c.politics.mechanics.repression > 70) {
            c.legitimacy = Math.max(0, c.legitimacy - 1);
        }
        // Economic growth improves legitimacy
        if (c.economy.growthRateAnnual > 4.0) {
            c.legitimacy = Math.min(100, c.legitimacy + 1);
        } else if (c.economy.growthRateAnnual < -1.0) {
            c.legitimacy = Math.max(0, c.legitimacy - 2);
        }
    }

    private List<GameEvent> checkEvents() {
        List<GameEvent> fired = new ArrayList<>();
        for (GameEvent e : state.getEventsForCurrentDate()) {
            e.fired = true;
            state.eventHistory.add(e);
            fired.add(e);
        }
        state.pendingEvents.removeIf(e -> e.fired);
        return fired;
    }

    private void applyRelationDrift() {
        // Allies slowly get closer, enemies drift further — very simple model
        for (Country c : state.allCountries()) {
            c.relations.replaceAll((otherId, score) -> {
                Country other = state.getCountry(otherId);
                if (other == null) return score;
                int drift = computeNaturalDrift(c, other);
                return Math.max(-100, Math.min(100, score + drift));
            });
        }
    }

    private int computeNaturalDrift(Country a, Country b) {
        // Same ideological family → slight positive drift
        if (a.politics.family == b.politics.family) return 1;
        // Opposite alignment poles → slight negative drift
        int aUs = a.alignment.usInfluence;
        int bRu = b.alignment.russiaInfluence;
        if (aUs > 70 && bRu > 70) return -1;
        return 0;
    }

    private void checkGlobalFlags() {
        int y = state.currentDate.year;
        int m = state.currentDate.month;
        if (y == 2001 && m == 9)  state.warOnTerrorActive   = true;
        if (y == 2008 && m == 9)  state.globalFinancialCrisis = true;
        if (y == 2009 && m == 3)  state.globalFinancialCrisis = false;
        if (y == 2020 && m == 3)  state.covidPandemic        = true;
        if (y == 2022 && m == 6)  state.covidPandemic        = false;
    }

    public interface TurnListener {
        void onTurnProcessed(GameState state, List<GameEvent> firedEvents);
    }
}
