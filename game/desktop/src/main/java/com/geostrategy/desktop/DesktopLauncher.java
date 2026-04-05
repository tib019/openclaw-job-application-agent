package com.geostrategy.desktop;

import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import com.geostrategy.GeoStrategyGame;

public class DesktopLauncher {

    public static void main(String[] args) {
        Lwjgl3ApplicationConfiguration config = new Lwjgl3ApplicationConfiguration();
        config.setTitle("GeoStrategy 2000");
        config.setWindowedMode(1280, 800);
        config.setForegroundFPS(60);
        config.setResizable(true);
        config.setWindowIcon("icon.png"); // optional, add to assets later
        new Lwjgl3Application(new GeoStrategyGame(), config);
    }
}
