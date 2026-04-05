package com.geostrategy.screens;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.InputAdapter;
import com.badlogic.gdx.Screen;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.geostrategy.GeoStrategyGame;
import com.geostrategy.data.EventLoader;
import com.geostrategy.data.FocusTreeLoader;
import com.geostrategy.engine.AISystem;
import com.geostrategy.engine.EffectProcessor;
import com.geostrategy.engine.GameState;
import com.geostrategy.engine.TurnSystem;
import com.geostrategy.models.Country;
import com.geostrategy.models.FocusNode;
import com.geostrategy.models.FocusTree;
import com.geostrategy.models.GameEvent;
import com.geostrategy.ui.*;

import java.util.*;

/**
 * Main game screen. Ties together all systems and UI components.
 *
 * Layout (1280×800 default):
 *   Left 70%   — World map
 *   Right 30%  — Country panel
 *   Top bar    — HUD (date, turn button, focus progress)
 *   Overlay    — EventDialog (blocks input when active)
 *   Overlay    — FocusTreeScreen (toggled with F key)
 */
public class GameScreen implements Screen {

    private final GeoStrategyGame game;
    private final OrthographicCamera camera;

    // Systems
    private TurnSystem      turnSystem;
    private AISystem        aiSystem;
    private EffectProcessor effects;

    // UI components
    private MapRenderer     mapRenderer;
    private CountryPanel    countryPanel;
    private HUD             hud;
    private EventDialog     eventDialog;
    private FocusTreeScreen focusTreeScreen;

    // State
    private String              selectedCountryId;
    private boolean             showFocusTree;
    private final Queue<GameEvent> pendingPlayerEvents = new LinkedList<>();

    // Focus trees
    private final Map<String, FocusTree> focusTrees = new HashMap<>();

    // Focus tree files to try loading
    private static final String[] FOCUS_FILES = {
        "data/focuses/focus_deu.json",
        "data/focuses/focus_usa.json",
        "data/focuses/focus_rus.json",
        "data/focuses/focus_chn.json"
    };

    // Event files to load
    private static final String[] EVENT_FILES = {
        "data/events_2000_2005.json",
        "data/events_2005_2015.json",
        "data/events_2015_2025.json"
    };

    public GameScreen(GeoStrategyGame game) {
        this.game   = game;
        this.camera = new OrthographicCamera();
        init();
    }

    private void init() {
        GameState state = game.gameState;

        // Mark player
        Country player = state.getPlayerCountry();
        if (player != null) player.isPlayerControlled = true;

        // Load events
        EventLoader eventLoader = new EventLoader();
        for (String path : EVENT_FILES) {
            try {
                state.pendingEvents.addAll(eventLoader.load(path));
            } catch (Exception e) {
                Gdx.app.log("GameScreen", "Could not load events: " + path);
            }
        }

        // Load focus trees
        FocusTreeLoader ftLoader = new FocusTreeLoader();
        for (String path : FOCUS_FILES) {
            try {
                FocusTree tree = ftLoader.load(path);
                focusTrees.put(tree.countryId, tree);
            } catch (Exception e) {
                Gdx.app.log("GameScreen", "Could not load focus: " + path);
            }
        }

        // Init systems
        effects    = new EffectProcessor(state);
        aiSystem   = new AISystem(state, focusTrees);
        turnSystem = new TurnSystem(state);
        turnSystem.addListener(this::onTurnProcessed);

        // Init UI
        mapRenderer     = new MapRenderer(game.shapes, game.batch, game.font);
        countryPanel    = new CountryPanel(game.shapes, game.batch, game.font);
        hud             = new HUD(game.shapes, game.batch, game.font);
        eventDialog     = new EventDialog(game.shapes, game.batch, game.font, game.fontLarge);
        focusTreeScreen = new FocusTreeScreen(game.shapes, game.batch, game.font);

        // Default selection = player country
        selectedCountryId = state.playerCountryId;
        mapRenderer.setSelectedCountry(selectedCountryId);

        // Focus tree for player
        refreshFocusTree();

        setupInput();
    }

    private void setupInput() {
        float h = Gdx.graphics.getHeight();
        Gdx.input.setInputProcessor(new InputAdapter() {
            @Override
            public boolean touchDown(int sx, int sy, int pointer, int button) {
                float x = sx;
                float y = h - sy;

                // Event dialog consumes all clicks when active
                if (eventDialog.isActive()) {
                    eventDialog.handleClick(x, y);
                    return true;
                }

                // Focus tree overlay
                if (showFocusTree) {
                    if (!focusTreeScreen.handleClick(x, y)) {
                        showFocusTree = false; // click outside nodes = close
                    }
                    return true;
                }

                // HUD: turn button
                if (hud.isTurnButtonClicked(x, y)) {
                    processTurn();
                    return true;
                }

                // Map click
                String clicked = mapRenderer.getCountryAt(x, y, game.gameState);
                if (clicked != null) {
                    selectedCountryId = clicked;
                    mapRenderer.setSelectedCountry(clicked);
                    refreshFocusTree();
                }
                return true;
            }

            @Override
            public boolean keyDown(int keycode) {
                if (keycode == Input.Keys.F) {
                    showFocusTree = !showFocusTree;
                    return true;
                }
                if (keycode == Input.Keys.ESCAPE) {
                    showFocusTree = false;
                    return true;
                }
                if (keycode == Input.Keys.SPACE && !eventDialog.isActive()) {
                    processTurn();
                    return true;
                }
                return false;
            }
        });
    }

