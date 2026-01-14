import React, {useState, useEffect} from "react";

export default function QuestionEditor({ selectedFileId, selectedFile, questions, setQuestions }) {

  const [addMode, setAddMode] = useState(null);
  const [manualQuestion, setManualQuestion] = useState({ //question usestate

    documentId: selectedFile?.id,
    questionText: '',
    questionType: 'multiple-choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: ''
  });

  useEffect(() => {
    setManualQuestion(prev => ({
      ...prev,
      documentId: selectedFile?.id || null
    }));
  }, [selectedFile]);

  const handleModeSelect=(mode)=>{
    setAddMode(mode);
  }
  const handleManualSubmit = async ()=>{
    try{
      const response = await fetch('http://localhost/TESTQUIZFORGE/api/question_submit.php',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualQuestion)
      });
      const result = await response.json();

      if(result.success){
        const newQuestion = {
          id: result.questionId,
          ...manualQuestion
        }
        setQuestions([...questions, newQuestion]);
        setManualQuestion({
          documentId: selectedFile?.id,
          questionText: '',
          questionType: 'multiple-choice',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: ''
        })
      }else{
        alert('Error:' + result.message);
      }
    }catch(error){
      console.error('Error submitting questions', error);
      alert('Failed to submit question');
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-700 p-3 bg-gray-800">
        <h2 className="text-sm font-semibold">Question Editor</h2>
        <p className="text-xs text-gray-400">
          {selectedFile ? `Editing questions for ${selectedFile.name}` : 'No question or file selected'}
        </p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {selectedFile ? (
          addMode === 'manual' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <select
                  value={manualQuestion.questionType}
                  onChange={(e) => setManualQuestion({...manualQuestion, questionType: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-400">Question Text</label>
                <textarea
                  value={manualQuestion.questionText}
                  onChange={(e) => setManualQuestion({...manualQuestion, questionText: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded h-24 resize-none"
                  placeholder="Enter question..."
                />
              </div>
              {manualQuestion.questionType === 'multiple-choice' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option A</label>
                    <input
                      type="text"
                      value={manualQuestion.optionA}
                      onChange={(e) => setManualQuestion({...manualQuestion, optionA: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option B</label>
                    <input
                      type="text"
                      value={manualQuestion.optionB}
                      onChange={(e) => setManualQuestion({...manualQuestion, optionB: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option C</label>
                    <input
                      type="text"
                      value={manualQuestion.optionC}
                      onChange={(e) => setManualQuestion({...manualQuestion, optionC: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Option D</label>
                    <input
                      type="text"
                      value={manualQuestion.optionD}
                      onChange={(e) => setManualQuestion({...manualQuestion, optionD: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Correct Answer</label>
                    <select
                      value={manualQuestion.correctAnswer}
                      onChange={(e) => setManualQuestion({...manualQuestion, correctAnswer: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="">Select correct answer...</option>
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleManualSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2"
                    >
                      Done
                    </button>
                    <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2">Cancel</button>
                  </div>
                </>
              )}
              {manualQuestion.questionType === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Correct Answer</label>
                  <select
                    value={manualQuestion.correctAnswer}
                    onChange={(e) => setManualQuestion({...manualQuestion, correctAnswer: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    <option value="">Select correct answer...</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                  <div className="flex space-x-2 mt-4">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2">Done</button>
                    <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2">Cancel</button>
                  </div>
                </div>
              )}
            </>
          ) : addMode === 'generate' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Generate Questions</h2>
                <button
                  onClick={() => setAddMode(null)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
              </div>
              <div className="text-gray-400">Generate mode coming soon...</div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <button
                onClick={() => handleModeSelect('generate')}
                className="w-full rounded-lg bg-gray-700 p-4 text-left transition hover:bg-gray-600"
              >
                <div className="text-base font-semibold text-white">
                  Generate
                </div>
                <div className="mt-1 text-gray-400">
                  Use AI to generate questions for you
                </div>
              </button>

              <button
                onClick={() => handleModeSelect('manual')}
                className="w-full rounded-lg bg-gray-700 p-4 text-left transition hover:bg-gray-600"
              >
                <div className="text-base font-semibold text-white">
                  Make Your Own
                </div>
                <div className="mt-1 text-gray-400">
                  Manually create a custom question
                </div>
              </button>
            </div>
          )
        ) : (
          <div className="text-gray-500 text-sm">
            Select a file from the sidebar to start creating questions
          </div>
        )}
      </div>
    </div>
  );
}