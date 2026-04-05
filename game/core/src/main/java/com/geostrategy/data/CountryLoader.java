package com.geostrategy.data;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.geostrategy.models.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Loads country data from assets/data/countries.json.
 * Uses LibGDX's built-in JSON parser (no external dependency needed for parsing).
 */
public class CountryLoader {

    public List<Country> loadAll() {
        List<Country> result = new ArrayList<>();
        JsonReader reader = new JsonReader();
        JsonValue root = reader.parse(Gdx.files.internal("data/countries.json"));

        for (JsonValue node : root) {
            result.add(parseCountry(node));
        }
        return result;
    }

    private Country parseCountry(JsonValue n) {
        Country c = new Country();

        c.id         = n.getString("id");
        c.name       = n.getString("name");
        c.fullName   = n.getString("fullName");
        c.capitalCity = n.getString("capitalCity");
        c.population = n.getLong("population");
        c.flagColor  = n.getString("flagColor");

        c.mapX = n.getFloat("mapX");
        c.mapY = n.getFloat("mapY");
        c.mapW = n.getFloat("mapW");
        c.mapH = n.getFloat("mapH");

        c.stabilityPoints = n.getInt("stabilityPoints");
        c.legitimacy      = n.getInt("legitimacy");

        c.politics  = parsePolitics(n.get("politics"));
        c.alignment = parseAlignment(n.get("alignment"));
        c.economy   = parseEconomy(n.get("economy"));
        c.military  = parseMilitary(n.get("military"));

        return c;
    }

    private PoliticalSystem parsePolitics(JsonValue n) {
        PoliticalSystem ps = new PoliticalSystem();
        ps.family            = IdeologicalFamily.valueOf(n.getString("family"));
        ps.nationalAdaptation = n.getString("nationalAdaptation");

        JsonValue m = n.get("mechanics");
        ps.mechanics = new PoliticalMechanics(
            m.getInt("marketFreedom"),
            m.getInt("partyControl"),
            m.getInt("repression"),
            m.getInt("elections"),
            m.getInt("pressFreedom"),
            m.getInt("religiousInfluence"),
            m.getInt("corruptionLevel"),
            m.getInt("militaryInfluence"),
            m.getInt("nationalism")
        );
        return ps;
    }

    private GeopoliticalAlignment parseAlignment(JsonValue n) {
        return new GeopoliticalAlignment(
            n.getInt("usInfluence"),
            n.getInt("chinaInfluence"),
            n.getInt("russiaInfluence"),
            n.getInt("euInfluence"),
            n.getInt("autonomy")
        );
    }

    private Economy parseEconomy(JsonValue n) {
        return new Economy(
            n.getDouble("gdpBillions"),
            n.getDouble("gdpPerCapitaUSD"),
            n.getInt("industryLevel"),
            n.getInt("resourceLevel"),
            n.getInt("tradeOpenness"),
            n.getInt("militarySpendPct"),
            n.getDouble("stabilityIndex"),
            n.getDouble("growthRateAnnual")
        );
    }

    private Military parseMilitary(JsonValue n) {
        return new Military(
            n.getInt("armyStrength"),
            n.getInt("navyStrength"),
            n.getInt("airStrength"),
            n.getInt("intelligenceRating"),
            n.getInt("cyberCapability"),
            n.getBoolean("nuclearCapable"),
            n.getInt("nuclearWarheads"),
            n.getInt("guerrillaCapability"),
            n.getInt("propagandaReach"),
            n.getInt("proxyWarfare")
        );
    }
}
