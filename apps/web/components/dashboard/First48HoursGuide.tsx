"use client";

import { useState } from "react";
import { Clock, ChevronRight, CheckCircle2, Circle, MapPin, Phone, Wifi, CreditCard, Home, Bus, ShoppingBag, Users } from "lucide-react";

interface First48HoursGuideProps {
  destination: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: "must" | "should" | "nice";
  timeframe: string;
  tips?: string[];
}

const getTasks = (destination: string): { day1: Task[]; day2: Task[] } => ({
  day1: [
    {
      id: "airport",
      title: "Get through airport",
      description: "Immigration, baggage claim, customs",
      icon: <MapPin size={18} />,
      priority: "must",
      timeframe: "First 2 hours",
      tips: [
        "Have your visa/entry documents ready",
        "Know your accommodation address by heart",
        "Have some local currency for emergencies",
      ],
    },
    {
      id: "sim",
      title: "Get a SIM card",
      description: "Buy a local SIM at the airport or nearby",
      icon: <Phone size={18} />,
      priority: "must",
      timeframe: "At airport",
      tips: [
        "Airport SIMs are convenient but often pricier",
        "Get at least 10GB data for first month",
        "Consider eSIM if your phone supports it",
      ],
    },
    {
      id: "transport",
      title: "Get to your accommodation",
      description: "Take official transport to where you're staying",
      icon: <Bus size={18} />,
      priority: "must",
      timeframe: "First 3 hours",
      tips: [
        "Use official taxi stands or ride apps",
        "Confirm price before getting in (if taxi)",
        "Share your live location with family",
      ],
    },
    {
      id: "wifi",
      title: "Connect to WiFi",
      description: "Get online and message family you arrived safely",
      icon: <Wifi size={18} />,
      priority: "must",
      timeframe: "On arrival",
      tips: [
        "Use VPN on public WiFi",
        "Download offline maps while connected",
      ],
    },
    {
      id: "essentials",
      title: "Buy immediate essentials",
      description: "Water, snacks, toiletries if needed",
      icon: <ShoppingBag size={18} />,
      priority: "should",
      timeframe: "Day 1 evening",
      tips: [
        "Find the nearest supermarket/convenience store",
        "Get adapters for your electronics",
      ],
    },
    {
      id: "rest",
      title: "Rest and recover",
      description: "Don't overdo it on day 1 - you need to adjust",
      icon: <Home size={18} />,
      priority: "should",
      timeframe: "Day 1 evening",
      tips: [
        "Try to stay awake until local bedtime",
        "Hydrate well to combat jet lag",
      ],
    },
  ],
  day2: [
    {
      id: "explore",
      title: "Explore your neighborhood",
      description: "Walk around, find key locations",
      icon: <MapPin size={18} />,
      priority: "should",
      timeframe: "Morning",
      tips: [
        "Locate nearest grocery store",
        "Find the closest pharmacy",
        "Note public transport stops",
        "Find a good coffee spot!",
      ],
    },
    {
      id: "bank",
      title: "Research bank accounts",
      description: "Find out requirements for opening an account",
      icon: <CreditCard size={18} />,
      priority: "should",
      timeframe: "Day 2",
      tips: [
        `Search "best bank for expats ${destination}"`,
        "Some banks allow online account opening",
        "You may need proof of address",
      ],
    },
    {
      id: "transport-card",
      title: "Get a transport card",
      description: "Oyster, Opal, or local equivalent",
      icon: <Bus size={18} />,
      priority: "should",
      timeframe: "Day 2",
      tips: [
        "Usually available at train/metro stations",
        "Often offers discounted fares",
        "Register it online for protection if lost",
      ],
    },
    {
      id: "groceries",
      title: "Do a proper grocery shop",
      description: "Stock up your kitchen",
      icon: <ShoppingBag size={18} />,
      priority: "should",
      timeframe: "Day 2",
      tips: [
        "Check opening hours (may differ from home)",
        "Bring your own bags in many countries",
        "Look for discount supermarkets for savings",
      ],
    },
    {
      id: "community",
      title: "Find expat communities",
      description: "Join local Facebook groups, meetups",
      icon: <Users size={18} />,
      priority: "nice",
      timeframe: "Day 2",
      tips: [
        `Search "${destination} expats from [your country]"`,
        "Meetup.com has many expat events",
        "Don't isolate - connection helps adjustment",
      ],
    },
  ],
});

export function First48HoursGuide({ destination }: First48HoursGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [activeDay, setActiveDay] = useState<1 | 2>(1);

  const tasks = getTasks(destination);
  const currentTasks = activeDay === 1 ? tasks.day1 : tasks.day2;

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const completedCount = [...tasks.day1, ...tasks.day2].filter((t) =>
    completedTasks.has(t.id)
  ).length;
  const totalCount = tasks.day1.length + tasks.day2.length;

  const priorityColors = {
    must: "bg-red-100 text-red-700 border-red-300",
    should: "bg-yellow-100 text-yellow-700 border-yellow-300",
    nice: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 border-2 border-black flex items-center justify-center">
            <Clock className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-bold">First 48 Hours Guide</h3>
            <p className="text-sm text-gray-600">What to do when you land</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <span className="text-sm font-bold text-green-600">
              {completedCount}/{totalCount}
            </span>
          )}
          <ChevronRight
            className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
            size={20}
          />
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t-4 border-black">
          {/* Day Tabs */}
          <div className="flex border-b-2 border-black">
            <button
              onClick={() => setActiveDay(1)}
              className={`flex-1 py-3 font-bold text-center transition-colors ${
                activeDay === 1 ? "bg-orange-500 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Day 1: Arrival
            </button>
            <button
              onClick={() => setActiveDay(2)}
              className={`flex-1 py-3 font-bold text-center border-l-2 border-black transition-colors ${
                activeDay === 2 ? "bg-orange-500 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Day 2: Setup
            </button>
          </div>

          {/* Tasks */}
          <div className="p-4 space-y-3">
            {currentTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`border-2 border-black transition-all ${
                    isCompleted ? "bg-green-50 opacity-75" : "bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="w-full p-3 flex items-start gap-3 text-left"
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="text-green-500" size={22} />
                      ) : (
                        <Circle className="text-gray-400" size={22} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold ${isCompleted ? "line-through text-gray-500" : ""}`}>
                          {task.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 border ${priorityColors[task.priority]}`}>
                          {task.priority === "must" ? "Must do" : task.priority === "should" ? "Should do" : "Nice to do"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{task.timeframe}</p>
                    </div>
                    <div className="text-gray-400">{task.icon}</div>
                  </button>

                  {/* Tips (show when not completed) */}
                  {!isCompleted && task.tips && (
                    <div className="px-3 pb-3 ml-10">
                      <div className="bg-gray-50 p-2 border border-gray-200 text-sm">
                        <p className="font-bold text-xs text-gray-500 mb-1">TIPS:</p>
                        <ul className="space-y-1">
                          {task.tips.map((tip, i) => (
                            <li key={i} className="text-gray-600 flex items-start gap-1">
                              <span className="text-orange-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="p-4 bg-gray-50 border-t-2 border-black">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold">Overall Progress</span>
              <span>{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200 border-2 border-black">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
