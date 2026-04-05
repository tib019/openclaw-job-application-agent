package com.geostrategy.models;

/**
 * A country's political system consists of three layers:
 *  1. IdeologicalFamily   – broad tradition (ML, Liberal-democratic, Islamic, ...)
 *  2. nationalAdaptation  – concrete national form ("Dengismus", "Juche", "Thatcherismus", ...)
 *  3. PoliticalMechanics  – numerical values driving game mechanics
 */
public class PoliticalSystem {

    public IdeologicalFamily family;
    public String nationalAdaptation;
    public PoliticalMechanics mechanics;

    public PoliticalSystem() {
        this.mechanics = new PoliticalMechanics();
    }

    public PoliticalSystem(IdeologicalFamily family,
                           String nationalAdaptation,
                           PoliticalMechanics mechanics) {
        this.family            = family;
        this.nationalAdaptation = nationalAdaptation;
        this.mechanics         = mechanics;
    }

    @Override
    public String toString() {
        return family.displayName + " (" + nationalAdaptation + ")";
    }
}
