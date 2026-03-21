export type MtmOptionType =
  | "radio"
  | "select"
  | "toggle"
  | "text"
  | "number"
  | "multiselect";

export type MtmChoice = {
  value: string;
  label: string;
  priceDelta?: number;
};

export type DependsOnRule = Record<string, string | string[]>;

export type MtmOption = {
  key: string;
  label: string;
  type: MtmOptionType;
  uiHint: "cards" | "buttons" | "dropdown" | "text" | "number";
  required: boolean;
  sortOrder: number;
  section: "design" | "details" | "construction" | "pockets" | "finish" | "formal_details";
  dependsOn?: DependsOnRule;
  choices?: MtmChoice[];
};

export type MtmOptionSet = {
  id: string;
  handle: string;
  title: string;
  category: "trouser";
  version: string;
  options: MtmOption[];
};

export const trouserOptionSet: MtmOptionSet = {
  id: "trouser-core-v1",
  handle: "trouser-core-v1",
  title: "Trouser Core v1",
  category: "trouser",
  version: "v1",
  options: [
    {
      key: "style",
      label: "Style",
      type: "radio",
      uiHint: "cards",
      required: true,
      sortOrder: 10,
      section: "design",
      choices: [
        { value: "dress_pants", label: "Dress Pants", priceDelta: 0 },
        { value: "chinos", label: "Chinos", priceDelta: 0 },
        { value: "linen_pants", label: "Linen Pants", priceDelta: 0 },
        { value: "jeans", label: "Jeans", priceDelta: 0 },
        { value: "corduroy_pants", label: "Corduroy Pants", priceDelta: 0 },
        { value: "drawstring", label: "Drawstring", priceDelta: 20 },
        { value: "wide_leg_pants", label: "Wide Leg Pants", priceDelta: 30 }
      ]
    },
    {
      key: "fit",
      label: "Fit",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 20,
      section: "design",
      choices: [
        { value: "slim", label: "Slim", priceDelta: 0 },
        { value: "regular_tailored", label: "Regular (Tailored)", priceDelta: 0 },
        { value: "classic", label: "Classic", priceDelta: 0 }
      ]
    },
    {
      key: "front_style",
      label: "Front Style",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 30,
      section: "design",
      dependsOn: {
        style: [
          "dress_pants",
          "chinos",
          "linen_pants",
          "corduroy_pants",
          "wide_leg_pants",
          "drawstring"
        ]
      },
      choices: [
        { value: "flat_front", label: "Flat Front", priceDelta: 0 },
        { value: "single_pleat", label: "Single Pleat", priceDelta: 20 },
        { value: "double_pleats", label: "Double Pleats", priceDelta: 30 },
        {
          value: "double_pleats_decorative_flap_pocket",
          label: "Double Pleats with Decorative Flap Pocket",
          priceDelta: 45
        }
      ]
    },
    {
      key: "buttons",
      label: "Buttons",
      type: "select",
      uiHint: "dropdown",
      required: true,
      sortOrder: 40,
      section: "details",
      choices: [
        { value: "real_horn", label: "Real Horn", priceDelta: 20 },
        { value: "real_mother_of_pearl", label: "Real Mother of Pearl", priceDelta: 25 },
        { value: "metal_plate", label: "Metal Plate", priceDelta: 20 },
        {
          value: "double_treatment_mother_of_pearl_imitation",
          label: "Double Treatment of Mother of Pearl Imitation",
          priceDelta: 10
        },
        {
          value: "mother_of_pearl_imitation",
          label: "Mother of Pearl Imitation",
          priceDelta: 0
        },
        { value: "horn_imitation", label: "Horn Imitation", priceDelta: 0 },
        { value: "ceremony_button", label: "Ceremony Button", priceDelta: 25 },
        { value: "metal_with_crest", label: "Metal with Crest", priceDelta: 30 }
      ]
    },
    {
      key: "waistband",
      label: "Waistband",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 50,
      section: "construction",
      dependsOn: {
        style: [
          "dress_pants",
          "chinos",
          "linen_pants",
          "corduroy_pants",
          "wide_leg_pants"
        ]
      },
      choices: [
        { value: "belt_loops", label: "Belt Loops", priceDelta: 0 },
        { value: "side_adjusters", label: "Side Adjusters", priceDelta: 25 },
        { value: "suspender_buttons", label: "Suspender Buttons", priceDelta: 20 },
        { value: "gurkha", label: "Gurkha", priceDelta: 60 }
      ]
    },
    {
      key: "fastening",
      label: "Fastening",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 60,
      section: "construction",
      dependsOn: {
        style: [
          "dress_pants",
          "chinos",
          "linen_pants",
          "corduroy_pants",
          "wide_leg_pants"
        ]
      },
      choices: [
        { value: "button_closure", label: "Button Closure", priceDelta: 0 },
        { value: "hook_and_bar", label: "Hook and Bar", priceDelta: 0 },
        { value: "extended_tab", label: "Extended Tab", priceDelta: 10 },
        {
          value: "split_tab_with_buttons",
          label: "Split Tab with Buttons",
          priceDelta: 20
        },
        {
          value: "tab_with_button_closure",
          label: "Tab with Button Closure",
          priceDelta: 10
        }
      ]
    },
    {
      key: "fly",
      label: "Fly",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 70,
      section: "construction",
      dependsOn: {
        style: [
          "dress_pants",
          "chinos",
          "linen_pants",
          "jeans",
          "corduroy_pants",
          "wide_leg_pants"
        ]
      },
      choices: [
        { value: "zipper", label: "Zipper", priceDelta: 0 },
        { value: "buttons", label: "Buttons", priceDelta: 15 }
      ]
    },
    {
      key: "front_pockets",
      label: "Front Pockets",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 80,
      section: "pockets",
      choices: [
        { value: "slant", label: "Slant", priceDelta: 0 },
        { value: "on_seam_pockets", label: "On-Seam Pockets", priceDelta: 0 },
        { value: "western_pockets", label: "Western Pockets", priceDelta: 15 },
        { value: "coin_pocket", label: "Coin Pocket", priceDelta: 10 }
      ]
    },
    {
      key: "back_pockets",
      label: "Back Pockets",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 90,
      section: "pockets",
      choices: [
        { value: "welt", label: "Welt", priceDelta: 0 },
        { value: "patch_pockets", label: "Patch Pockets", priceDelta: 10 },
        {
          value: "flap_pockets_button_closure",
          label: "Flap Pockets with Button Closure",
          priceDelta: 15
        },
        {
          value: "jetted_pockets_button_closure",
          label: "Jetted Pockets with Button Closure",
          priceDelta: 15
        }
      ]
    },
    {
      key: "lining",
      label: "Lining",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 100,
      section: "construction",
      dependsOn: {
        style: [
          "dress_pants",
          "linen_pants",
          "wide_leg_pants"
        ]
      },
      choices: [
        { value: "front_half", label: "Front Half", priceDelta: 0 },
        { value: "back_half", label: "Back Half", priceDelta: 0 },
        {
          value: "front_and_back_half",
          label: "Front and Back Half",
          priceDelta: 15
        },
        { value: "full_leg", label: "Full Leg", priceDelta: 30 }
      ]
    },
    {
      key: "hem_style",
      label: "Hem Style",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 110,
      section: "finish",
      choices: [
        { value: "plain_hem", label: "Plain Hem", priceDelta: 0 },
        { value: "turn_up", label: "Turn Up", priceDelta: 20 },
        { value: "angled", label: "Angled", priceDelta: 15 },
        { value: "unfinished", label: "Unfinished", priceDelta: 0 }
      ]
    },
    {
      key: "tuxedo_contrast",
      label: "Tuxedo Contrast",
      type: "radio",
      uiHint: "buttons",
      required: true,
      sortOrder: 120,
      section: "formal_details",
      dependsOn: {
        style: ["dress_pants"]
      },
      choices: [
        { value: "none", label: "None", priceDelta: 0 },
        {
          value: "silk_satin_inseam",
          label: "Silk Satin Inseam",
          priceDelta: 40
        },
        {
          value: "silk_satin_waistband",
          label: "Silk Satin Waistband",
          priceDelta: 40
        },
        {
          value: "full_tuxedo_trim",
          label: "Full Tuxedo Trim",
          priceDelta: 80
        }
      ]
    }
  ]
};

export function isOptionVisible(
  option: MtmOption,
  selections: Record<string, string | string[] | undefined>
): boolean {
  if (!option.dependsOn) return true;

  return Object.entries(option.dependsOn).every(([depKey, depValue]) => {
    const selected = selections[depKey];

    if (Array.isArray(depValue)) {
      if (Array.isArray(selected)) {
        return selected.some((v) => depValue.includes(v));
      }
      return typeof selected === "string" ? depValue.includes(selected) : false;
    }

    if (Array.isArray(selected)) {
      return selected.includes(depValue);
    }

    return selected === depValue;
  });
}

export function getVisibleTrouserOptions(
  selections: Record<string, string | string[] | undefined>
): MtmOption[] {
  return [...trouserOptionSet.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((option) => isOptionVisible(option, selections));
}
