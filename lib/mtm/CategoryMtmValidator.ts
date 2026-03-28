import type { MtmCategory } from '@/types/mtm';
import { getCategoryMtmConfig } from './CategoryMtmConfig';
import type { CategoryValidationResult, CategorySelections } from './CategoryMtmConfig';

/**
 * Category-agnostic MTM selection validator
 *
 * Validates selections against the category's option set, required fields,
 * and category-specific combination rules.
 */

function hasChoiceValue(
  category: MtmCategory,
  optionKey: string,
  value?: string,
): boolean {
  if (!value) return false;
  const config = getCategoryMtmConfig(category);
  const option = config.optionSet.options.find((o) => o.key === optionKey);
  return !!option?.choices?.some((c) => c.value === value);
}

function getVisibleOptionKeys(
  category: MtmCategory,
  selections: CategorySelections,
): Set<string> {
  const config = getCategoryMtmConfig(category);
  const visibleKeys = new Set<string>();

  for (const option of config.optionSet.options) {
    if (!option.dependsOn) {
      visibleKeys.add(option.key);
      continue;
    }

    // Option is visible if all dependencies are satisfied
    const dependencySatisfied = Object.entries(option.dependsOn).every(
      ([depKey, depValue]) => {
        if (Array.isArray(depValue)) {
          return depValue.includes(selections[depKey] ?? '');
        }
        return selections[depKey] === depValue;
      },
    );

    if (dependencySatisfied) {
      visibleKeys.add(option.key);
    }
  }

  return visibleKeys;
}

/**
 * Validate category selections
 */
export function validateCategorySelections(
  category: MtmCategory,
  selections: CategorySelections,
): CategoryValidationResult {
  const config = getCategoryMtmConfig(category);
  const visibleKeys = getVisibleOptionKeys(category, selections);

  // Check for missing required fields
  const missingRequiredKeys = Array.from(visibleKeys).filter((key) => {
    const option = config.optionSet.options.find((o) => o.key === key);
    return option?.required && !selections[key];
  });

  // Check for invalid values
  const invalidValueKeys: string[] = [];
  for (const [key, value] of Object.entries(selections)) {
    if (!value) continue;

    const option = config.optionSet.options.find((o) => o.key === key);
    if (!option) {
      invalidValueKeys.push(key);
      continue;
    }

    // Value selected for hidden key is invalid stale state
    if (!visibleKeys.has(key)) {
      invalidValueKeys.push(key);
      continue;
    }

    // Value not in option choices
    if (!hasChoiceValue(category, key, value)) {
      invalidValueKeys.push(key);
    }
  }

  // Category-specific combination rules
  const invalidCombinationRules = validateCategoryRules(
    category,
    selections,
    visibleKeys,
  );

  const isValid =
    missingRequiredKeys.length === 0 &&
    invalidValueKeys.length === 0 &&
    invalidCombinationRules.length === 0;

  return {
    isValid,
    missingRequiredKeys,
    invalidValueKeys,
    invalidCombinationRules,
  };
}

/**
 * Validate category-specific combination rules
 * Subclasses override this to add category-specific validation
 */
function validateCategoryRules(
  category: MtmCategory,
  selections: CategorySelections,
  visibleKeys: Set<string>,
): string[] {
  const errors: string[] = [];

  switch (category) {
    case 'trouser':
      errors.push(...validateTrouserRules(selections));
      break;
    case 'jacket':
      errors.push(...validateJacketRules(selections));
      break;
    case 'shirt':
      errors.push(...validateShirtRules(selections));
      break;
    // Add more categories as implemented
    default:
      // No category-specific rules yet
      break;
  }

  return errors;
}

/**
 * Trouser-specific validation rules
 */
function validateTrouserRules(selections: CategorySelections): string[] {
  const errors: string[] = [];
  const style = selections.style;

  // Tuxedo contrast only with dress pants
  if (style !== 'dress_pants' && selections.tuxedo_contrast) {
    errors.push('tuxedo_contrast_requires_dress_pants');
  }

  // Lining not valid for jeans
  if (style === 'jeans' && selections.lining) {
    errors.push('lining_not_valid_for_jeans');
  }

  // Gurkha waistband not valid for drawstring
  if (style === 'drawstring' && selections.waistband === 'gurkha') {
    errors.push('gurkha_waistband_not_valid_for_drawstring');
  }

  // Decorative pleat not valid for jeans
  if (
    style === 'jeans' &&
    selections.front_style === 'double_pleats_decorative_flap_pocket'
  ) {
    errors.push('decorative_flap_pleats_not_valid_for_jeans');
  }

  return errors;
}

/**
 * Jacket-specific validation rules
 */
function validateJacketRules(selections: CategorySelections): string[] {
  const errors: string[] = [];

  // Add jacket-specific rules as needed
  // Example: certain button styles not valid for single-breasted

  return errors;
}

/**
 * Shirt-specific validation rules
 */
function validateShirtRules(selections: CategorySelections): string[] {
  const errors: string[] = [];

  // Add shirt-specific rules as needed
  // Example: french cuffs require specific collar types

  return errors;
}

/**
 * Check if selections are valid for commerce operations
 */
export function isSelectionsReadyForCommerce(
  category: MtmCategory,
  selections: CategorySelections,
): boolean {
  const validation = validateCategorySelections(category, selections);
  return validation.isValid;
}

/**
 * Get validation error summary
 */
export function formatValidationErrors(result: CategoryValidationResult): string {
  if (result.isValid) return '';

  const messages: string[] = [];
  if (result.missingRequiredKeys.length > 0) {
    messages.push(`Missing required: ${result.missingRequiredKeys.join(', ')}`);
  }
  if (result.invalidValueKeys.length > 0) {
    messages.push(`Invalid values: ${result.invalidValueKeys.join(', ')}`);
  }
  if (result.invalidCombinationRules.length > 0) {
    messages.push(`Invalid combinations: ${result.invalidCombinationRules.join(', ')}`);
  }
  return messages.join('; ');
}
