import type { MtmCategory } from '@/types/mtm';
import type { MtmOptionSet } from '@/types/trouserOptions';

/**
 * Category configuration for MTM product expansion
 * Defines option sets, validators, defaults, and pricing for each MTM category
 */

export interface CategoryMtmConfig {
  /**
   * MTM category identifier
   */
  category: MtmCategory;
  /**
   * Human-readable category name
   */
  displayName: string;
  /**
   * Option set defining available choices
   */
  optionSet: MtmOptionSet;
  /**
   * Style presets and their defaults
   */
  styleDefaults: Record<string, Record<string, string>>;
  /**
   * Pricing tiers and option upcharges
   */
  pricing: {
    basePriceEur: number;
    optionUpcharges: Record<string, number>;
    styleUpcharges: Record<string, number>;
  };
  /**
   * Saved-fit applicable for this category
   */
  supportsSavedFit: boolean;
  /**
   * Min/max customization allowed
   */
  customizationLevel: 'basic' | 'standard' | 'premium';
}

/**
 * Validation result for category selections
 */
export interface CategoryValidationResult {
  isValid: boolean;
  missingRequiredKeys: string[];
  invalidValueKeys: string[];
  invalidCombinationRules: string[];
}

/**
 * Generic selections structure (category-agnostic)
 */
export type CategorySelections = Record<string, string | undefined>;

/**
 * MTM Category Registry - maps each category to its configuration
 */
export const MTM_CATEGORY_REGISTRY: Record<MtmCategory, CategoryMtmConfig | null> = {
  trouser: null, // Will be set by trouser module
  jacket: null,  // Will be set by jacket module
  shirt: null,   // Will be set by shirt module
  suit: null,    // Will be set by suit module
  overcoat: null,
  blazer: null,
  vest: null,
};

/**
 * Register a category configuration
 */
export function registerCategoryMtmConfig(config: CategoryMtmConfig): void {
  if (!Object.keys(MTM_CATEGORY_REGISTRY).includes(config.category)) {
    throw new Error(`Unknown MTM category: ${config.category}`);
  }
  MTM_CATEGORY_REGISTRY[config.category] = config;
}

/**
 * Get configuration for a category
 */
export function getCategoryMtmConfig(category: MtmCategory): CategoryMtmConfig {
  const config = MTM_CATEGORY_REGISTRY[category];
  if (!config) {
    throw new Error(`MTM configuration not available for category: ${category}`);
  }
  return config;
}

/**
 * Check if a category has been configured
 */
export function isCategoryConfigured(category: MtmCategory): boolean {
  return MTM_CATEGORY_REGISTRY[category] !== null;
}

/**
 * Get all configured categories
 */
export function getConfiguredCategories(): MtmCategory[] {
  return (Object.keys(MTM_CATEGORY_REGISTRY) as MtmCategory[]).filter(
    (category) => MTM_CATEGORY_REGISTRY[category] !== null,
  );
}

/**
 * Get default selections for a category style
 */
export function getCategoryStyleDefaults(
  category: MtmCategory,
  style?: string,
): CategorySelections {
  const config = getCategoryMtmConfig(category);
  if (!style) return {};
  return config.styleDefaults[style] ?? {};
}

/**
 * Apply style defaults to selections
 */
export function applyCategoryStyleDefaults(
  category: MtmCategory,
  selections: CategorySelections,
): CategorySelections {
  const config = getCategoryMtmConfig(category);
  const style = selections.style;
  if (!style) return { ...selections };

  const defaults = getCategoryStyleDefaults(category, style);
  const next: CategorySelections = { ...selections };

  // Only apply defaults that are valid values for the configured option choices
  for (const [key, value] of Object.entries(defaults)) {
    if (!value || next[key]) continue;

    const option = config.optionSet.options.find((o) => o.key === key);
    const hasChoice = option?.choices?.some((c) => c.value === value);
    if (hasChoice) {
      next[key] = value;
    }
  }

  return next;
}
