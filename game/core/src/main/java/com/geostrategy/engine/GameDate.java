package com.geostrategy.engine;

/** Immutable game date. Game runs in monthly turns, starting January 2000. */
public class GameDate {

    public final int year;
    public final int month; // 1–12

    private static final String[] MONTHS = {
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    };

    public GameDate(int year, int month) {
        this.year  = year;
        this.month = month;
    }

    public static GameDate start() {
        return new GameDate(2000, 1);
    }

    public GameDate nextMonth() {
        if (month == 12) return new GameDate(year + 1, 1);
        return new GameDate(year, month + 1);
    }

    public boolean isBefore(GameDate other) {
        if (this.year != other.year) return this.year < other.year;
        return this.month < other.month;
    }

    public boolean isAfter(GameDate other) {
        return other.isBefore(this);
    }

    /** Days elapsed since Jan 2000 (approximate, for event timing). */
    public int totalMonths() {
        return (year - 2000) * 12 + (month - 1);
    }

    @Override
    public String toString() {
        return MONTHS[month - 1] + " " + year;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof GameDate other)) return false;
        return year == other.year && month == other.month;
    }
}
