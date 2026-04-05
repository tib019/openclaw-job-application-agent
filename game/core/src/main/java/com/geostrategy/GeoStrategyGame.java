package com.geostrategy;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputAdapter;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.geostrategy.data.CountryLoader;
import com.geostrategy.engine.GameState;
import com.geostrategy.engine.TurnSystem;
import com.geostrategy.models.Country;
import com.geostrategy.models.GameEvent;
import com.geostrategy.ui.CountryPanel;
import com.geostrategy.ui.HUD;
import com.geostrategy.ui.MapRenderer;

import java.util.List;

/**
 * Main LibGDX application entry point.
 */
public class GeoStrategyGame extends ApplicationAdapter {

    private OrthographicCamera camera;
    private SpriteBatch        batch;
    private ShapeRenderer      shapes;
    private BitmapFont         font;

    private GameState   gameState;
    private TurnSystem  turnSystem;

    private MapRenderer  mapRenderer;
    private CountryPanel countryPanel;
    private HUD          hud;

    private String selectedCountryId;

    private static final float PANEL_RATIO = 0.30f;

    @Override
    public void create() {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();

        camera = new OrthographicCamera();
        camera.setToOrtho(false, w, h);

        batch  = new SpriteBatch();
        shapes = new ShapeRenderer();
        font   = new BitmapFont(); // default LibGDX font — replace with custom in Phase 2
        font.getData().setScale(0.9f);

        // Init game state
        gameState = new GameState();
        gameState.playerCountryId = "DEU"; // default — player chooser UI in Phase 2

        // Load countries
        CountryLoader loader = new CountryLoader();
        for (Country c : loader.loadAll()) {
            gameState.addCountry(c);
        }

        // Mark player country
        Country player = gameState.getPlayerCountry();
        if (player != null) player.isPlayerControlled = true;

        // Turn system
        turnSystem = new TurnSystem(gameState);
        turnSystem.addListener(this::onTurnProcessed);

        // UI
        mapRenderer  = new MapRenderer(shapes, batch, font);
        countryPanel = new CountryPanel(shapes, batch, font);
        hud          = new HUD(shapes, batch, font);

        updateLayout(w, h);

        // Input
        Gdx.input.setInputProcessor(new InputAdapter() {
            @Override
            public boolean touchDown(int sx, int sy, int pointer, int button) {
                float x = sx;
                float y = h - sy; // LibGDX Y is inverted

                // HUD button
                if (hud.isTurnButtonClicked(x, y)) {
                    processTurn();
                    return true;
                }

                // Map click
                String clicked = mapRenderer.getCountryAt(x, y, gameState);
                if (clicked != null) {
                    selectedCountryId = clicked;
                    mapRenderer.setSelectedCountry(clicked);
                }
                return true;
            }
        });
    }

    private void processTurn() {
        List<GameEvent> events = turnSystem.processTurn();
        // Phase 1: events logged to console; Phase 2 gets modal dialogs
        for (GameEvent e : events) {
            Gdx.app.log("EVENT", e.title + ": " + e.description);
        }
    }

    private void onTurnProcessed(GameState state, List<GameEvent> events) {
        // Hook for future: update UI, show notifications
    }

    @Override
    public void render() {
        Gdx.gl.glClearColor(0.05f, 0.07f, 0.12f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        camera.update();
        batch.setProjectionMatrix(camera.combined);
        shapes.setProjectionMatrix(camera.combined);

        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();

        mapRenderer.setScreenSize(w, h - HUD.HUD_HEIGHT);
        mapRenderer.render(gameState);

        Country selected = selectedCountryId != null
            ? gameState.getCountry(selectedCountryId) : null;
        countryPanel.render(selected);

        hud.render(gameState, w, h);
    }

    @Override
    public void resize(int width, int height) {
        camera.setToOrtho(false, width, height);
        updateLayout(width, height);
    }

    private void updateLayout(float w, float h) {
        float panelW = w * PANEL_RATIO;
        float panelX = w - panelW;
        countryPanel.setBounds(panelX, HUD.HUD_HEIGHT, panelW, h - HUD.HUD_HEIGHT);
        mapRenderer.setScreenSize(w - panelW, h - HUD.HUD_HEIGHT);
    }

    @Override
    public void dispose() {
        batch.dispose();
        shapes.dispose();
        font.dispose();
    }
}
