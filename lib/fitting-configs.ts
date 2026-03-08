// lib/fitting-configs.ts

export interface FittingField {
  id: string;
  label: string;
  type: 'cm' | 'adjustment' | 'option' | 'text' | 'section_break';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ProductionConfig {
  id: string;
  label: string;
  category: 'Bespoke' | 'MTM_Black' | 'MTM_Red' | 'Shirt';
  gender: 'Male' | 'Female';
  blocks?: string[];
  fields: FittingField[];
}

export const FITTING_CONFIGS: Record<string, ProductionConfig> = {
  // --- 1. BLACK LABEL - ITALIAN MTM (MALE) ---
  "black_label_male": {
    id: "black_label_male",
    label: "Black Label - Italian MTM (Male)",
    category: "MTM_Black",
    gender: "Male",
    blocks: ["42S", "44R", "44S", "46R", "46C", "46S", "48R", "50R", "50C", "50S", "52R", "52C", "52S", "54R", "54C", "54S", "56R", "56C", "56S", "58R", "58C", "58S", "60R", "60C", "62R", "62C", "64C", "66C", "68C"],
    fields: [
      { id: "SEC_J", label: "TRIED TEST JACKET", type: "section_break" },
      { id: "1G", label: "JACKET LENGTH", type: "adjustment", min: -8, max: 10 },
      { id: "2G_L", label: "INSIDE SLEEVE LENGTH - LEFT", type: "adjustment", min: -8, max: 10 },
      { id: "2G_R", label: "INSIDE SLEEVE LENGTH - RIGHT", type: "adjustment", min: -8, max: 10 },
      { id: "3G", label: "TAKE IN/LET OUT SKIRT", type: "adjustment", min: -6, max: 10 },
      { id: "4G", label: "TAKE IN/LET OUT BACK WAIST", type: "adjustment", min: -6, max: 10 },
      { id: "5G", label: "TAKE IN/LET OUT AT SHOULDER BLADES", type: "adjustment", min: -3, max: 3 },
      { id: "6G", label: "TAKE IN/LET OUT SHOULDER POINT TO POINT", type: "adjustment", min: -4, max: 4 },
      { id: "7G", label: "TAKE IN/LET OUT ARMHOLE", type: "adjustment", min: -2, max: 2 },
      { id: "8G", label: "REDUCE EXCESS FABRIC BELOW COLLAR", type: "adjustment", max: 2 },
      { id: "9G", label: "STOOPING POSTURE: ADD FABRIC AT COLLAR", type: "adjustment", max: 3 },
      { id: "10G", label: "\"MILITARY\" POSTURE: REDUCE FABRIC AT COLLAR", type: "adjustment", max: 3 },
      { id: "11G", label: "TAKE IN/LET OUT CUFFS", type: "adjustment", min: -2, max: 2 },
      { id: "12G", label: "TAKE IN/LET OUT CHEST", type: "adjustment", min: -3, max: 3 },
      { id: "13G", label: "RAISE/LOWER SHOULDERS", type: "adjustment", min: -3, max: 3 },
      { id: "14G", label: "ROTATE SLEEVE FORWARD (ONLY 1 cm)", type: "option", options: ["APPLY"] },
      { id: "15G", label: "ROTATE SLEEVE BACKWARD (ONLY 4 cm)", type: "option", options: ["APPLY"] },
      { id: "18G", label: "REDUCE GAP AROUND NECK (ONLY 1 cm)", type: "option", options: ["APPLY"] },
      { id: "19G", label: "PROMINENT STOMACH: REDUCE EXCESS AT HEM (ONLY 1 cm)", type: "option", options: ["APPLY"] },
      { id: "21G", label: "TAKE IN/LET OUT FRONT WAIST", type: "adjustment" },
      { id: "23G", label: "ADJUSTMENT AT THE FRONT CLOSURE", type: "adjustment" },
      { id: "SEC_P", label: "TRIED TEST PANT", type: "section_break" },
      { id: "1P_L", label: "INSIDE LEG LENGTH - LEFT", type: "adjustment" },
      { id: "1P_R", label: "INSIDE LEG LENGTH - RIGHT", type: "adjustment" },
      { id: "2P", label: "PANT BOTTOM WIDTH", type: "adjustment", min: -5, max: 5 },
      { id: "3P", label: "TAKE IN/LET OUT HIPS", type: "adjustment", min: -3, max: 3 },
      { id: "4P", label: "TAKE IN/LET OUT PANT WAIST", type: "adjustment", min: -3, max: 5 },
      { id: "5P", label: "TAKE IN/LET OUT CROTCH", type: "adjustment", min: -2, max: 3 },
      { id: "6P", label: "TAKE IN/LET OUT THIGH", type: "adjustment", min: -4, max: 4 },
      { id: "7P", label: "REDUCE/INCREASE RISE", type: "adjustment", min: -3, max: 6 },
      { id: "8P", label: "FOLDS AT FRONT: LOWER THE FRONT", type: "adjustment", max: -3 },
      { id: "9P", label: "REDUCE EXCESS FABRIC BELOW WAISTBAND", type: "adjustment", max: -3 },
      { id: "10P", label: "HEM WITH TURN UP", type: "adjustment", max: 5 },
      { id: "SEC_V", label: "TRIED TEST VEST", type: "section_break" },
      { id: "1J", label: "VEST LENGTH", type: "adjustment", min: -5, max: 7 },
      { id: "2J", label: "TAKE IN/LET OUT VEST WAIST", type: "adjustment", min: -4, max: 4 },
      { id: "3J", label: "TAKE IN/LET OUT VEST CHEST", type: "adjustment" }
    ]
  },

  // --- 2. BESPOKE MALE MASTER DRAFT ---
  "bespoke_male": {
    id: "bespoke_male",
    label: "Bespoke - Male Master Draft",
    category: "Bespoke",
    gender: "Male",
    fields: [
      { id: "SEC_BJ", label: "JACKET", type: "section_break" },
      { id: "Neck", label: "Neck", type: "cm" },
      { id: "Shoulder", label: "Shoulder", type: "cm" },
      { id: "Chest", label: "Chest", type: "cm" },
      { id: "Across Chest", label: "Across Chest", type: "cm" },
      { id: "Across Back", label: "Across Back", type: "cm" },
      { id: "Upper Stomach", label: "Upper Stomach", type: "cm" },
      { id: "Stomach", label: "Stomach", type: "cm" },
      { id: "Waistline", label: "Waistline", type: "cm" },
      { id: "Hips", label: "Hips", type: "cm" },
      { id: "Sleeve", label: "Sleeve", type: "cm" },
      { id: "Biceps", label: "Biceps", type: "cm" },
      { id: "Armhole", label: "Armhole", type: "cm" },
      { id: "Wrist", label: "Wrist", type: "cm" },
      { id: "Length", label: "Length", type: "cm" },
      { id: "Back length", label: "Back length", type: "cm" },
      { id: "SEC_BP", label: "TROUSER", type: "section_break" },
      { id: "T_Waist", label: "Waist", type: "cm" },
      { id: "T_Hips", label: "Hips", type: "cm" },
      { id: "T_Crotch", label: "Crotch", type: "cm" },
      { id: "T_Thigh", label: "Thigh", type: "cm" },
      { id: "T_Knee", label: "Knee", type: "cm" },
      { id: "T_Cuff", label: "Cuff", type: "cm" },
      { id: "T_Inseam", label: "Inseam", type: "cm" },
      { id: "T_Length", label: "Length", type: "cm" }
    ]
  },

  // --- 3. RED LABEL MALE SUIT ---
  "red_label_male_suit": {
    id: "red_label_male_suit",
    label: "Red Label - MTM Male Suit",
    category: "MTM_Red",
    gender: "Male",
    blocks: ["21/42S", "22/44S", "23/46S", "24/48S", "25/50S", "26/52S", "27/54S", "28/56S", "29/58S", "30/60S", "31/62S", "32/64S (+€36.00)", "33/66S (+€36.00)", "34/68S (+€36.00)", "35/70 (+€36.00)", "36/72S (+€72.00)", "42R", "44R", "46R", "48R", "50R", "52R", "54R", "56R", "58R", "60R", "62R", "64R (+€36.00)", "66R (+€36.00)", "68R (+€36.00)", "70R (+€36.00)", "72R (+€72.00)", "74R (+€72.00)", "76R (+€72.00)", "78R (+€72.00)", "80R (+€72.00)", "82R (+€72.00)", "86/42L", "88/44L", "90/46L", "94/48L", "98/50L", "102/52L", "106/54L", "110/56L", "114/58L", "118/60L", "122/62L", "126/64L (+€36.00)"],
    fields: [
      { id: "SEC_RJ", label: "MODEL JACKET", type: "section_break" },
      { id: "101", label: "101. JACKET LENGTH", type: "cm", min: 40, max: 120, step: 0.5 },
      { id: "102", label: "102. SLEEVE LENGTH", type: "cm", min: 40, max: 107.5, step: 0.5 },
      { id: "130", label: "130. WAIST WIDTH", type: "cm", min: 30, max: 120, step: 0.5 },
      { id: "103", label: "103. BACK NECK HEIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "104", label: "104. SHOULDER LENGTH BACK", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "105", label: "105. FRONT LENGTH", type: "cm", min: -3, max: 3, step: 0.5 },
      { id: "106", label: "106. WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "107", label: "107. CHEST FRONT PART", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "108", label: "108. WAIST WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "109", label: "109. WAIST WIDTH SIDE SEAM", type: "cm", min: -3, max: -0.5, step: 0.5 },
      { id: "110", label: "110. WAIST AND HIP WIDTH SIDE SEAM", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "111", label: "111. HIP WIDTH", type: "cm", min: -4, max: 10, step: 0.5 },
      { id: "112", label: "112. NECK WIDTH ON THE BACK", type: "cm", min: -1.5, max: 1.5, step: 0.5 },
      { id: "113", label: "113. TIDE BACK MIDDLE SEAM", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "114", label: "114. SLEEVE HEIGHT", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "115", label: "115. ARMHOLE WIDTH ON THE BACK", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "116", label: "116. ARMHOLE DEPTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "117", label: "117. ACROSS SHOULDER WIDTH", type: "cm", min: 30, max: 120, step: 0.5 },
      { id: "118", label: "118. BACK WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "119", label: "119. SHOULDER HEIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "120", label: "120. SHOULDER HEIGHT BACK ONLY", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "121", label: "121. ELBOW HEIGHT", type: "cm", min: -3, max: 3, step: 0.5 },
      { id: "122", label: "122. BUTTON HEIGHT", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "126", label: "126. BICEPS WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "127", label: "127. SLEEVE CUFF", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "128", label: "128. BOWLER SLEEVE WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "131", label: "131. LAPEL WIDTH", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "SEC_RP", label: "MODEL TROUSER", type: "section_break" },
      { id: "1", label: "1. OUTSIDE SEAM LENGTH", type: "cm", min: 73, max: 120, step: 0.5 },
      { id: "2", label: "2. WAIST WIDTH", type: "cm", min: 25, max: 120, step: 0.5 },
      { id: "3", label: "3. BOTTOM HEM WIDTH", type: "cm", min: 13, max: 30, step: 0.5 },
      { id: "4", label: "4. DEPTH FRONT PART", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "5", label: "5. TOTAL DEPTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "6", label: "6. DEPTH BACK PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "7", label: "7. THIGH WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "9", label: "9. KNEE WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "10", label: "10. HIP WIDTH", type: "cm", min: -4, max: 4, step: 0.5 }
    ]
  },

  // --- 4. RED LABEL FEMALE SUIT ---
  "red_label_female_suit": {
    id: "red_label_female_suit",
    label: "Red Label - MTM Female Suit",
    category: "MTM_Red",
    gender: "Female",
    blocks: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    fields: [
      { id: "SEC_RFJ", label: "MODEL JACKET", type: "section_break" },
      { id: "101", label: "101. JACKET LENGTH", type: "cm", min: 40, max: 120, step: 0.5 },
      { id: "102", label: "102. SLEEVE LENGTH", type: "cm", min: 40, max: 107.5, step: 0.5 },
      { id: "130", label: "130. WAIST WIDTH", type: "cm", min: 30, max: 120, step: 0.5 },
      { id: "103", label: "103. BACK NECK HEIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "104", label: "104. SHOULDER LENGTH BACK", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "105", label: "105. FRONT LENGTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "106", label: "106. WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "107", label: "107. CHEST FRONT PART", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "108", label: "108. WAIST WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "109", label: "109. WAIST WIDTH SIDE SEAM", type: "cm", min: -3, max: -0.5, step: 0.5 },
      { id: "110", label: "110. WAIST AND HIP WIDTH SIDE SEAM", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "111", label: "111. HIP WIDTH", type: "cm", min: -4, max: 10, step: 0.5 },
      { id: "112", label: "112. NECK WIDTH ON THE BACK", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "113", label: "113. TIDE BACK MIDDLE SEAM", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "114", label: "114. SLEEVE HEIGHT", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "115", label: "115. ARMHOLE WIDTH ON THE BACK", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "116", label: "116. ARMHOLE DEPTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "117", label: "117. ACROSS SHOULDER WIDTH", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "118", label: "118. BACK WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "119", label: "119. SHOULDER HEIGHT", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "120", label: "120. SHOULDER HEIGHT BACK ONLY", type: "cm", min: -1.5, max: 1.5, step: 0.5 },
      { id: "121", label: "121. ELBOW HEIGHT", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "122", label: "122. BUTTON HEIGHT", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "126", label: "126. BICEPS WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "127", label: "127. SLEEVE CUFF", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "128", label: "128. BOWLER SLEEVE WIDTH", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "131", label: "131. LAPEL WIDTH", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "SEC_RFP", label: "MODEL TROUSER", type: "section_break" },
      { id: "1", label: "1. OUTSIDE SEAM LENGTH", type: "cm", min: 73, max: 128, step: 0.5 },
      { id: "2", label: "2. WAIST WIDTH", type: "cm", min: 25, max: 120, step: 0.5 },
      { id: "3", label: "3. BOTTOM HEM WIDTH", type: "cm", min: 13, max: 43, step: 0.5 },
      { id: "4", label: "4. DEPTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "5", label: "5. TOTAL DEPTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "6", label: "6. DEPTH BACK PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "7", label: "7. THIGH WIDTH", type: "cm", min: -2, max: 3, step: 0.5 },
      { id: "9", label: "9. KNEE WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "10", label: "10. HIP WIDTH", type: "cm", min: -2, max: 2, step: 0.5 }
    ]
  },

  // --- 5. RED LABEL FEMALE SKIRT ---
  "red_label_female_skirt": {
    id: "red_label_female_skirt",
    label: "Red Label - MTM Female Skirt",
    category: "MTM_Red",
    gender: "Female",
    blocks: ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    fields: [
      { id: "SEC_SK", label: "MODEL LADY SKIRT", type: "section_break" },
      { id: "SKIRT LENGTH", label: "SKIRT LENGTH", type: "cm", min: -15, max: 15, step: 0.5 },
      { id: "SKIRT WAIST WIDTH", label: "SKIRT WAIST WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "HIP WIDH", label: "HIP WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "TOTAL DEPTH", label: "TOTAL DEPTH", type: "cm", min: -4, max: 4, step: 0.5 }
    ]
  },

  // --- 6. RED LABEL MALE OVERCOAT ---
  "red_label_male_overcoat": {
    id: "red_label_male_overcoat",
    label: "Red Label - MTM Male Overcoat",
    category: "MTM_Red",
    gender: "Male",
    blocks: ["22/44S", "23/46S", "24/48S", "25/50S", "26/52S", "27/54S", "28/56S", "29/58S", "30/60S", "31/62S", "32/64S (+€30.00)", "33/66S (+€30.00)", "34/68S (+€30.00)", "42R", "44R", "46R", "48R", "50R", "52R", "58R", "60R", "62R", "64R (+€30.00)", "66R (+€30.00)", "68R (+€30.00)", "70R (+€30.00)", "72R (+€72.00)", "74R (+€72.00)", "76R (+€72.00)", "78R (+€72.00)", "80R (+€72.00)", "82R (+€72.00)", "88/44L", "90/46L", "94/48L", "98/50L", "102/52L", "106/54L", "110/56L", "114/58L", "118/60L", "122/62L", "126/64L (+€36.00)", "130/66L (+€36.00)", "134/68L (+€36.00)"],
    fields: [
      { id: "SEC_OC", label: "MODEL OVERCOAT", type: "section_break" },
      { id: "101", label: "101. OVERCOAT LENGHT", type: "cm", min: 50, max: 150, step: 0.5 },
      { id: "102", label: "102. SLEEVE LENGTH", type: "cm", min: 48.5, max: 90, step: 0.5 },
      { id: "130", label: "130. WAIST WIDTH", type: "cm", min: 41.5, max: 120, step: 0.5 },
      { id: "117_OC", label: "117. ACROSS SHOULDER WIDTH", type: "cm", min: 37, max: 80, step: 0.5 },
      { id: "103", label: "103. BACK NECK HEIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "104", label: "104. SHOULDER LENGTH BACK", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "105", label: "105. FRONT LENGTH", type: "cm", min: -3, max: 3, step: 0.5 },
      { id: "106", label: "106. WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "107", label: "107. CHEST FRONT PART", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "108", label: "108. WAIST WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "109", label: "109. WAIST WIDTH SIDE SEAM", type: "cm", min: -3, max: -0.5, step: 0.5 },
      { id: "110", label: "110. WAIST AND HIP WIDTH SIDE SEAM", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "111", label: "111. HIP WIDTH", type: "cm", min: -4, max: 10, step: 0.5 },
      { id: "112", label: "112. NECK WIDTH ON THE BACK", type: "cm", min: -1.5, max: 1.5, step: 0.5 },
      { id: "113", label: "113. TIDE BACK MIDDLE SEAM", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "114", label: "114. SLEEVE HEIGHT", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "115", label: "115. ARMHOLE WIDTH ON THE BACK", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "116", label: "116. ARMHOLE DEPTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "118", label: "118. BACK WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "119", label: "119. SHOULDER HEIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "120", label: "120. SHOULDER HEIGHT BACK ONLY", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "121", label: "121. ELBOW HEIGHT", type: "cm", min: -3, max: 3, step: 0.5 },
      { id: "122", label: "122. BUTTON HEIGHT", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "126", label: "126. BICEPS WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "127", label: "127. SLEEVE CUFF", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "128", label: "128. BOWLER SLEEVE WIDTH", type: "cm", min: -1.0, max: 1.0, step: 0.5 },
      { id: "131", label: "131. LAPEL WIDTH", type: "cm", min: -3, max: 3, step: 0.5 }
    ]
  },

  // --- 7. RED LABEL FEMALE OVERCOAT ---
  "red_label_female_overcoat": {
    id: "red_label_female_overcoat",
    label: "Red Label - MTM Female Overcoat",
    category: "MTM_Red",
    gender: "Female",
    blocks: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    fields: [
      { id: "SEC_FOC", label: "MODEL LADY OVERCOAT", type: "section_break" },
      { id: "101", label: "101. OVERCOAT LENGHT", type: "cm", min: 50, max: 150, step: 0.5 },
      { id: "102", label: "102. SLEEVE LENGHT OVERCOAT", type: "cm", min: 48.5, max: 90, step: 0.5 },
      { id: "130", label: "130. WAIST WIDTH OVERCOAT", type: "cm", min: 41.5, max: 120, step: 0.5 },
      { id: "117_FOC", label: "117. ACROSS SHOULDER WIDTH OVERCOAT", type: "cm", min: 37, max: 80, step: 0.5 },
      { id: "103", label: "103. BАCK NECK HIGHT", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "104", label: "104. SHOULDER LENGHT BACK", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "105", label: "105. FRONT LENGHT", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "106", label: "106. WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "107", label: "107. CHEST FRONT PART", type: "cm", min: -2, max: -0.5, step: 0.5 },
      { id: "108", label: "108. WAIST WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "109", label: "109. WAIST WIDTH SIDE SEAM", type: "cm", min: -3, max: -0.5, step: 0.5 },
      { id: "110", label: "110. WAIST AND HIP WIDTH SIDE SEAM", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "111", label: "111. HIP WIDTH", type: "cm", min: -4, max: 10, step: 0.5 },
      { id: "112", label: "112. NECK WIDTH ON THE BACK", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "113", label: "113. TIDE BACK MIDDLE SEAM", type: "cm", min: -1, max: -0.5, step: 0.5 },
      { id: "114", label: "114. SLEEVE HЕIGHT", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "115", label: "115. ARMHOLE WIDTH ON THE FRONT", type: "cm", min: -1.0, max: -0.5, step: 0.5 },
      { id: "116", label: "116. ARMHOLE DEPTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "117", label: "117. ACROSS SHOULDER WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "118", label: "118. BACK WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "119", label: "119. SHOULDER HEIGHT", type: "cm", min: -1.0, max: -0.5, step: 0.5 },
      { id: "120", label: "120. SHOULDER HIGHT BACK ONLY", type: "cm", min: -1.5, max: 1.5, step: 0.5 },
      { id: "121", label: "121. ELBOW LENGTH", type: "cm", min: -1, max: 1, step: 0.5 },
      { id: "122", label: "122. BUTTON HEIGHT", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "126", label: "126. BICEPS WIDTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "127", label: "127. SLEEVE CUFF", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "128", label: "128. BOWLER SLEEVE WIDTH", type: "cm", min: -1.0, max: 1.0, step: 0.5 },
      { id: "131", label: "131. LAPEL WIDTH", type: "cm", min: -3, max: 3, step: 0.5 }
    ]
  },

  // --- 8. RED LABEL MALE WAISTCOAT ---
  "red_label_male_waistcoat": {
    id: "red_label_male_waistcoat",
    label: "Red Label - MTM Male Waistcoat",
    category: "MTM_Red",
    gender: "Male",
    blocks: ["21/42S", "22/44S", "23/46S", "24/48S", "25/50S", "26/52S", "27/54S", "28/56S", "29/58S", "30/60S", "31/62S", "32/64S (+€24.00)", "33/66S (+24.00)", "34/68S (+€24.00)", "35/70 (+€24.00)", "36/72S (+€48.00)", "42R", "44R", "46R", "48R", "50R", "52R", "54R", "56R", "58R", "60R", "62R", "64R (+€24.00)", "66R (+€24.00)", "68R (+€24.00)", "70R (+€48.00)", "72R (+€48.00)", "74R (+€48.00)", "76R (+€48.00)", "78R (+€48.00)", "80R (+€48.00)", "82R (+€48.00)", "86/42L", "88/44L", "90/46L", "94/48L", "98/50L", "102/52L", "106/54L", "110/56L", "114/58L", "118/60L", "122/62L", "126/64L (+€24.00)"],
    fields: [
      { id: "SEC_W", label: "MODEL WAISTCOAT", type: "section_break" },
      { id: "1", label: "1. BACK LENGTH WAISTCOAT", type: "cm", min: 36, max: 110, step: 0.5 },
      { id: "2", label: "2. WAIST WIDTH WAISTCOAT", type: "cm", min: 25.5, max: 120, step: 0.5 },
      { id: "3", label: "3. SHOULDER WIDTH WAISTCOAT", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "W5", label: "W5. FRONT LENGTH", type: "cm", min: 0.5, max: 2, step: 0.5 },
      { id: "W6", label: "W6. WIDTH FRONT PART", type: "cm", min: 0.5, max: 2, step: 0.5 },
      { id: "W8", label: "W8. WAIST WIDTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "16", label: "16. ARMHOLE DEPTH", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "21", label: "21. WAIST AND HIP SIDE SEAM WIDTH", type: "cm", min: -2, max: 2, step: 0.5 }
    ]
  },

  // --- 9. RED LABEL MALE TROUSER ---
  "red_label_male_trouser": {
    id: "red_label_male_trouser",
    label: "Red Label - MTM Male Trouser",
    category: "MTM_Red",
    gender: "Male",
    blocks: ["21/42S", "22/44S", "23/46S", "24/48S", "25/50S", "26/52S", "27/54S", "28/56S", "29/58S", "30/60S", "31/62S", "32/64S (+€36.00)", "33/66S (+€36.00)", "34/68S (+€36.00)", "35/70 (+€36.00)", "36/72S (+€72.00)", "42R", "44R", "46R", "48R", "50R", "52R", "54R", "56R", "58R", "60R", "62R", "64R (+€36.00)", "66R (+€36.00)", "68R (+€36.00)", "70R (+€36.00)", "72R (+€72.00)", "74R (+€72.00)", "76R (+€72.00)", "78R (+€72.00)", "80R (+€72.00)", "82R (+€72.00)", "86/42L", "88/44L", "90/46L", "94/48L", "98/50L", "102/52L", "106/54L", "110/56L", "114/58L", "118/60L", "122/62L", "126/64L (+€36.00)"],
    fields: [
      { id: "SEC_FT", label: "MODEL TROUSER", type: "section_break" },
      { id: "1", label: "1. OUTSIDE SEAM LENGTH", type: "cm", min: 73, max: 128, step: 0.5 },
      { id: "2", label: "2. WAIST WIDTH", type: "cm", min: 25, max: 120, step: 0.5 },
      { id: "3", label: "3. BOTTOM HEM WIDTH", type: "cm", min: 13, max: 43, step: 0.5 },
      { id: "4", label: "4. DEPTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "5", label: "5. TOTAL DEPTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "6", label: "6. DEPTH BACK PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "7", label: "7. THIGH WIDTH", type: "cm", min: -2, max: 3, step: 0.5 },
      { id: "9", label: "9. KNEE WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "10", label: "10. HIP WIDTH", type: "cm", min: -2, max: 2, step: 0.5 }
    ]
  },

  // --- 10. RED LABEL FEMALE TROUSER ---
  "red_label_female_trouser": {
    id: "red_label_female_trouser",
    label: "Red Label - MTM Female Trouser",
    category: "MTM_Red",
    gender: "Female",
    blocks: ["30", "32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"],
    fields: [
      { id: "SEC_FT", label: "MODEL TROUSER", type: "section_break" },
      { id: "1", label: "1. OUTSIDE SEAM LENGTH", type: "cm", min: 73, max: 128, step: 0.5 },
      { id: "2", label: "2. WAIST WIDTH", type: "cm", min: 25, max: 120, step: 0.5 },
      { id: "3", label: "3. BOTTOM HEM WIDTH", type: "cm", min: 13, max: 43, step: 0.5 },
      { id: "4", label: "4. DEPTH FRONT PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "5", label: "5. TOTAL DEPTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "6", label: "6. DEPTH BACK PART", type: "cm", min: -2, max: 2, step: 0.5 },
      { id: "7", label: "7. THIGH WIDTH", type: "cm", min: -2, max: 3, step: 0.5 },
      { id: "9", label: "9. KNEE WIDTH", type: "cm", min: -4, max: 4, step: 0.5 },
      { id: "10", label: "10. HIP WIDTH", type: "cm", min: -2, max: 2, step: 0.5 }
    ]
  },

  // --- 11. SHIRT MALE ---
  "shirt_male": {
    id: "shirt_male",
    label: "Shirt - Male",
    category: "Shirt",
    gender: "Male",
    fields: [
      { id: "SEC_S", label: "SHIRT", type: "section_break" },
      { id: "Neck", label: "Neck", type: "cm" },
      { id: "Shoulders", label: "Shoulders", type: "cm" },
      { id: "Chest", label: "Chest", type: "cm" },
      { id: "Stomach", label: "Stomach", type: "cm" },
      { id: "Hips", label: "Hips", type: "cm" },
      { id: "Sleeves", label: "Sleeves", type: "cm" },
      { id: "Biceps", label: "Biceps", type: "cm" },
      { id: "Wrist/Cuff", label: "Wrist/Cuff", type: "cm" },
      { id: "Length Front", label: "Length Front", type: "cm" },
      { id: "Length Back", label: "Length Back", type: "cm" }
    ]
  },

  // --- 12. SHIRT FEMALE ---
  "shirt_female": {
    id: "shirt_female",
    label: "Shirt - Female",
    category: "Shirt",
    gender: "Female",
    fields: [
      { id: "SEC_FS", label: "SHIRT / BLOUSE", type: "section_break" },
      { id: "Neck", label: "Neck", type: "cm" },
      { id: "Shoulders", label: "Shoulders", type: "cm" },
      { id: "Bust", label: "Bust", type: "cm" },
      { id: "Waist", label: "Waist", type: "cm" },
      { id: "Hips", label: "Hips", type: "cm" },
      { id: "Sleeves", label: "Sleeves", type: "cm" },
      { id: "Biceps", label: "Biceps", type: "cm" },
      { id: "Wrist/Cuff", label: "Wrist/Cuff", type: "cm" },
      { id: "Blouse Length Front", label: "Blouse Length Front", type: "cm" },
      { id: "Length Back", label: "Length Back", type: "cm" }
    ]
  }
};