package com.geostrategy.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.geostrategy.engine.GameState;

/**
 * Top HUD bar: current date, turn button, global flags.
 */
public class HUD {

    private final ShapeRenderer shapes;
    private final SpriteBatch   batch;
    private final BitmapFont    font;

    public static final float HUD_HEIGHT = 32f;

    // Turn button bounds (for click detection)
    private float btnX, btnY, btnW, btnH;

    public HUD(ShapeRenderer shapes, SpriteBatch batch, BitmapFont font) {
        this.shapes = shapes;
        this.batch  = batch;
        this.font   = font;
    }

    public void render(GameState state, float screenW, float screenH) {
        float barY = screenH - HUD_HEIGHT;

        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.08f, 0.10f, 0.16f, 1f);
        shapes.rect(0, barY, screenW, HUD_HEIGHT);
        shapes.end();

        shapes.begin(ShapeRenderer.ShapeType.Line);
        shapes.setColor(0.3f, 0.4f, 0.6f, 1f);
        shapes.line(0, barY, screenW, barY);
        shapes.end();

        // Turn button
        btnW = 120; btnH = 22;
        btnX = screenW - btnW - 10;
        btnY = barY + (HUD_HEIGHT - btnH) / 2f;

        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.2f, 0.5f, 0.2f, 1f);
        shapes.rect(btnX, btnY, btnW, btnH);
        shapes.end();

        batch.begin();

        font.setColor(Color.WHITE);
        font.draw(batch, state.currentDate.toString(), 10, barY + 20);

        font.setColor(Color.LIGHT_GRAY);
        font.draw(batch, "Zug #" + state.turnNumber, 220, barY + 20);

        // Global flags
        float fx = 360;
        if (state.warOnTerrorActive) {
            font.setColor(Color.RED);
            font.draw(batch, "[KRIEG GEGEN TERROR]", fx, barY + 20);
            fx += 180;
        }
        if (state.globalFinancialCrisis) {
            font.setColor(Color.ORANGE);
            font.draw(batch, "[FINANZKRISE]", fx, barY + 20);
            fx += 130;
        }
        if (state.covidPandemic) {
            font.setColor(Color.YELLOW);
            font.draw(batch, "[COVID-PANDEMIE]", fx, barY + 20);
        }

        font.setColor(Color.WHITE);
        font.draw(batch, "NÄCHSTER ZUG", btnX + 8, btnY + 15);

        batch.end();
    }

    /** Returns true if the "Next Turn" button was clicked. */
    public boolean isTurnButtonClicked(float x, float y) {
        return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
    }
}
