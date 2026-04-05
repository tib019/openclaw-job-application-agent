package com.geostrategy;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.geostrategy.engine.GameState;
import com.geostrategy.screens.CountrySelectScreen;
import com.geostrategy.screens.GameScreen;

/**
 * Root application. Manages shared resources and screen transitions.
 */
public class GeoStrategyGame extends Game {

    // Shared rendering resources
    public SpriteBatch   batch;
    public ShapeRenderer shapes;
    public BitmapFont    font;
    public BitmapFont    fontLarge;

    // Game state lives here so it survives screen transitions
    public GameState gameState;

    @Override
    public void create() {
        batch     = new SpriteBatch();
        shapes    = new ShapeRenderer();
        font      = new BitmapFont();
        fontLarge = new BitmapFont();
        font.getData().setScale(0.9f);
        fontLarge.getData().setScale(1.4f);

        gameState = new GameState();

        setScreen(new CountrySelectScreen(this));
    }

    /** Called by CountrySelectScreen once player picks a country. */
    public void startGame(String playerCountryId) {
        gameState.playerCountryId = playerCountryId;
        setScreen(new GameScreen(this));
    }

    @Override
    public void dispose() {
        batch.dispose();
        shapes.dispose();
        font.dispose();
        fontLarge.dispose();
        if (getScreen() != null) getScreen().dispose();
    }
}
