package com.geostrategy.engine;

import com.geostrategy.models.Country;
import com.geostrategy.models.FocusTree;
import com.geostrategy.models.GameEvent;

import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Basic AI for non-player countries.
 *
 * Each turn the AI:
 *  1. Picks an event option based on ideological bias
 *  2. Advances active focus
 *  3. Makes simple diplomatic moves
 */
public class AISystem {

    private final GameState       state;
    private final EffectProcessor effects;
    private final Random          rng;

    // Focus trees for AI countries
    private final Map<String, FocusTree> focusTrees;

    public AISystem(GameState state, Map<String, FocusTree> focusTrees) {
        this.state      = state;
        this.effects    = new EffectProcessor(state);
        this.focusTrees = focusTrees;
        this.rng        = new Random();
    }

    /** Called every turn for each non-player country. */
    public void processTurn(Country country) {
        advanceFocus(country);
        considerDiplomacy(country);
    }

    /** Handle an event on behalf of the AI country — picks best option. */
    public GameEvent.EventOption resolveEvent(Country country, GameEvent event) {
        if (event.options == null || event.options.isEmpty()) return null;
        // AI picks option 0 = historical/default for historical events
        if (event.isHistorical) return event.options.get(0);
        // Otherwise pick based on ideology bias
        return pickOptionByBias(country, event);
    }

    private GameEvent.EventOption pickOptionByBias(Country country, GameEvent event) {
        // High nationalism/authoritarianism → prefer more aggressive options
        int aggression = (country.politics.mechanics.nationalism
            + country.politics.mechanics.militaryInfluence) / 2;
        if (aggression > 60 && event.options.size() > 1) {
            return event.options.get(event.options.size() - 1);
        }
        return event.options.get(0);
    }

    private void advanceFocus(Country country) {
        FocusTree tree = focusTrees.get(country.id);
        if (tree == null || country.activeFocusId == null) {
            // Pick a focus if none active
            if (tree != null) {
                List<com.geostrategy.models.FocusNode> available = tree.getAvailable();
                if (!available.isEmpty()) {
                    country.activeFocusId      = available.get(0).id;
                    country.focusProgressDays  = 0;
                }
            }
            return;
        }

        // Advance progress (30 game-days per turn = monthly)
        country.focusProgressDays += 30;
        com.geostrategy.models.FocusNode active = tree.get(country.activeFocusId);
        if (active != null && country.focusProgressDays >= active.daysToComplete) {
            com.geostrategy.models.FocusNode completed = tree.complete(country.activeFocusId);
            if (completed != null && completed.effects != null) {
                effects.apply(country.id, completed.effects);
            }
            country.activeFocusId     = null;
            country.focusProgressDays = 0;
        }
    }

    private void considerDiplomacy(Country country) {
        // Simple: high-US countries get slightly closer to each other
        if (country.alignment.usInfluence > 70) {
            for (Country other : state.allCountries()) {
                if (!other.id.equals(country.id) && other.alignment.usInfluence > 70) {
                    country.adjustRelation(other.id, 1);
                }
            }
        }
        // High-Russia + high-China → BRICS-like drift
        if (country.alignment.russiaInfluence > 60 && country.alignment.chinaInfluence > 40) {
            for (Country other : state.allCountries()) {
                if (!other.id.equals(country.id)
                    && other.alignment.russiaInfluence > 50
                    && other.alignment.chinaInfluence > 40) {
                    country.adjustRelation(other.id, 1);
                }
            }
        }
    }
}
