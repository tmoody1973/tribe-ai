"use client";

interface Persona {
  emoji: string;
  title: string;
  description: string;
  stage: string;
  color: string;
}

const personas: Persona[] = [
  {
    emoji: "💭",
    title: "The Dreamer",
    description: "You're thinking about moving abroad. Maybe for work, school, or just a fresh start. You have questions. Lots of them.",
    stage: "Researching possibilities",
    color: "bg-purple-100 border-purple-500",
  },
  {
    emoji: "📋",
    title: "The Planner",
    description: "You've picked your destination. Now you're deep in visa applications, document hunting, and trying to figure out the process.",
    stage: "Preparing documents",
    color: "bg-blue-100 border-blue-500",
  },
  {
    emoji: "✈️",
    title: "The Mover",
    description: "Visa approved! You're packing bags, selling stuff, saying goodbyes. It's really happening!",
    stage: "Ready to relocate",
    color: "bg-green-100 border-green-500",
  },
  {
    emoji: "🏠",
    title: "The Settler",
    description: "You made it! Now you need a bank account, a phone plan, maybe a job. Where do you even start?",
    stage: "Building new life",
    color: "bg-orange-100 border-orange-500",
  },
];

export function PersonaSection() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {personas.map((persona, i) => (
        <div
          key={i}
          className={`
            ${persona.color}
            border-4 border-black p-6
            shadow-[4px_4px_0_0_#000]
            relative
            overflow-hidden
          `}
        >
          {/* Large background emoji */}
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">
            {persona.emoji}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{persona.emoji}</span>
              <div>
                <h3 className="font-bold text-xl">{persona.title}</h3>
                <span className="text-xs bg-black text-white px-2 py-0.5 font-bold">
                  {persona.stage}
                </span>
              </div>
            </div>
            <p className="text-gray-700">{persona.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
