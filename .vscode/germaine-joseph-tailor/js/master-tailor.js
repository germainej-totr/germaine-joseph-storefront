/**
 * THE SECRET SAUCE LOGIC
 */
export function calculateStartingBlock(chestCm, waistCm, fitPreference, data) {
    // 1. Italian Base Math
    const jacketSize = Math.round(chestCm / 2);
    const trouserSize = Math.round((waistCm / 2) + 5);

    // 2. Select the Chart based on Metafield Fit Preference
    const dropKey = fitPreference === "Slim" ? "drop_8" : (fitPreference === "Classic" ? "drop_6" : "drop_7");
    const selectedDrop = data[dropKey];

    // 3. Lookup the Block Measurements
    const jacketBlock = selectedDrop.jacket[jacketSize] || null;
    const trouserBlock = selectedDrop.trouser[trouserSize] || null;

    // 4. Mismatch Detection
    const isMismatch = jacketSize !== trouserSize;
    let alertMessage = "";
    
    if (isMismatch) {
        alertMessage = `Digital Tailor Alert: This customer requires a size ${jacketSize} Jacket but a size ${trouserSize} Trouser. A mismatched block order is required.`;
    }

    return {
        jacketSize,
        trouserSize,
        drop: dropKey,
        measurements: { jacketBlock, trouserBlock },
        isMismatch,
        alertMessage
    };
}