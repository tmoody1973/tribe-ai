"use client";

import { useState } from "react";
import {
  FolderOpen,
  LayoutGrid,
  Bot,
  FileCheck,
  Calculator,
  Clock,
  Phone,
  Mic,
  Map,
  Heart,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface Tool {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  preview: React.ReactNode;
}

const tools: Tool[] = [
  {
    icon: <LayoutGrid className="w-6 h-6" />,
    title: "Task Board",
    description: "Kanban-style board to track your migration tasks. Drag and drop between To Do, In Progress, and Done.",
    color: "text-cyan-600",
    bgColor: "bg-gradient-to-br from-cyan-100 to-cyan-50",
    preview: (
      <div className="flex gap-2 mt-3">
        <div className="flex-1 bg-white/80 border-2 border-black p-2 text-xs">
          <div className="font-bold mb-1 text-gray-600">To Do</div>
          <div className="bg-yellow-100 border border-black p-1 mb-1 text-[10px]">Get passport photos</div>
          <div className="bg-yellow-100 border border-black p-1 text-[10px]">Book appointment</div>
        </div>
        <div className="flex-1 bg-white/80 border-2 border-black p-2 text-xs">
          <div className="font-bold mb-1 text-gray-600">In Progress</div>
          <div className="bg-blue-100 border border-black p-1 text-[10px]">Gather documents</div>
        </div>
        <div className="flex-1 bg-white/80 border-2 border-black p-2 text-xs">
          <div className="font-bold mb-1 text-green-600">Done</div>
          <div className="bg-green-100 border border-black p-1 text-[10px]">Research visa</div>
        </div>
      </div>
    ),
  },
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "Document Vault",
    description: "Securely store your passport, visa, and migration documents. Access them anywhere, anytime.",
    color: "text-amber-600",
    bgColor: "bg-gradient-to-br from-amber-100 to-amber-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2">
        <div className="flex items-center gap-2 text-xs mb-2">
          <div className="w-8 h-8 bg-red-100 border border-black flex items-center justify-center text-red-600 font-bold text-[10px]">PDF</div>
          <div>
            <div className="font-bold text-xs">passport_scan.pdf</div>
            <div className="text-[10px] text-gray-500">Uploaded 2 days ago</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-8 h-8 bg-blue-100 border border-black flex items-center justify-center text-blue-600 font-bold text-[10px]">IMG</div>
          <div>
            <div className="font-bold text-xs">visa_approval.jpg</div>
            <div className="text-[10px] text-gray-500">Uploaded 1 week ago</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI Step Assistant",
    description: "Get personalized AI help for every protocol step. Ask questions, get clarifications instantly.",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-100 to-purple-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="bg-gray-100 p-2 rounded mb-2 text-[10px]">
          &ldquo;What documents do I need for the visa interview?&rdquo;
        </div>
        <div className="bg-purple-100 p-2 rounded text-[10px]">
          <span className="font-bold">AI:</span> For your US B1/B2 visa interview, you&apos;ll need: passport, DS-160 confirmation, photo, appointment letter...
        </div>
      </div>
    ),
  },
  {
    icon: <FileCheck className="w-6 h-6" />,
    title: "Document Checklist",
    description: "AI-generated checklists of required documents for each step. Never miss a paper again.",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-100 to-green-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-black flex items-center justify-center text-white text-[10px]">✓</div>
          <span className="line-through text-gray-400">Valid passport</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-black flex items-center justify-center text-white text-[10px]">✓</div>
          <span className="line-through text-gray-400">Passport photos (2x2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-black bg-white"></div>
          <span>Bank statements (3 months)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-black bg-white"></div>
          <span>Employment letter</span>
        </div>
      </div>
    ),
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: "True Cost Calculator",
    description: "Compare real costs between your origin and destination. Rent, groceries, transport, and more.",
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-br from-emerald-100 to-emerald-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="flex justify-between mb-1">
          <span>Rent (1BR)</span>
          <span className="font-bold text-red-600">+85%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded overflow-hidden mb-2">
          <div className="h-full bg-red-500 w-4/5"></div>
        </div>
        <div className="flex justify-between mb-1">
          <span>Groceries</span>
          <span className="font-bold text-orange-600">+42%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded overflow-hidden">
          <div className="h-full bg-orange-500 w-2/5"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Chat",
    description: "Talk to TRIBE in your language. Ask questions with your voice, get spoken answers back.",
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-pink-100 to-pink-50",
    preview: (
      <div className="mt-3 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_#000]">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-pink-400 animate-ping opacity-30"></div>
        </div>
      </div>
    ),
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "First 48 Hours Guide",
    description: "Know exactly what to do when you land. SIM cards, transport, essentials, emergency numbers.",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-100 to-orange-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="font-bold text-orange-600 mb-1">Day 1 Checklist:</div>
        <div className="space-y-1 text-[10px]">
          <div>1. Get local SIM at airport</div>
          <div>2. Withdraw local currency</div>
          <div>3. Register at accommodation</div>
          <div>4. Save emergency numbers</div>
        </div>
      </div>
    ),
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "Emergency Info",
    description: "Local emergency numbers, nearest embassy, hospitals. Always know who to call.",
    color: "text-red-600",
    bgColor: "bg-gradient-to-br from-red-100 to-red-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-red-100 p-1 text-center border border-red-300">
            <div className="font-bold">Police</div>
            <div>110</div>
          </div>
          <div className="bg-blue-100 p-1 text-center border border-blue-300">
            <div className="font-bold">Ambulance</div>
            <div>119</div>
          </div>
          <div className="bg-green-100 p-1 text-center border border-green-300 col-span-2">
            <div className="font-bold">Your Embassy</div>
            <div>+81-3-XXXX-XXXX</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: "Journey Map",
    description: "Visualize your migration corridor on an interactive map. See where you're going.",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-100 to-blue-50",
    preview: (
      <div className="mt-3 bg-gradient-to-r from-blue-200 to-blue-100 border-2 border-black p-2 relative h-16 overflow-hidden">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></div>
        <div className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-black"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">✈️</div>
      </div>
    ),
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Cultural Bridge",
    description: "Understand cultural differences between your origin and destination. Avoid faux pas.",
    color: "text-rose-600",
    bgColor: "bg-gradient-to-br from-rose-100 to-rose-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-[10px]">
        <div className="flex justify-between items-center mb-1">
          <span>Communication</span>
          <span className="bg-yellow-200 px-1">Different</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span>Work Culture</span>
          <span className="bg-red-200 px-1">Very Different</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Food Culture</span>
          <span className="bg-green-200 px-1">Similar</span>
        </div>
      </div>
    ),
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Salary Reality Check",
    description: "See what you can actually earn in your destination. Adjusted for cost of living.",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-100 to-green-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="text-center">
          <div className="text-[10px] text-gray-500">Software Engineer</div>
          <div className="font-bold text-green-600 text-lg">$75,000</div>
          <div className="text-[10px] text-gray-500">avg. annual salary</div>
          <div className="text-[10px] mt-1 bg-green-100 px-2 py-0.5 inline-block">
            +45% purchasing power
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "Visa Eligibility Quiz",
    description: "Answer a few questions to see which visas you might qualify for. Personalized results.",
    color: "text-indigo-600",
    bgColor: "bg-gradient-to-br from-indigo-100 to-indigo-50",
    preview: (
      <div className="mt-3 bg-white/80 border-2 border-black p-2 text-xs">
        <div className="text-[10px] text-gray-600 mb-2">Eligible Visas:</div>
        <div className="flex flex-wrap gap-1">
          <span className="bg-green-200 border border-green-500 px-1.5 py-0.5 text-[10px]">Work Visa ✓</span>
          <span className="bg-green-200 border border-green-500 px-1.5 py-0.5 text-[10px]">Skilled Worker ✓</span>
          <span className="bg-yellow-200 border border-yellow-500 px-1.5 py-0.5 text-[10px]">Startup ?</span>
        </div>
      </div>
    ),
  },
];

