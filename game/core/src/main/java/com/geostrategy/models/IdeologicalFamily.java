package com.geostrategy.models;

/**
 * Top-level ideological family. Each country belongs to one family,
 * but has a national adaptation (e.g. "Dengismus", "Juche", "Bolivarismus")
 * that refines the gameplay mechanics.
 */
public enum IdeologicalFamily {

    // Liberal-demokratische Tradition
    LIBERAL_DEMOCRACY("Liberale Demokratie"),
    SOCIAL_DEMOCRACY("Sozialdemokratie"),
    CHRISTIAN_DEMOCRACY("Christdemokratie"),
    ILLIBERAL_DEMOCRACY("Illiberale Demokratie"),
    REPRESENTATIVE_MONARCHY("Repräsentative Monarchie"),

    // Autoritär-nationalistische Tradition
    NATIONALIST_AUTHORITARIANISM("Autoritärer Nationalismus"),
    MILITARY_JUNTA("Militärjunta"),
    FASCISM("Faschismus"),
    TECHNOCRACY("Technokratie"),

    // ML-Tradition
    MARXIST_LENINIST("Marxismus-Leninismus"),
    MARKET_SOCIALISM("Marktsozialismus (NEP-Modell)"),
    JUCHE("Juche"),

    // Islamische Tradition
    ISLAMIC_REPUBLIC("Islamische Republik"),
    THEOCRACY("Theokratie"),

    // Lateinamerikanisch-sozialistische Tradition
    BOLIVARIAN_SOCIALISM("Bolivarischer Sozialismus"),

    // Sonstige
    FAILING_STATE("Failing State"),
    TRIBAL_GOVERNANCE("Tribale Governance");

    public final String displayName;

    IdeologicalFamily(String displayName) {
        this.displayName = displayName;
    }
}
