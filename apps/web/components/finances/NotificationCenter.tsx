"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Check, X } from "lucide-react";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useQuery(api.financial.getNotifications, { limit: 10 });
  const markRead = useMutation(api.financial.markNotificationRead);
  const markAllRead = useMutation(api.financial.markAllNotificationsRead);

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  const handleMarkRead = async (notificationId: any) => {
    await markRead({ notificationId });
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "milestone_achieved":
        return "🎉";
      case "goal_completed":
        return "🎊";
      case "behind_schedule":
        return "⚠️";
      case "weekly_reminder":
        return "💰";
      case "streak_risk":
        return "🔥";
      default:
        return "📢";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 border-2 border-black transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border-4 border-black shadow-[8px_8px_0_0_#000] z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-yellow-100">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-black">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-black hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications && notifications.length > 0 ? (
                <>
                  {unreadCount > 0 && (
                    <div className="p-2 border-b-2 border-black bg-gray-50">
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                  {notifications.map((notification: any) => (
                    <div
                      key={notification._id}
                      className={`p-4 border-b-2 border-black ${
                        notification.read ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-bold text-sm ${!notification.read ? "text-black" : "text-gray-600"}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkRead(notification._id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
