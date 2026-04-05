package com.geostrategy.engine;

import com.geostrategy.models.Country;
import com.geostrategy.models.Military;

import java.util.Random;

/**
 * Handles covert operations: espionage, propaganda, destabilization, proxy warfare.
 *
 * Operations succeed probabilistically based on:
 *  - Actor's intelligenceRating vs. target's intelligenceRating
 *  - Operation cost (stability of actor)
 *  - Random factor
 */
public class EspionageSystem {

    private final GameState state;
    private final Random    rng;

    public EspionageSystem(GameState state) {
        this.state = state;
        this.rng   = new Random();
    }

    public enum Operation {
        GATHER_INTELLIGENCE("Geheimdienstaufklärung",        10, 5),
        PROPAGANDA_CAMPAIGN("Propagandakampagne",             20, 10),
        FUND_OPPOSITION    ("Opposition finanzieren",         30, 15),
        SUPPORT_COUP       ("Staatsstreich unterstützen",     50, 30),
        ASSASSINATE_LEADER ("Führungsperson eliminieren",     80, 50),
        ARM_PROXY          ("Proxy-Gruppe bewaffnen",         40, 20),
        CYBER_ATTACK       ("Cyberangriff",                   35, 15),
        ECONOMIC_SABOTAGE  ("Wirtschaftssabotage",            30, 20);

        public final String displayName;
        public final int    successThreshold; // base difficulty 0–100
        public final int    stabilityRiskIfFailed;

        Operation(String displayName, int successThreshold, int stabilityRiskIfFailed) {
            this.displayName           = displayName;
            this.successThreshold      = successThreshold;
            this.stabilityRiskIfFailed = stabilityRiskIfFailed;
        }
    }

    public OperationResult execute(String actorId, String targetId, Operation op) {
        Country actor  = state.getCountry(actorId);
        Country target = state.getCountry(targetId);
        if (actor == null || target == null) {
            return new OperationResult(false, "Ungültige Länder-IDs", 0);
        }

        Military actorMil  = actor.military;
        Military targetMil = target.military;

        // Success chance: actor intelligence - target counterintelligence + random
        int actorSkill  = actorMil.intelligenceRating;
        int targetSkill = targetMil.intelligenceRating;
        int roll        = rng.nextInt(100);
        int score       = actorSkill - (targetSkill / 2) + roll - op.successThreshold;

        if (score >= 0) {
            applySuccess(actor, target, op);
            return new OperationResult(true,
                "Operation erfolgreich: " + op.displayName, score);
        } else {
            applyFailure(actor, target, op, Math.abs(score));
            return new OperationResult(false,
                "Operation fehlgeschlagen: " + op.displayName +
                (Math.abs(score) > 30 ? " (aufgedeckt!)" : ""), score);
        }
    }

    private void applySuccess(Country actor, Country target, Operation op) {
        switch (op) {
            case GATHER_INTELLIGENCE -> { /* reveal target data to player — UI layer handles */ }
            case PROPAGANDA_CAMPAIGN -> {
                target.alignment.shift("us",
                    actor.alignment.usInfluence > 50 ? 5 : -5);
                target.legitimacy = Math.max(0, target.legitimacy - 3);
            }
            case FUND_OPPOSITION -> {
                target.stabilityPoints = Math.max(0, target.stabilityPoints - 8);
                target.legitimacy      = Math.max(0, target.legitimacy - 5);
            }
            case SUPPORT_COUP -> {
                target.stabilityPoints = Math.max(0, target.stabilityPoints - 25);
                target.legitimacy      = Math.max(0, target.legitimacy - 20);
                // Full coup resolution handled by EventSystem
            }
            case ARM_PROXY -> {
                target.military.guerrillaCapability =
                    Math.min(100, target.military.guerrillaCapability + 10);
                target.stabilityPoints = Math.max(0, target.stabilityPoints - 5);
            }
            case CYBER_ATTACK -> {
                target.economy.stabilityIndex = Math.max(0.1,
                    target.economy.stabilityIndex - 0.05);
            }
            case ECONOMIC_SABOTAGE -> {
                target.economy.gdpBillions *= 0.97;
                target.economy.stabilityIndex = Math.max(0.1,
                    target.economy.stabilityIndex - 0.03);
            }
            case ASSASSINATE_LEADER -> {
                target.stabilityPoints = Math.max(0, target.stabilityPoints - 30);
                target.legitimacy      = Math.max(0, target.legitimacy - 15);
            }
        }
    }

    private void applyFailure(Country actor, Country target, Operation op, int severity) {
        // Actor loses stability, relations drop
        actor.stabilityPoints = Math.max(0,
            actor.stabilityPoints - op.stabilityRiskIfFailed / 2);
        if (severity > 30) {
            // Exposed — relation damage
            actor.adjustRelation(target.id, -15);
            target.adjustRelation(actor.id, -15);
        }
    }

    public record OperationResult(boolean success, String message, int score) {}
}
