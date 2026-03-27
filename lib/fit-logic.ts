// lib/fit-logic.ts
export const calculateFitConfidence = (formData: Record<string, unknown>) => {
  const fields = Object.keys(formData);
  const filledFields = fields.filter((key) => {
    const value = formData[key];
    return value !== undefined && value !== null && value !== '';
  });
  
  // Base confidence starts at 85% if they finish the wizard
  // Each specific detail (Wedding date, posture, etc) adds precision
  const baseScore = 85;
  const bonus = (filledFields.length / fields.length) * 13;
  
  return Math.round(baseScore + bonus);
};