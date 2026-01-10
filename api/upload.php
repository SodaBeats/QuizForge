<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'vendor/autoload.php';
require_once 'db.php';
require_once 'functions.php';

use PhpOffice\PhpWord\IOFactory;

if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
  echo json_encode(['success' => false, 'error' => 'Invalid request method']);
  exit;
}
if (!isset($_FILES['file'])){
  echo json_encode(['success'=>false, 'error' => 'No file uploaded']);
  exit;
}

$file = $_FILES['file'];
$uploadDir = 'uploads/';

// Create uploads directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

//validate file
$allowedExtensions = ['docx'];
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if(!in_array($fileExtension, $allowedExtensions)){
  echo json_encode(['success'=>false, 'error'=>'Only docx files are allowed']);
  exit;
}

//generate file hash
$fileHash = generateFileHash($file['tmp_name'], 'sha256');
if (!$fileHash) {
  echo json_encode(['success' => false, 'error' => 'Failed to generate file hash']);
  exit;
}

$fileName = uniqid().'_'.basename($file['name']);
$uploadPath = $uploadDir . $fileName;

if(!move_uploaded_file($file['tmp_name'], $uploadPath)){
  echo json_encode(['success'=>false, 'error'=>'Failed to save file']);
  exit;
}

try{

  //Check if duplicate file
  $stmt = $pdo->prepare("
    SELECT * FROM uploaded_files WHERE file_hash = ?
    LIMIT 1
  ");
  $stmt->execute([$fileHash]);

  $existingFile = $stmt->fetch(PDO::FETCH_ASSOC);

  if($existingFile){
    echo json_encode([
      'success'=>true,
      'fileId'=>$existingFile['id'],
      'extractedText'=>$existingFile['extracted_text'],
      'hash'=>$existingFile['file_hash'],
      'filename'=>$existingFile['filename'],
      'name'=>$file['name']
    ]);
    exit;
  }

  // Extract text from DOCX
    $phpWord = IOFactory::load($uploadPath);
    $extractedText = '';
    
    foreach ($phpWord->getSections() as $section) {
        $elements = $section->getElements();
        
        foreach ($elements as $element) {
            $elementClass = get_class($element);
            
            // Handle text runs (paragraphs)
            if ($elementClass === 'PhpOffice\PhpWord\Element\TextRun') {
                $text = '';
                foreach ($element->getElements() as $textElement) {
                    if (method_exists($textElement, 'getText')) {
                        $text .= $textElement->getText();
                    }
                }
                $extractedText .= trim($text) . "\n\n";
            }
            // Handle regular text
            elseif (method_exists($element, 'getText')) {
                $extractedText .= trim($element->getText()) . "\n\n";
            }
            // Handle tables
            elseif ($elementClass === 'PhpOffice\PhpWord\Element\Table') {
                foreach ($element->getRows() as $row) {
                    foreach ($row->getCells() as $cell) {
                        foreach ($cell->getElements() as $cellElement) {
                            if (method_exists($cellElement, 'getText')) {
                                $extractedText .= trim($cellElement->getText()) . " ";
                            }
                        }
                    }
                    $extractedText .= "\n";
                }
                $extractedText .= "\n";
            }
        }
    }

    // Clean up the text - remove excessive line breaks
    $extractedText = preg_replace("/\n{3,}/", "\n\n", $extractedText); // Max 2 consecutive line breaks
    $extractedText = trim($extractedText);
    $filteredText = filterExamWorthySentences($extractedText);



    if (empty($extractedText)) {
        echo json_encode(['success' => false, 'error' => 'No text could be extracted from the file']);
        exit;
    }

    //save to database
    $stmt = $pdo->prepare("
      INSERT INTO uploaded_files (filename, file_hash, file_path, extracted_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
      $file['name'],
      $fileHash,
      $uploadPath,
      $filteredText
    ]);

    $fileId = $pdo->lastInsertId();

    //return success response
    echo json_encode([
      'success'=>true,
      'fileId'=>$fileId,
      'extractedText'=>$filteredText,
      'hash'=>$fileHash,
      'filename'=>$fileName,
      'name'=>$file['name']
    ]);

}catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error processing file: ' . $e->getMessage()]);
}
?>