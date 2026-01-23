

export const filterExamWorthySentences = (text) =>{
  
  if (!text || text.trim() === '') return '';

  const examPatterns = [
    // Definitions & Explanations
      /\bis defined as\b/i,
      /\brefers to\b/i,
      /\bis known as\b/i,
      /\bmeans that\b/i,
      /\bis called\b/i,
      /\bis termed\b/i,
      /\bcan be described as\b/i,
      
      // Cause & Effect
      /\bresults in\b/i,
      /\bleads to\b/i,
      /\bcauses\b/i,
      /\bdue to\b/i,
      /\bbecause of\b/i,
      /\bconsequently\b/i,
      /\btherefore\b/i,
      /\bthus\b/i,
      
      // Processes & Methods
      /\bconsists of\b/i,
      /\bcomprises\b/i,
      /\binvolves\b/i,
      /\bincludes\b/i,
      /\bsteps are\b/i,
      /\bprocess of\b/i,
      /\bmethod of\b/i,
      
      // Key Facts & Properties
      /\bis characterized by\b/i,
      /\bproperties include\b/i,
      /\bfeatures include\b/i,
      /\bimportant\b/i,
      /\bsignificant\b/i,
      /\bkey\b/i,
      /\bprimary\b/i,
      /\bmain\b/i,
      
      // Comparisons & Classifications
      /\bdiffers from\b/i,
      /\bcompared to\b/i,
      /\bunlike\b/i,
      /\bwhereas\b/i,
      /\btypes of\b/i,
      /\bcategories of\b/i,
      /\bclassified as\b/i,
      
      // Numbers and measurements (factual data)
      /\b\d+%/,                              // Percentages
      /\b(19|20)\d{2}\b/,                    // Years
      /\b\d+(\.\d+)?\s*(kg|g|mg|km|m|cm|mm|l|ml|°c|°f)\b/i,  // Measurements
  ];

  const filtered = text.split('.').map(s => s.trim())
  .filter(sentence => 
    sentence.length > 20 && // Avoid short fragments
    examPatterns.some(pattern => pattern.test(sentence))
  );
  
  return filtered.length>0 ? filtered.join('. ') + '.' : text;//return original if no matches

};