package com.geostrategy.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.geostrategy.engine.GameState;
import com.geostrategy.models.Country;

/**
 * Phase 1 map: simple colored rectangles per country, positioned on a
 * normalized world-map grid. Full province-based map comes in Phase 2.
 */
public class MapRenderer {

    private final ShapeRenderer shapes;
    private final SpriteBatch   batch;
    private final BitmapFont    font;

    private float screenW;
    private float screenH;
    private String selectedCountryId;

    // Map occupies left 70% of screen, right panel is 30%
    private static final float MAP_WIDTH_RATIO = 0.70f;

    public MapRenderer(ShapeRenderer shapes, SpriteBatch batch, BitmapFont font) {
        this.shapes = shapes;
        this.batch  = batch;
        this.font   = font;
    }

    public void setScreenSize(float w, float h) {
        this.screenW = w;
        this.screenH = h;
    }

    public void render(GameState state) {
        float mapW = screenW * MAP_WIDTH_RATIO;
        float mapH = screenH;

        // Background — dark ocean
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.08f, 0.12f, 0.20f, 1f);
        shapes.rect(0, 0, mapW, mapH);
        shapes.end();

        // Draw each country
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        for (Country c : state.allCountries()) {
            float x = c.mapX * mapW;
            float y = (1f - c.mapY - c.mapH) * mapH;
            float w = c.mapW * mapW;
            float h = c.mapH * mapH;

            Color col = hexToColor(c.flagColor);

            // Highlight selected
            if (c.id.equals(selectedCountryId)) {
                shapes.setColor(col.r * 1.4f, col.g * 1.4f, col.b * 1.4f, 1f);
            } else {
                shapes.setColor(col);
            }
            shapes.rect(x, y, w, h);
        }
        shapes.end();

        // Country borders and labels
        shapes.begin(ShapeRenderer.ShapeType.Line);
        shapes.setColor(0.9f, 0.9f, 0.9f, 0.5f);
        for (Country c : state.allCountries()) {
            float x = c.mapX * mapW;
            float y = (1f - c.mapY - c.mapH) * mapH;
            float w = c.mapW * mapW;
            float h = c.mapH * mapH;
            shapes.rect(x, y, w, h);
        }
        shapes.end();

        // Country name labels
        batch.begin();
        font.setColor(Color.WHITE);
        for (Country c : state.allCountries()) {
            float x = c.mapX * mapW + 3;
            float y = (1f - c.mapY) * mapH - 3;
            font.draw(batch, c.id, x, y);
        }
        batch.end();
    }

    /** Returns country ID clicked at screen coordinates, or null. */
    public String getCountryAt(float screenX, float screenY, GameState state) {
        float mapW = screenW * MAP_WIDTH_RATIO;
        float mapH = screenH;
        float normX = screenX / mapW;
        float normY = 1f - (screenY / mapH);

        for (Country c : state.allCountries()) {
            if (normX >= c.mapX && normX <= c.mapX + c.mapW &&
                normY >= c.mapY && normY <= c.mapY + c.mapH) {
                return c.id;
            }
        }
        return null;
    }

    public void setSelectedCountry(String id) {
        this.selectedCountryId = id;
    }

    private static Color hexToColor(String hex) {
        try {
            String h = hex.startsWith("#") ? hex.substring(1) : hex;
            int r = Integer.parseInt(h.substring(0, 2), 16);
            int g = Integer.parseInt(h.substring(2, 4), 16);
            int b = Integer.parseInt(h.substring(4, 6), 16);
            return new Color(r / 255f, g / 255f, b / 255f, 1f);
        } catch (Exception e) {
            return Color.GRAY;
        }
    }
}
