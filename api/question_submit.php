<?php 

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
  echo json_encode(['success' => false, 'error' => 'Invalid request method']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw,true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

$document_id = $data['documentId'];
$question_text = trim($data['questionText']);
$map = [
    'multiple-choice' => 'multiple_choice',
    'true-false' => 'true_false',
    'short-answer' => 'short_answer'
];
$question_type = $map[$data['questionType']] ?? null;
$option_a = trim($data['optionA']) ?? null;
$option_b = trim($data['optionB']) ?? null;
$option_c = trim($data['optionC']) ?? null;
$option_d = trim($data['optionD']) ?? null;
$correct_answer = trim($data['correctAnswer']) ?? null;

try{
  $stmt = $pdo->prepare("
    INSERT INTO quiz_questions 
    (document_id, question_text, question_type, correct_answer, option_a, option_b, option_c, option_d, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  ");
  $stmt->execute([$document_id, $question_text, $question_type, $correct_answer, $option_a, $option_b, $option_c, $option_d]);
  $questionId = $pdo->lastInsertId();
  echo json_encode(['success'=>true, 'questionId'=>$questionId]);


}catch(Exception $e){
  echo json_encode(['success'=>false, 'error'=>'Question submission failed', $e->getMessage()]);
  exit;
}


?>