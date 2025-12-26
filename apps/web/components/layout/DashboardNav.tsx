"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LayoutDashboard,
  LayoutGrid,
  FolderOpen,
  MessageSquare,
  Headphones,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
}

export function DashboardNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // Get active corridor for task counts
  const corridor = useQuery(api.corridors.getActiveCorridor);
  const taskCounts = useQuery(
    api.tasks.getTaskCounts,
    corridor ? { corridorId: corridor._id } : "skip"
  );

  // Calculate active tasks (not done)
  const activeTasks = taskCounts
    ? taskCounts.todo + taskCounts.in_progress + taskCounts.blocked
    : 0;

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      labelKey: "dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: "/dashboard/tasks",
      labelKey: "tasks",
      icon: <LayoutGrid size={18} />,
      badge: activeTasks > 0 ? activeTasks : undefined,
    },
    {
      href: "/dashboard/documents",
      labelKey: "documents",
      icon: <FolderOpen size={18} />,
    },
    {
      href: "/chat",
      labelKey: "chat",
      icon: <MessageSquare size={18} />,
    },
    {
      href: "/briefing",
      labelKey: "audio",
      icon: <Headphones size={18} />,
    },
  ];

  // Check if current path matches nav item
  const isActive = (href: string) => {
    // Remove locale prefix for comparison
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");

    if (href === "/dashboard") {
      return pathWithoutLocale === "/dashboard" || pathWithoutLocale === "";
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] mb-6">
      <div className="flex items-center overflow-x-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-3 font-bold text-sm
                border-r-2 border-black last:border-r-0
                transition-colors whitespace-nowrap
                ${active
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
              {item.badge !== undefined && (
                <span
                  className={`
                    ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full
                    ${active
                      ? "bg-yellow-400 text-black"
                      : "bg-cyan-500 text-white"
                    }
                  `}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
