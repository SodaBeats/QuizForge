<?php

//generate hash for uploade file
function generateFileHash($filePath, $algorithm = 'sha256') {
    if (!file_exists($filePath)) {
        return false;
    }
    
    return hash_file($algorithm, $filePath);
}

//check if file already exists in database
function checkDuplicateFile($pdo, $fileHash) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM documents WHERE file_hash = ?");
    $stmt->execute([$fileHash]);
    
    return $stmt->fetchColumn() > 0;
}


/**
 * Filters text to keep only exam-worthy sentences containing key educational patterns
 * 
 * @param string $text The unfiltered extracted text from document
 * @return string Filtered text containing only exam-worthy sentences
 */
function filterExamWorthySentences($text) {
    // Patterns that indicate exam-worthy content
    $examPatterns = [
        // Definitions & Explanations
        '/\bis defined as\b/i',
        '/\brefers to\b/i',
        '/\bis known as\b/i',
        '/\bmeans that\b/i',
        '/\bis called\b/i',
        '/\bis termed\b/i',
        '/\bcan be described as\b/i',
        
        // Cause & Effect
        '/\bresults in\b/i',
        '/\bleads to\b/i',
        '/\bcauses\b/i',
        '/\bdue to\b/i',
        '/\bbecause of\b/i',
        '/\bconsequently\b/i',
        '/\btherefore\b/i',
        '/\bthus\b/i',
        
        // Processes & Methods
        '/\bconsists of\b/i',
        '/\bcomprises\b/i',
        '/\binvolves\b/i',
        '/\bincludes\b/i',
        '/\bsteps are\b/i',
        '/\bprocess of\b/i',
        '/\bmethod of\b/i',
        
        // Key Facts & Properties
        '/\bis characterized by\b/i',
        '/\bproperties include\b/i',
        '/\bfeatures include\b/i',
        '/\bimportant\b/i',
        '/\bsignificant\b/i',
        '/\bkey\b/i',
        '/\bprimary\b/i',
        '/\bmain\b/i',
        
        // Comparisons & Classifications
        '/\bdiffers from\b/i',
        '/\bcompared to\b/i',
        '/\bunlike\b/i',
        '/\bwhereas\b/i',
        '/\btypes of\b/i',
        '/\bcategories of\b/i',
        '/\bclassified as\b/i',
        
        // Numbers and measurements (factual data)
        '/\b\d+%\b/',  // Percentages
        '/\b\d{4}\b/',  // Years
        '/\b\d+\s*(kg|g|mg|km|m|cm|mm|L|mL|°C|°F)\b/i',  // Measurements
    ];
    
    // Split text into sentences
    // This regex handles common sentence endings
    $sentences = preg_split('/(?<=[.!?])\s+(?=[A-Z])/', $text, -1, PREG_SPLIT_NO_EMPTY);
    
    $filteredSentences = [];
    
    foreach ($sentences as $sentence) {
        $sentence = trim($sentence);
        
        // Skip very short sentences (likely not substantial content)
        if (strlen($sentence) < 20 || strlen($sentence) > 200) {
            continue;
        }
        
        // Check if sentence matches any exam-worthy pattern
        foreach ($examPatterns as $pattern) {
          if (preg_match($pattern, $sentence)) {
            $filteredSentences[] = $sentence;
            break; // Move to next sentence once matched
          }
        }
    }
    
    // Join filtered sentences with line breaks for readability
    return implode("\n\n", $filteredSentences);
}

// Example usage:
// $unfilteredText = "Your extracted DOCX text here...";
// $examWorthyText = filterExamWorthySentences($unfilteredText);
// echo $examWorthyText;



?>