import { SVGProps } from 'react';

import {
  IconAccessory,
  IconApparelAccessory,
  IconBeacon,
  IconBoot,
  IconCompass,
  IconCook,
  IconLayers,
  IconPack,
  IconSleep,
  IconSpark,
  IconTent
} from './icons';

export type TopCategoryIconKey =
  | 'spark'
  | 'boot'
  | 'layers'
  | 'pack'
  | 'compass'
  | 'tent'
  | 'sleep'
  | 'cook'
  | 'accessory'
  | 'beacon'
  | 'apparel-accessory';

type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

const ICON_COMPONENTS: Record<TopCategoryIconKey, IconComponent> = {
  spark: IconSpark,
  boot: IconBoot,
  layers: IconLayers,
  pack: IconPack,
  compass: IconCompass,
  tent: IconTent,
  sleep: IconSleep,
  cook: IconCook,
  accessory: IconAccessory,
  beacon: IconBeacon,
  'apparel-accessory': IconApparelAccessory
};

export const FALLBACK_ICON_KEY: TopCategoryIconKey = 'spark';

export function normalizeTopCategoryIconKey(value?: string | null): TopCategoryIconKey {
  const normalized = value?.toLowerCase().trim() as TopCategoryIconKey | undefined;
  if (normalized && normalized in ICON_COMPONENTS) {
    return normalized;
  }
  return FALLBACK_ICON_KEY;
}

export function getTopCategoryIconComponent(value?: string | null): IconComponent {
  return ICON_COMPONENTS[normalizeTopCategoryIconKey(value)];
}

export interface TopCategoryIconProps extends SVGProps<SVGSVGElement> {
  iconKey?: string | null;
}

export function TopCategoryIcon({ iconKey, ...props }: TopCategoryIconProps) {
  const Component = getTopCategoryIconComponent(iconKey);
  return <Component {...props} />;
}

export interface TopCategoryIconOption {
  value: TopCategoryIconKey;
  label: string;
  hint?: string;
}

export const topCategoryIconOptions: TopCategoryIconOption[] = [
  { value: 'spark', label: 'Spark', hint: 'Default sparkle accent' },
  { value: 'boot', label: 'Boot', hint: 'Ideal for Footwear' },
  { value: 'layers', label: 'Layers', hint: 'Great for Clothing stacks' },
  { value: 'pack', label: 'Pack', hint: 'Perfect for Backpacks & carry' },
  { value: 'compass', label: 'Compass', hint: 'Navigation & safety gear' },
  { value: 'tent', label: 'Tent', hint: 'Shelter essentials' },
  { value: 'sleep', label: 'Sleep', hint: 'Sleeping gear & comfort' },
  { value: 'cook', label: 'Cook', hint: 'Camp kitchen kit' },
  { value: 'accessory', label: 'Accessory', hint: 'Hiking add-ons & tools' },
  { value: 'beacon', label: 'Beacon', hint: 'Emergency & communication' },
  { value: 'apparel-accessory', label: 'Apparel accessory', hint: 'Gloves, gaiters, buffs' }
];
