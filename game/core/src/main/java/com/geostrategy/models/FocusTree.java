package com.geostrategy.models;

import java.util.*;

/**
 * National focus tree for a country.
 * Nodes are connected by prerequisite relationships.
 */
public class FocusTree {

    public String              countryId;
    public Map<String, FocusNode> nodes = new LinkedHashMap<>();

    public FocusTree() {}

    public void addNode(FocusNode node) {
        nodes.put(node.id, node);
    }

    public FocusNode get(String id) {
        return nodes.get(id);
    }

    /** Recompute which nodes are available based on completed prerequisites. */
    public void refreshAvailability() {
        for (FocusNode node : nodes.values()) {
            if (node.completed) {
                node.available = false;
                continue;
            }
            if (node.prerequisites == null || node.prerequisites.isEmpty()) {
                node.available = true;
            } else {
                node.available = node.prerequisites.stream()
                    .allMatch(req -> {
                        FocusNode prereq = nodes.get(req);
                        return prereq != null && prereq.completed;
                    });
            }
        }
    }

    /** Mark focus as complete, refresh tree. Returns the completed node. */
    public FocusNode complete(String focusId) {
        FocusNode node = nodes.get(focusId);
        if (node != null) {
            node.completed = true;
            node.available = false;
            refreshAvailability();
        }
        return node;
    }

    public List<FocusNode> getAvailable() {
        List<FocusNode> result = new ArrayList<>();
        for (FocusNode n : nodes.values()) {
            if (n.available) result.add(n);
        }
        return result;
    }
}