interface PowerToolsSectionProps {
  title: string;
  subtitle: string;
}

export function PowerToolsSection({ title, subtitle }: PowerToolsSectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating accent elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-500/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/50 px-4 py-2 mb-6 rounded-full">
            <span className="text-cyan-400 font-bold text-sm">Your Migration Command Center</span>
          </div>
          <h2 className="font-head text-4xl md:text-5xl mb-4 text-white">{title}</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Tools grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tools.map((tool, i) => (
            <div
              key={i}
              className={`
                ${tool.bgColor}
                border-4 border-black
                shadow-[6px_6px_0_0_#000]
                hover:shadow-[3px_3px_0_0_#000]
                hover:translate-x-[3px] hover:translate-y-[3px]
                transition-all duration-200
                cursor-pointer
                group
                relative
                overflow-hidden
              `}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="p-5 relative z-10">
                {/* Icon */}
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    bg-white border-2 border-black mb-4
                    group-hover:rotate-6 group-hover:scale-110 transition-transform
                    ${tool.color}
                  `}
                >
                  {tool.icon}
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg mb-2">{tool.title}</h3>

                {/* Description */}
                <p className="text-gray-700 text-sm">{tool.description}</p>

                {/* Preview (shown on hover or always on mobile) */}
                <div className={`
                  transition-all duration-300 overflow-hidden
                  ${hoveredIndex === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0 md:max-h-0"}
                  md:group-hover:max-h-48 md:group-hover:opacity-100
                `}>
                  {tool.preview}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-lg">
            <span className="text-white font-bold">12 powerful tools</span> built specifically for migrants.
            <span className="text-cyan-400"> All in one dashboard.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
