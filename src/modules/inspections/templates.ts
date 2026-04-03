export interface TemplateItem {
  category: string
  name: string
  sortOrder: number
}

export const STANDARD_INSPECTION_TEMPLATE: TemplateItem[] = [
  // Engine & Fluids
  { category: "Engine & Fluids", name: "Engine oil level", sortOrder: 0 },
  { category: "Engine & Fluids", name: "Coolant level", sortOrder: 1 },
  { category: "Engine & Fluids", name: "Brake fluid", sortOrder: 2 },
  { category: "Engine & Fluids", name: "Power steering fluid", sortOrder: 3 },
  { category: "Engine & Fluids", name: "Transmission fluid", sortOrder: 4 },
  { category: "Engine & Fluids", name: "Windshield washer fluid", sortOrder: 5 },
  { category: "Engine & Fluids", name: "Battery", sortOrder: 6 },
  { category: "Engine & Fluids", name: "Air filter", sortOrder: 7 },

  // Brakes
  { category: "Brakes", name: "Front brake pads", sortOrder: 0 },
  { category: "Brakes", name: "Rear brake pads", sortOrder: 1 },
  { category: "Brakes", name: "Front rotors", sortOrder: 2 },
  { category: "Brakes", name: "Rear rotors", sortOrder: 3 },
  { category: "Brakes", name: "Brake hoses", sortOrder: 4 },
  { category: "Brakes", name: "Parking brake", sortOrder: 5 },

  // Tires & Wheels
  { category: "Tires & Wheels", name: "Front left tire", sortOrder: 0 },
  { category: "Tires & Wheels", name: "Front right tire", sortOrder: 1 },
  { category: "Tires & Wheels", name: "Rear left tire", sortOrder: 2 },
  { category: "Tires & Wheels", name: "Rear right tire", sortOrder: 3 },
  { category: "Tires & Wheels", name: "Spare tire", sortOrder: 4 },
  { category: "Tires & Wheels", name: "Lug nuts / torque", sortOrder: 5 },

  // Steering & Suspension
  { category: "Steering & Suspension", name: "Tie rod ends", sortOrder: 0 },
  { category: "Steering & Suspension", name: "Ball joints", sortOrder: 1 },
  { category: "Steering & Suspension", name: "Wheel bearings", sortOrder: 2 },
  { category: "Steering & Suspension", name: "Shocks / struts", sortOrder: 3 },
  { category: "Steering & Suspension", name: "CV axles / boots", sortOrder: 4 },
  { category: "Steering & Suspension", name: "Sway bar links / bushings", sortOrder: 5 },

  // Lights & Electrical
  { category: "Lights & Electrical", name: "Headlights", sortOrder: 0 },
  { category: "Lights & Electrical", name: "Taillights", sortOrder: 1 },
  { category: "Lights & Electrical", name: "Brake lights", sortOrder: 2 },
  { category: "Lights & Electrical", name: "Turn signals", sortOrder: 3 },
  { category: "Lights & Electrical", name: "Reverse lights", sortOrder: 4 },
  { category: "Lights & Electrical", name: "Wipers / washers", sortOrder: 5 },
  { category: "Lights & Electrical", name: "Horn", sortOrder: 6 },

  // Under Vehicle
  { category: "Under Vehicle", name: "Exhaust system", sortOrder: 0 },
  { category: "Under Vehicle", name: "Catalytic converter", sortOrder: 1 },
  { category: "Under Vehicle", name: "Fuel lines / tank", sortOrder: 2 },
  { category: "Under Vehicle", name: "Frame / subframe", sortOrder: 3 },
  { category: "Under Vehicle", name: "Heat shields", sortOrder: 4 },
]

export const CONDITION_LABELS: Record<string, string> = {
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  URGENT: "Urgent",
}

export const CONDITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GOOD: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  FAIR: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  POOR: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  URGENT: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
}
