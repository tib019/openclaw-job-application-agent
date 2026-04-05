package com.geostrategy.screens;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputAdapter;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.geostrategy.GeoStrategyGame;
import com.geostrategy.data.CountryLoader;
import com.geostrategy.models.Country;

import java.util.List;

/**
 * Opening screen: player picks a country to lead.
 * Lists all 15 core countries with key stats.
 */
public class CountrySelectScreen implements Screen {

    private final GeoStrategyGame game;
    private final OrthographicCamera camera;
    private List<Country> countries;

    // Each entry row
    private static final float ROW_H    = 38f;
    private static final float START_Y  = 0; // computed in render
    private static final float MARGIN   = 60f;

    public CountrySelectScreen(GeoStrategyGame game) {
        this.game   = game;
        this.camera = new OrthographicCamera();

        // Load countries into game state
        CountryLoader loader = new CountryLoader();
        countries = loader.loadAll();
        for (Country c : countries) {
            game.gameState.addCountry(c);
        }

        Gdx.input.setInputProcessor(new InputAdapter() {
            @Override
            public boolean touchDown(int sx, int sy, int pointer, int button) {
                float x  = sx;
                float y  = Gdx.graphics.getHeight() - sy;
                handleClick(x, y);
                return true;
            }
        });
    }

    private void handleClick(float x, float y) {
        float w    = Gdx.graphics.getWidth();
        float h    = Gdx.graphics.getHeight();
        float listH = countries.size() * ROW_H;
        float startY = (h / 2f) + (listH / 2f);
        float colX  = MARGIN;
        float colW  = w - MARGIN * 2;

        for (int i = 0; i < countries.size(); i++) {
            float rowY = startY - (i + 1) * ROW_H;
            if (x >= colX && x <= colX + colW && y >= rowY && y <= rowY + ROW_H - 2) {
                game.startGame(countries.get(i).id);
                return;
            }
        }
    }

    @Override
    public void render(float delta) {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();

        Gdx.gl.glClearColor(0.05f, 0.07f, 0.12f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        camera.setToOrtho(false, w, h);
        game.shapes.setProjectionMatrix(camera.combined);
        game.batch.setProjectionMatrix(camera.combined);

        float listH  = countries.size() * ROW_H;
        float startY = (h / 2f) + (listH / 2f) + 50f;
        float colX   = MARGIN;
        float colW   = w - MARGIN * 2;

        // Title
        game.batch.begin();
        game.fontLarge.setColor(Color.YELLOW);
        game.fontLarge.draw(game.batch, "GEOSTRATEGY 2000", colX, h - 40f);
        game.font.setColor(Color.LIGHT_GRAY);
        game.font.draw(game.batch, "Wähle dein Land — Startjahr: Januar 2000", colX, h - 70f);
        game.batch.end();

        // Header row
        game.shapes.begin(com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType.Filled);
        game.shapes.setColor(0.15f, 0.20f, 0.30f, 1f);
        game.shapes.rect(colX, startY, colW, ROW_H - 2);
        game.shapes.end();

        game.batch.begin();
        game.font.setColor(Color.CYAN);
        float hY = startY + ROW_H - 14f;
        game.font.draw(game.batch, "Land",              colX + 5,    hY);
        game.font.draw(game.batch, "System",            colX + 130,  hY);
        game.font.draw(game.batch, "Ausrichtung",       colX + 400,  hY);
        game.font.draw(game.batch, "BIP (Mrd$)",        colX + 600,  hY);
        game.font.draw(game.batch, "Militär",           colX + 730,  hY);
        game.font.draw(game.batch, "Stabilität",        colX + 820,  hY);
        game.batch.end();

        // Country rows
        for (int i = 0; i < countries.size(); i++) {
            Country c  = countries.get(i);
            float rowY = startY - (i + 1) * ROW_H;

            // Row background (alternating)
            game.shapes.begin(com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType.Filled);
            Color bg = (i % 2 == 0)
                ? new Color(0.10f, 0.12f, 0.18f, 1f)
                : new Color(0.08f, 0.10f, 0.15f, 1f);
            game.shapes.setColor(bg);
            game.shapes.rect(colX, rowY, colW, ROW_H - 2);
            game.shapes.end();

            float ty = rowY + ROW_H - 14f;
            game.batch.begin();

            // Flag color dot
            Color flag = hexColor(c.flagColor);
            game.shapes.begin(com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType.Filled);
            game.shapes.setColor(flag);
            game.shapes.rect(colX + 5, rowY + 8, 12, 18);
            game.shapes.end();

            game.font.setColor(Color.WHITE);
            game.font.draw(game.batch, c.name, colX + 22, ty);

            game.font.setColor(Color.LIGHT_GRAY);
            String adapt = c.politics.nationalAdaptation.length() > 32
                ? c.politics.nationalAdaptation.substring(0, 32) + "…"
                : c.politics.nationalAdaptation;
            game.font.draw(game.batch, adapt, colX + 130, ty);

            game.font.setColor(alignColor(c.alignment.primaryLabel()));
            game.font.draw(game.batch, c.alignment.primaryLabel(), colX + 400, ty);

            game.font.setColor(Color.GREEN);
            game.font.draw(game.batch, String.format("$%.0f", c.economy.gdpBillions), colX + 600, ty);

            game.font.setColor(Color.RED);
            game.font.draw(game.batch, String.valueOf(c.military.powerIndex()), colX + 730, ty);

            Color stabColor = c.stabilityPoints > 70 ? Color.GREEN
                            : c.stabilityPoints > 40 ? Color.YELLOW : Color.RED;
            game.font.setColor(stabColor);
            game.font.draw(game.batch, c.stabilityPoints + "/100", colX + 820, ty);

            game.batch.end();
        }

        // Footer hint
        game.batch.begin();
        game.font.setColor(Color.DARK_GRAY);
        game.font.draw(game.batch, "Klick auf ein Land um zu starten", colX, 25f);
        game.batch.end();
    }

    private Color alignColor(String label) {
        return switch (label) {
            case "US-orientiert"      -> Color.CYAN;
            case "China-orientiert"   -> Color.RED;
            case "Russland-orientiert"-> Color.ORANGE;
            case "Non-Aligned"        -> Color.YELLOW;
            default                   -> Color.LIGHT_GRAY;
        };
    }

    private Color hexColor(String hex) {
        try {
            String h = hex.startsWith("#") ? hex.substring(1) : hex;
            return new Color(
                Integer.parseInt(h.substring(0,2),16)/255f,
                Integer.parseInt(h.substring(2,4),16)/255f,
                Integer.parseInt(h.substring(4,6),16)/255f, 1f);
        } catch (Exception e) { return Color.GRAY; }
    }

    @Override public void show()   {}
    @Override public void resize(int w, int h) { camera.setToOrtho(false, w, h); }
    @Override public void pause()  {}
    @Override public void resume() {}
    @Override public void hide()   {}
    @Override public void dispose() {}
}
