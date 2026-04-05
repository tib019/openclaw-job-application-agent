package com.geostrategy.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.geostrategy.models.Country;
import com.geostrategy.models.PoliticalMechanics;

/**
 * Right-side info panel showing selected country details.
 */
public class CountryPanel {

    private final ShapeRenderer shapes;
    private final SpriteBatch   batch;
    private final BitmapFont    font;

    private float panelX;
    private float panelY;
    private float panelW;
    private float panelH;

    public CountryPanel(ShapeRenderer shapes, SpriteBatch batch, BitmapFont font) {
        this.shapes = shapes;
        this.batch  = batch;
        this.font   = font;
    }

    public void setBounds(float x, float y, float w, float h) {
        panelX = x; panelY = y; panelW = w; panelH = h;
    }

    public void render(Country country) {
        // Panel background
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.10f, 0.12f, 0.18f, 1f);
        shapes.rect(panelX, panelY, panelW, panelH);
        shapes.end();

        // Panel border
        shapes.begin(ShapeRenderer.ShapeType.Line);
        shapes.setColor(0.4f, 0.5f, 0.7f, 1f);
        shapes.rect(panelX, panelY, panelW, panelH);
        shapes.end();

        if (country == null) {
            batch.begin();
            font.setColor(Color.GRAY);
            font.draw(batch, "Kein Land ausgewählt", panelX + 10, panelY + panelH - 20);
            batch.end();
            return;
        }

        batch.begin();
        float x = panelX + 10;
        float y = panelY + panelH - 20;
        float lineH = 16f;

        // Header
        font.setColor(Color.YELLOW);
        font.draw(batch, country.name + " (" + country.id + ")", x, y); y -= lineH * 1.5f;

        font.setColor(Color.LIGHT_GRAY);
        font.draw(batch, country.fullName, x, y); y -= lineH;
        font.draw(batch, "Hauptstadt: " + country.capitalCity, x, y); y -= lineH;
        font.draw(batch, String.format("Bevölkerung: %,d", country.population), x, y); y -= lineH * 1.5f;

        // Politics
        font.setColor(Color.CYAN);
        font.draw(batch, "POLITIK", x, y); y -= lineH;
        font.setColor(Color.LIGHT_GRAY);
        font.draw(batch, country.politics.family.displayName, x, y); y -= lineH;
        font.draw(batch, country.politics.nationalAdaptation, x, y); y -= lineH;
        font.draw(batch, String.format("Stabilität: %d  Legitimität: %d",
            country.stabilityPoints, country.legitimacy), x, y); y -= lineH * 1.5f;

        // Mechanics bars
        font.setColor(Color.CYAN);
        font.draw(batch, "MECHANIKEN", x, y); y -= lineH;
        PoliticalMechanics m = country.politics.mechanics;
        y = drawBar(batch, "Marktfreiheit",  m.marketFreedom,  x, y, lineH);
        y = drawBar(batch, "Parteikontr.",   m.partyControl,   x, y, lineH);
        y = drawBar(batch, "Repression",     m.repression,     x, y, lineH);
        y = drawBar(batch, "Pressefreiheit", m.pressFreedom,   x, y, lineH);
        y -= lineH * 0.5f;

        // Alignment
        font.setColor(Color.CYAN);
        font.draw(batch, "AUSRICHTUNG: " + country.alignment.primaryLabel(), x, y); y -= lineH;
        font.setColor(Color.LIGHT_GRAY);
        y = drawBar(batch, "USA-Einfluss",  country.alignment.usInfluence,     x, y, lineH);
        y = drawBar(batch, "China",         country.alignment.chinaInfluence,  x, y, lineH);
        y = drawBar(batch, "Russland",      country.alignment.russiaInfluence, x, y, lineH);
        y = drawBar(batch, "EU",            country.alignment.euInfluence,     x, y, lineH);
        y = drawBar(batch, "Autonomie",     country.alignment.autonomy,        x, y, lineH);
        y -= lineH * 0.5f;

        // Economy
        font.setColor(Color.GREEN);
        font.draw(batch, "WIRTSCHAFT", x, y); y -= lineH;
        font.setColor(Color.LIGHT_GRAY);
        font.draw(batch, String.format("BIP: $%.0f Mrd", country.economy.gdpBillions), x, y); y -= lineH;
        font.draw(batch, String.format("Pro Kopf: $%.0f", country.economy.gdpPerCapitaUSD), x, y); y -= lineH;
        font.draw(batch, String.format("Wachstum: %.1f%%", country.economy.growthRateAnnual), x, y); y -= lineH * 1.5f;

        // Military
        font.setColor(Color.RED);
        font.draw(batch, "MILITÄR", x, y); y -= lineH;
        font.setColor(Color.LIGHT_GRAY);
        y = drawBar(batch, "Land",          country.military.armyStrength,       x, y, lineH);
        y = drawBar(batch, "Marine",        country.military.navyStrength,        x, y, lineH);
        y = drawBar(batch, "Luft",          country.military.airStrength,         x, y, lineH);
        y = drawBar(batch, "Geheimdienst",  country.military.intelligenceRating,  x, y, lineH);
        y = drawBar(batch, "Proxy",         country.military.proxyWarfare,        x, y, lineH);
        font.draw(batch, "Nuklear: " + (country.military.nuclearCapable ?
            country.military.nuclearWarheads + " Sprengköpfe" : "Nein"), x, y);

        batch.end();
    }

    private float drawBar(SpriteBatch b, String label, int value, float x, float y, float lineH) {
        font.setColor(Color.LIGHT_GRAY);
        font.draw(b, String.format("%-15s %3d", label, value), x, y);
        return y - lineH;
    }
}
