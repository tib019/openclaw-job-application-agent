package com.geostrategy.data;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.geostrategy.models.FocusNode;
import com.geostrategy.models.FocusTree;
import com.geostrategy.models.GameEvent;

import java.util.ArrayList;

/** Loads a FocusTree from JSON. */
public class FocusTreeLoader {

    public FocusTree load(String internalPath) {
        JsonReader reader = new JsonReader();
        JsonValue root = reader.parse(Gdx.files.internal(internalPath));

        FocusTree tree = new FocusTree();
        tree.countryId = root.getString("countryId");

        JsonValue nodes = root.get("nodes");
        for (JsonValue n : nodes) {
            FocusNode node = new FocusNode();
            node.id             = n.getString("id");
            node.title          = n.getString("title");
            node.description    = n.getString("description");
            node.daysToComplete = n.getInt("daysToComplete", 70);
            node.gridX          = n.getInt("gridX", 0);
            node.gridY          = n.getInt("gridY", 0);
            node.completed      = false;

            JsonValue prereqs = n.get("prerequisites");
            node.prerequisites = new ArrayList<>();
            if (prereqs != null) {
                for (JsonValue p : prereqs) {
                    node.prerequisites.add(p.asString());
                }
            }

            JsonValue effects = n.get("effects");
            node.effects = new ArrayList<>();
            if (effects != null) {
                for (JsonValue ef : effects) {
                    GameEvent.EventEffect eff = new GameEvent.EventEffect();
                    eff.targetCountry = ef.getString("targetCountry", "self");
                    eff.field         = ef.getString("field");
                    eff.delta         = ef.getInt("delta");
                    eff.description   = ef.getString("description", "");
                    node.effects.add(eff);
                }
            }
            tree.addNode(node);
        }

        tree.refreshAvailability();
        return tree;
    }
}
