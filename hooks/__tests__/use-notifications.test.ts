import { Reminder } from "@/types/reminder";
import {
  cancelReminderNotification,
  requestNotificationPermission,
  scheduleReminderNotification,
} from "../use-notifications";

// ─── Mock expo-notifications ──────────────────────────────────────────────────

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: {
    CALENDAR: "calendar",
    TIME_INTERVAL: "timeInterval",
  },
}));

import * as Notifications from "expo-notifications";

// ─── Test fixture ─────────────────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "r1",
    title: "Morning Prayer",
    trackId: "track-a",
    hour: 6,
    minute: 0,
    snoozeMinutes: 10,
    enabled: true,
    notificationId: null,
    ...overrides,
  };
}

// ─── requestNotificationPermission ───────────────────────────────────────────

describe("requestNotificationPermission", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns true immediately when permission is already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("requests permission when not yet granted and returns true on grant", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("returns false when permission is denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

// ─── scheduleReminderNotification ─────────────────────────────────────────────

describe("scheduleReminderNotification", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns the notification ID string from expo-notifications", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-123");
    const id = await scheduleReminderNotification(makeReminder());
    expect(id).toBe("notif-123");
  });

  it("calls scheduleNotificationAsync with reminder hour and minute", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-456");
    await scheduleReminderNotification(makeReminder({ hour: 5, minute: 30 }));
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.trigger.hour).toBe(5);
    expect(call.trigger.minute).toBe(30);
    expect(call.trigger.repeats).toBe(true);
  });

  it("includes reminderId and trackId in the notification data payload", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue("notif-789");
    await scheduleReminderNotification(makeReminder({ id: "r42", trackId: "track-b" }));
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.content.data.reminderId).toBe("r42");
    expect(call.content.data.trackId).toBe("track-b");
  });

  it("propagates errors thrown by expo-notifications", async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
      new Error("Permission denied")
    );
    await expect(scheduleReminderNotification(makeReminder())).rejects.toThrow("Permission denied");
  });
});

// ─── cancelReminderNotification ───────────────────────────────────────────────

describe("cancelReminderNotification", () => {
  afterEach(() => jest.clearAllMocks());

  it("is a no-op when notificationId is null", async () => {
    await cancelReminderNotification(null);
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it("calls cancelScheduledNotificationAsync with the correct id", async () => {
    (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
    await cancelReminderNotification("notif-abc");
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-abc");
  });
});
