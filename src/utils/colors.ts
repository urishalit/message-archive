const BUBBLE_COLORS = [
  "#DCF8C6", // WhatsApp green
  "#E3F2FD", // Light blue
  "#FFF9C4", // Light yellow
  "#F3E5F5", // Light purple
  "#FFCCBC", // Light orange
  "#C8E6C9", // Light green
  "#B3E5FC", // Lighter blue
  "#FFE0B2", // Peach
  "#D1C4E9", // Lavender
  "#F0F4C3", // Lime
];

export function getColorForRecipient(recipientId: string): string {
  let hash = 0;
  for (let i = 0; i < recipientId.length; i++) {
    hash = (hash * 31 + recipientId.charCodeAt(i)) | 0;
  }
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}
