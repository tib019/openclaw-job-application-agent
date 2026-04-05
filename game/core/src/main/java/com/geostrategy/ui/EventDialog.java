package com.geostrategy.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.geostrategy.models.GameEvent;

import java.util.ArrayList;
import java.util.List;

/**
 * Modal event dialog. Blocks input to map until player picks an option.
 * Supports multi-line text wrapping.
 */
public class EventDialog {

    private final ShapeRenderer shapes;
    private final SpriteBatch   batch;
    private final BitmapFont    font;
    private final BitmapFont    fontLarge;

    private GameEvent           currentEvent;
    private EventChoiceCallback callback;

    // Dialog box bounds
    private float dlgX, dlgY, dlgW, dlgH;

    // Button click areas
    private final List<float[]> buttonBounds = new ArrayList<>(); // {x,y,w,h,optionIndex}

    private static final float PAD  = 20f;
    private static final float BTNW = 500f;
    private static final float BTNH = 34f;

    public interface EventChoiceCallback {
        void onChoice(GameEvent event, GameEvent.EventOption option);
    }

    public EventDialog(ShapeRenderer shapes, SpriteBatch batch,
                       BitmapFont font, BitmapFont fontLarge) {
        this.shapes    = shapes;
        this.batch     = batch;
        this.font      = font;
        this.fontLarge = fontLarge;
    }

    public void show(GameEvent event, EventChoiceCallback callback) {
        this.currentEvent = event;
        this.callback     = callback;
    }

    public boolean isActive() {
        return currentEvent != null;
    }

    public void render(float screenW, float screenH) {
        if (currentEvent == null) return;

        // Overlay
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0f, 0f, 0.6f);
        shapes.rect(0, 0, screenW, screenH);
        shapes.end();

        int optCount = currentEvent.options != null ? currentEvent.options.size() : 1;
        dlgW = Math.min(700f, screenW - 80f);
        dlgH = 200f + optCount * (BTNH + 12f) + PAD;
        dlgX = (screenW - dlgW) / 2f;
        dlgY = (screenH - dlgH) / 2f;

        // Dialog background
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.10f, 0.12f, 0.20f, 1f);
        shapes.rect(dlgX, dlgY, dlgW, dlgH);
        shapes.end();

        // Border — color by event type
        shapes.begin(ShapeRenderer.ShapeType.Line);
        shapes.setColor(typeColor(currentEvent.type));
        shapes.rect(dlgX, dlgY, dlgW, dlgH);
        shapes.end();

        // Type badge strip
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(typeColor(currentEvent.type));
        shapes.rect(dlgX, dlgY + dlgH - 28f, dlgW, 28f);
        shapes.end();

        batch.begin();
        float tx = dlgX + PAD;

        // Type label + title
        font.setColor(Color.BLACK);
        font.draw(batch, typeLabel(currentEvent.type), tx, dlgY + dlgH - 10f);

        fontLarge.setColor(Color.WHITE);
        fontLarge.draw(batch, currentEvent.title, tx, dlgY + dlgH - 38f);

        // Description (wrapped manually at ~90 chars)
        font.setColor(Color.LIGHT_GRAY);
        float descY = dlgY + dlgH - 75f;
        for (String line : wrapText(currentEvent.description, 85)) {
            font.draw(batch, line, tx, descY);
            descY -= 18f;
        }

        // Year/month indicator
        font.setColor(Color.GRAY);
        font.draw(batch, currentEvent.triggerYear + "/" + currentEvent.triggerMonth,
            dlgX + dlgW - 80f, dlgY + dlgH - 10f);

        batch.end();

        // Option buttons
        buttonBounds.clear();
        float btnY = dlgY + PAD + (optCount - 1) * (BTNH + 12f);
        float btnX = dlgX + (dlgW - BTNW) / 2f;

        if (currentEvent.options != null) {
            for (int i = 0; i < currentEvent.options.size(); i++) {
                GameEvent.EventOption opt = currentEvent.options.get(i);
                float by = btnY - i * (BTNH + 12f);

                shapes.begin(ShapeRenderer.ShapeType.Filled);
                shapes.setColor(0.18f, 0.28f, 0.18f, 1f);
                shapes.rect(btnX, by, BTNW, BTNH);
                shapes.end();

                shapes.begin(ShapeRenderer.ShapeType.Line);
                shapes.setColor(0.4f, 0.7f, 0.4f, 1f);
                shapes.rect(btnX, by, BTNW, BTNH);
                shapes.end();

                batch.begin();
                font.setColor(Color.WHITE);
                String label = opt.text.length() > 68 ? opt.text.substring(0, 68) + "…" : opt.text;
                font.draw(batch, label, btnX + 10f, by + BTNH - 10f);
                batch.end();

                buttonBounds.add(new float[]{btnX, by, BTNW, BTNH, i});
            }
        }
    }

    /** Returns true if click was consumed by the dialog. */
    public boolean handleClick(float x, float y) {
        if (currentEvent == null) return false;
        for (float[] b : buttonBounds) {
            if (x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]) {
                int idx = (int) b[4];
                GameEvent.EventOption chosen = currentEvent.options != null
                    ? currentEvent.options.get(idx) : null;
                GameEvent fired = currentEvent;
                currentEvent = null;
                if (callback != null) callback.onChoice(fired, chosen);
                return true;
            }
        }
        return true; // consume all clicks while dialog active
    }

    private Color typeColor(GameEvent.EventType t) {
        return switch (t) {
            case MILITARY   -> new Color(0.8f, 0.1f, 0.1f, 1f);
            case POLITICAL  -> new Color(0.2f, 0.4f, 0.8f, 1f);
            case ECONOMIC   -> new Color(0.1f, 0.7f, 0.3f, 1f);
            case ESPIONAGE  -> new Color(0.6f, 0.2f, 0.8f, 1f);
            case DIPLOMATIC -> new Color(0.2f, 0.7f, 0.8f, 1f);
            case DISASTER   -> new Color(0.9f, 0.5f, 0.0f, 1f);
        };
    }

    private String typeLabel(GameEvent.EventType t) {
        return switch (t) {
            case MILITARY   -> "MILITÄR";
            case POLITICAL  -> "POLITIK";
            case ECONOMIC   -> "WIRTSCHAFT";
            case ESPIONAGE  -> "GEHEIMDIENST";
            case DIPLOMATIC -> "DIPLOMATIE";
            case DISASTER   -> "KATASTROPHE";
        };
    }

    private List<String> wrapText(String text, int maxChars) {
        List<String> lines = new ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        for (String w : words) {
            if (line.length() + w.length() + 1 > maxChars) {
                lines.add(line.toString());
                line = new StringBuilder(w);
            } else {
                if (!line.isEmpty()) line.append(' ');
                line.append(w);
            }
        }
        if (!line.isEmpty()) lines.add(line.toString());
        return lines;
    }
}
