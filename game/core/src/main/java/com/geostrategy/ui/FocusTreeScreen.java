package com.geostrategy.ui;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.geostrategy.models.FocusNode;
import com.geostrategy.models.FocusTree;

import java.util.ArrayList;
import java.util.List;

/**
 * Overlay screen for the national focus tree.
 * Renders nodes as boxes on a grid, with connecting lines for prerequisites.
 * Player clicks a node to select it as the active focus.
 */
public class FocusTreeScreen {

    private final ShapeRenderer shapes;
    private final SpriteBatch   batch;
    private final BitmapFont    font;

    private static final float NODE_W    = 130f;
    private static final float NODE_H    = 50f;
    private static final float CELL_W    = 150f;
    private static final float CELL_H    = 80f;
    private static final float ORIGIN_X  = 60f;
    private static final float ORIGIN_Y  = 60f;

    private FocusTree focusTree;
    private String    selectedNodeId;
    private FocusSelectCallback callback;

    // Clickable areas: {screenX, screenY, nodeId}
    private final List<Object[]> clickAreas = new ArrayList<>();

    public interface FocusSelectCallback {
        void onFocusSelected(FocusNode node);
    }

    public FocusTreeScreen(ShapeRenderer shapes, SpriteBatch batch, BitmapFont font) {
        this.shapes = shapes;
        this.batch  = batch;
        this.font   = font;
    }

    public void setFocusTree(FocusTree tree, FocusSelectCallback cb) {
        this.focusTree = tree;
        this.callback  = cb;
    }

    public void render(float screenW, float screenH) {
        if (focusTree == null) return;

        clickAreas.clear();

        // Dark overlay
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.04f, 0.05f, 0.10f, 0.97f);
        shapes.rect(0, 0, screenW, screenH);
        shapes.end();

        // Title
        batch.begin();
        font.setColor(Color.YELLOW);
        font.draw(batch, "NATIONALES FOKUSPROGRAMM — " + focusTree.countryId,
            ORIGIN_X, screenH - 20f);
        font.setColor(Color.GRAY);
        font.draw(batch, "Klick: Fokus auswählen  |  ESC: Schließen", ORIGIN_X, screenH - 38f);
        batch.end();

        // Prerequisite lines first (behind nodes)
        shapes.begin(ShapeRenderer.ShapeType.Line);
        for (FocusNode node : focusTree.nodes.values()) {
            float nx = nodeX(node);
            float ny = nodeY(node, screenH);
            if (node.prerequisites != null) {
                for (String prereqId : node.prerequisites) {
                    FocusNode prereq = focusTree.get(prereqId);
                    if (prereq == null) continue;
                    float px = nodeX(prereq) + NODE_W / 2f;
                    float py = nodeY(prereq, screenH);
                    shapes.setColor(0.35f, 0.35f, 0.35f, 1f);
                    shapes.line(px, py, nx + NODE_W / 2f, ny + NODE_H);
                }
            }
        }
        shapes.end();

        // Nodes
        for (FocusNode node : focusTree.nodes.values()) {
            float nx = nodeX(node);
            float ny = nodeY(node, screenH);

            Color bg = nodeBg(node);
            shapes.begin(ShapeRenderer.ShapeType.Filled);
            shapes.setColor(bg);
            shapes.rect(nx, ny, NODE_W, NODE_H);
            shapes.end();

            Color border = node.id.equals(selectedNodeId) ? Color.YELLOW
                : node.completed ? Color.GREEN
                : node.available ? Color.WHITE : Color.DARK_GRAY;
            shapes.begin(ShapeRenderer.ShapeType.Line);
            shapes.setColor(border);
            shapes.rect(nx, ny, NODE_W, NODE_H);
            shapes.end();

            batch.begin();
            Color textCol = node.available || node.completed ? Color.WHITE : Color.DARK_GRAY;
            font.setColor(textCol);
            String title = node.title.length() > 17
                ? node.title.substring(0, 17) + "…" : node.title;
            font.draw(batch, title, nx + 5f, ny + NODE_H - 8f);

            font.setColor(node.completed ? Color.GREEN : Color.GRAY);
            font.draw(batch, node.completed ? "Abgeschlossen"
                : node.available ? node.daysToComplete + " Tage" : "Gesperrt",
                nx + 5f, ny + 14f);
            batch.end();

            clickAreas.add(new Object[]{nx, ny, NODE_W, NODE_H, node.id});
        }

        // Selected node detail panel
        if (selectedNodeId != null) {
            FocusNode sel = focusTree.get(selectedNodeId);
            if (sel != null) renderDetail(sel, screenW, screenH);
        }
    }

    private void renderDetail(FocusNode node, float screenW, float screenH) {
        float pw = 280f, ph = 180f;
        float px = screenW - pw - 10f, py = 10f;

        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.10f, 0.14f, 0.22f, 1f);
        shapes.rect(px, py, pw, ph);
        shapes.end();

        shapes.begin(ShapeRenderer.ShapeType.Line);
        shapes.setColor(Color.CYAN);
        shapes.rect(px, py, pw, ph);
        shapes.end();

        batch.begin();
        font.setColor(Color.YELLOW);
        font.draw(batch, node.title, px + 8f, py + ph - 12f);
        font.setColor(Color.LIGHT_GRAY);
        float ty = py + ph - 32f;
        for (String line : wrapText(node.description, 36)) {
            font.draw(batch, line, px + 8f, ty); ty -= 16f;
        }
        if (node.available && !node.completed) {
            font.setColor(Color.GREEN);
            font.draw(batch, "[ KLICK ZUM AUSWÄHLEN ]", px + 8f, py + 18f);
        }
        batch.end();
    }

    public boolean handleClick(float x, float y) {
        for (Object[] area : clickAreas) {
            float ax = (float) area[0], ay = (float) area[1];
            float aw = (float) area[2], ah = (float) area[3];
            String id = (String) area[4];
            if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
                FocusNode node = focusTree.get(id);
                selectedNodeId = id;
                if (node != null && node.available && callback != null) {
                    callback.onFocusSelected(node);
                }
                return true;
            }
        }
        return false;
    }

    private float nodeX(FocusNode n) {
        return ORIGIN_X + n.gridX * CELL_W;
    }

    private float nodeY(FocusNode n, float screenH) {
        return screenH - ORIGIN_Y - (n.gridY + 1) * CELL_H;
    }

    private Color nodeBg(FocusNode n) {
        if (n.completed) return new Color(0.05f, 0.25f, 0.05f, 1f);
        if (n.available) return new Color(0.12f, 0.16f, 0.26f, 1f);
        return new Color(0.07f, 0.08f, 0.12f, 1f);
    }

    private List<String> wrapText(String text, int maxChars) {
        List<String> lines = new ArrayList<>();
        if (text == null) return lines;
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