    private void processTurn() {
        GameState state = game.gameState;

        // Collect events for player country before advancing
        List<GameEvent> firedEvents = turnSystem.processTurn();

        // Separate player events from AI events
        for (GameEvent e : firedEvents) {
            if (e.targetCountryId.equals(state.playerCountryId)) {
                pendingPlayerEvents.add(e);
            } else {
                // AI resolves immediately
                Country target = state.getCountry(e.targetCountryId);
                if (target != null) {
                    GameEvent.EventOption choice = aiSystem.resolveEvent(target, e);
                    if (choice != null) {
                        effects.apply(e.targetCountryId, choice.effects);
                    }
                }
            }
        }

        // AI decisions for all non-player countries
        for (Country c : state.allCountries()) {
            if (!c.isPlayerControlled) {
                aiSystem.processTurn(c);
            }
        }

        // Advance player focus
        advancePlayerFocus();

        // Show next player event if any
        showNextPlayerEvent();
    }

    private void advancePlayerFocus() {
        GameState state = game.gameState;
        Country player  = state.getPlayerCountry();
        if (player == null || player.activeFocusId == null) return;

        FocusTree tree = focusTrees.get(player.id);
        if (tree == null) return;

        player.focusProgressDays += 30;
        FocusNode active = tree.get(player.activeFocusId);
        if (active != null && player.focusProgressDays >= active.daysToComplete) {
            FocusNode completed = tree.complete(player.activeFocusId);
            if (completed != null) {
                effects.apply(player.id, completed.effects);
                Gdx.app.log("FOCUS", "Completed: " + completed.title);
            }
            player.activeFocusId     = null;
            player.focusProgressDays = 0;
        }
    }

    private void showNextPlayerEvent() {
        if (!eventDialog.isActive() && !pendingPlayerEvents.isEmpty()) {
            GameEvent e = pendingPlayerEvents.poll();
            eventDialog.show(e, this::onPlayerEventChoice);
        }
    }

    private void onPlayerEventChoice(GameEvent event, GameEvent.EventOption option) {
        if (option != null) {
            effects.apply(event.targetCountryId, option.effects);
        }
        showNextPlayerEvent(); // chain if multiple events pending
    }

    private void onTurnProcessed(com.geostrategy.engine.GameState state,
                                  List<GameEvent> firedEvents) {
        // Handled above in processTurn() — nothing extra needed here
    }

    private void refreshFocusTree() {
        if (selectedCountryId == null) return;
        FocusTree tree = focusTrees.get(selectedCountryId);
        if (tree == null) return;

        focusTreeScreen.setFocusTree(tree, this::onFocusSelected);
    }

    private void onFocusSelected(FocusNode node) {
        Country player = game.gameState.getPlayerCountry();
        if (player == null) return;
        if (!selectedCountryId.equals(player.id)) return; // can only set own focus
        if (!node.available) return;

        player.activeFocusId     = node.id;
        player.focusProgressDays = 0;
        Gdx.app.log("FOCUS", "Selected: " + node.title);
    }

    @Override
    public void render(float delta) {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();

        Gdx.gl.glClearColor(0.05f, 0.07f, 0.12f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        camera.setToOrtho(false, w, h);
        game.batch.setProjectionMatrix(camera.combined);
        game.shapes.setProjectionMatrix(camera.combined);

        GameState state    = game.gameState;
        float     panelW   = w * 0.30f;
        float     mapW     = w - panelW;

        // Map
        mapRenderer.setScreenSize(mapW, h - HUD.HUD_HEIGHT);
        mapRenderer.render(state);

        // Country panel
        Country selected = selectedCountryId != null
            ? state.getCountry(selectedCountryId) : null;
        countryPanel.render(selected);

        // Focus progress bar in HUD area
        renderFocusProgress(w, h);

        // HUD
        hud.render(state, w, h);

        // Overlays
        if (showFocusTree) {
            focusTreeScreen.render(w, h);
        }
        if (eventDialog.isActive()) {
            eventDialog.render(w, h);
        }
    }

    private void renderFocusProgress(float screenW, float screenH) {
        Country player = game.gameState.getPlayerCountry();
        if (player == null || player.activeFocusId == null) return;

        FocusTree tree = focusTrees.get(player.id);
        if (tree == null) return;
        FocusNode active = tree.get(player.activeFocusId);
        if (active == null) return;

        float pct   = (float) player.focusProgressDays / active.daysToComplete;
        float barW  = 200f;
        float barH  = 12f;
        float barX  = screenW * 0.36f;
        float barY  = screenH - HUD.HUD_HEIGHT + 10f;

        game.shapes.begin(com.badlogic.gdx.graphics.glutils.ShapeRenderer.ShapeType.Filled);
        game.shapes.setColor(0.2f, 0.2f, 0.2f, 1f);
        game.shapes.rect(barX, barY, barW, barH);
        game.shapes.setColor(0.2f, 0.7f, 0.3f, 1f);
        game.shapes.rect(barX, barY, barW * pct, barH);
        game.shapes.end();

        game.batch.begin();
        game.font.setColor(com.badlogic.gdx.graphics.Color.WHITE);
        game.font.draw(game.batch, "Fokus: " + active.title
            + " (" + player.focusProgressDays + "/" + active.daysToComplete + "d)",
            barX, barY + barH + 12f);
        game.batch.end();
    }

    @Override
    public void resize(int w, int h) {
        camera.setToOrtho(false, w, h);
        float panelW = w * 0.30f;
        countryPanel.setBounds(w - panelW, HUD.HUD_HEIGHT, panelW, h - HUD.HUD_HEIGHT);
        mapRenderer.setScreenSize(w - panelW, h - HUD.HUD_HEIGHT);
        // Rebuild input to capture updated h
        setupInput();
    }

    @Override public void show()   {}
    @Override public void pause()  {}
    @Override public void resume() {}
    @Override public void hide()   {}
    @Override public void dispose() {}
}
