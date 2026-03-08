// lib/fit-logic.ts
export const calculateFitConfidence = (formData: any) => {
  const fields = Object.keys(formData);
  const filledFields = fields.filter(key => formData[key] && formData[key] !== '');
  
  // Base confidence starts at 85% if they finish the wizard
  // Each specific detail (Wedding date, posture, etc) adds precision
  const baseScore = 85;
  const bonus = (filledFields.length / fields.length) * 13;
  
  return Math.round(baseScore + bonus);
};