export const METAL_OPTIONS = ['Gold', 'Rose Gold', 'White Gold'] as const;

export const KARAT_OPTIONS = ['9 KT', '14 KT', '18 KT'] as const;

export type MetalOption = (typeof METAL_OPTIONS)[number];
export type KaratOption = (typeof KARAT_OPTIONS)[number];
