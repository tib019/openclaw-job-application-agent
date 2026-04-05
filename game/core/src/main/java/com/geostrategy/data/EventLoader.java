package com.geostrategy.data;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import com.geostrategy.models.GameEvent;

import java.util.ArrayList;
import java.util.List;

/** Loads GameEvent lists from JSON files. */
public class EventLoader {

    public List<GameEvent> load(String internalPath) {
        List<GameEvent> events = new ArrayList<>();
        JsonReader reader = new JsonReader();
        JsonValue root = reader.parse(Gdx.files.internal(internalPath));

        for (JsonValue n : root) {
            events.add(parseEvent(n));
        }
        return events;
    }

    private GameEvent parseEvent(JsonValue n) {
        GameEvent e = new GameEvent();
        e.id              = n.getString("id");
        e.title           = n.getString("title");
        e.description     = n.getString("description");
        e.targetCountryId = n.getString("targetCountryId");
        e.type            = GameEvent.EventType.valueOf(n.getString("type"));
        e.isHistorical    = n.getBoolean("isHistorical", false);
        e.triggerYear     = n.getInt("triggerYear", 0);
        e.triggerMonth    = n.getInt("triggerMonth", 0);
        e.fired           = false;

        JsonValue opts = n.get("options");
        if (opts != null) {
            e.options = new ArrayList<>();
            for (JsonValue o : opts) {
                GameEvent.EventOption opt = new GameEvent.EventOption();
                opt.id   = o.getString("id");
                opt.text = o.getString("text");
                opt.effects = new ArrayList<>();
                JsonValue fx = o.get("effects");
                if (fx != null) {
                    for (JsonValue ef : fx) {
                        GameEvent.EventEffect eff = new GameEvent.EventEffect();
                        eff.targetCountry = ef.getString("targetCountry");
                        eff.field         = ef.getString("field");
                        eff.delta         = ef.getInt("delta");
                        eff.description   = ef.getString("description", "");
                        opt.effects.add(eff);
                    }
                }
                e.options.add(opt);
            }
        }
        return e;
    }
}
