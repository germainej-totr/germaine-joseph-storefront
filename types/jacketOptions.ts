import type { MtmOptionSet } from '@/types/trouserOptions';

/**
 * Jacket MTM option set
 * Defines available customisation options for blazers, sport coats, and suit jackets.
 * Conforms to the shared MtmOptionSet / MtmOption schema.
 */
export const jacketOptionSet: MtmOptionSet = {
  id: 'jacket-core-v1',
  handle: 'jacket-core-v1',
  title: 'Jacket Core v1',
  category: 'jacket',
  version: 'v1',
  options: [
    {
      key: 'style',
      label: 'Jacket Style',
      type: 'radio',
      uiHint: 'cards',
      required: true,
      sortOrder: 10,
      section: 'design',
      choices: [
        { value: 'sport_coat', label: 'Sport Coat', priceDelta: 0 },
        { value: 'blazer', label: 'Blazer', priceDelta: 0 },
        { value: 'suit_jacket', label: 'Suit Jacket', priceDelta: 0 },
        { value: 'casual_jacket', label: 'Casual Jacket', priceDelta: 0 },
      ],
    },
    {
      key: 'button_count',
      label: 'Number of Buttons',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 20,
      section: 'design',
      choices: [
        { value: 'one_button', label: 'One Button', priceDelta: 0 },
        { value: 'two_button', label: 'Two Buttons', priceDelta: 0 },
        { value: 'three_button', label: 'Three Buttons', priceDelta: 2000 },
      ],
    },
    {
      key: 'lapel_width',
      label: 'Lapel Width',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 30,
      section: 'design',
      choices: [
        { value: 'narrow', label: 'Narrow (1.75")', priceDelta: 0 },
        { value: 'standard', label: 'Standard (2.25")', priceDelta: 0 },
        { value: 'wide', label: 'Wide (2.75")', priceDelta: 0 },
      ],
    },
    {
      key: 'lapel_type',
      label: 'Lapel Type',
      type: 'radio',
      uiHint: 'cards',
      required: true,
      sortOrder: 40,
      section: 'design',
      choices: [
        { value: 'notch', label: 'Notch Lapel', priceDelta: 0 },
        { value: 'peak', label: 'Peak Lapel', priceDelta: 3000 },
        { value: 'shawl', label: 'Shawl Collar', priceDelta: 5000 },
      ],
    },
    {
      key: 'pocket_style',
      label: 'Pocket Style',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 50,
      section: 'pockets',
      choices: [
        { value: 'patch_pockets', label: 'Patch Pockets', priceDelta: 0 },
        { value: 'flap_pockets', label: 'Flap Pockets', priceDelta: 0 },
        { value: 'welt_pockets', label: 'Welt Pockets', priceDelta: 1500 },
        { value: 'ticket_pocket', label: 'With Ticket Pocket', priceDelta: 2500 },
      ],
    },
    {
      key: 'sleeve_style',
      label: 'Sleeve Style',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 60,
      section: 'construction',
      choices: [
        { value: 'standard', label: 'Standard Sleeve', priceDelta: 0 },
        { value: 'functional_cuff', label: 'Functional Cuff', priceDelta: 2000 },
        { value: 'raglan', label: 'Raglan Sleeve', priceDelta: 0 },
      ],
    },
    {
      key: 'lining',
      label: 'Lining',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 70,
      section: 'construction',
      choices: [
        { value: 'full_lining', label: 'Full Lining', priceDelta: 4000 },
        { value: 'half_lining', label: 'Half Lining', priceDelta: 2000 },
        { value: 'no_lining', label: 'Unlined', priceDelta: 0 },
      ],
    },
    {
      key: 'back_vents',
      label: 'Back Vents',
      type: 'radio',
      uiHint: 'buttons',
      required: true,
      sortOrder: 80,
      section: 'construction',
      choices: [
        { value: 'no_vents', label: 'No Vents', priceDelta: 0 },
        { value: 'single_vent', label: 'Single Vent', priceDelta: 0 },
        { value: 'double_vents', label: 'Double Vents', priceDelta: 1500 },
      ],
    },
    {
      key: 'button_finish',
      label: 'Button Material',
      type: 'select',
      uiHint: 'dropdown',
      required: false,
      sortOrder: 90,
      section: 'finish',
      choices: [
        { value: 'standard_buttons', label: 'Standard Buttons', priceDelta: 0 },
        { value: 'horn_buttons', label: 'Horn Buttons', priceDelta: 1000 },
        { value: 'leather_buttons', label: 'Leather Buttons', priceDelta: 1500 },
        { value: 'mother_of_pearl', label: 'Mother of Pearl', priceDelta: 3500 },
      ],
    },
  ],
};

