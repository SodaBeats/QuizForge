export const rulesetProvider = (type: string) => {
  let questionsRuleset;

  switch (type) {
    case 'true-false':
      questionsRuleset = `
        ## true-false
          - Required: [question_text, correct_answer]
          - question_text: a single declarative statement that is unambiguously true or false. Do not phrase it as a question.
          - correct_answer: exactly "true" or "false" (lowercase, nothing else).
          - Avoid absolutes like "always" or "never" unless they make the statement definitively correct or incorrect, and do not make the statement true or false based on opinion.
        `;
      break;
    case 'short-answer':
      questionsRuleset = `
        ## short-answer
          - Required: [question_text, correct_answer]
          - question_text: a direct question with one objectively correct answer of 1-5 words (a term, name, value, or short phrase).
          - Do NOT ask for opinions, essays, or comparisons with many valid answers.
          - Do NOT ask for "an example of" something, or "give a/an X". These have many valid answers. Instead, constrain the question so only one answer fits.
          - correct_answer: only that answer, with no explanation or full sentence.
          - Do not ask for opinions, lists, or anything where several different answers would be equally correct.
        `;
      break;
    case 'general-open-ended-objective':
      questionsRuleset = `
        ## general-open-ended-objective
        - Required: [question_text, correct_answer]
        - question_text: ask about the topic with a clear, objectively checkable answer (a term, value, definition, or one-sentence statement), then ask the student to briefly explain why it is correct.
        - Do NOT ask for opinions, essays, or anything subjective.
        - Questions may have one correct answer or several, but whether an answer is valid must always be decidable by a clear rule. Do NOT ask for "any example" with no constraint.
        - correct_answer: the correct answer plus its key reasoning, in 1-3 sentences. Include the key terms or ideas that a correct explanation must contain so a grader can compare a student's answer against it.
        - If more than one answer is valid, begin correct_answer with "Any valid answer:" followed by the rule that makes an answer valid, then one example with its reasoning.
        `;
      break;
    case 'code-explain-open-ended-objective':
      questionsRuleset = `
        ## code-explain-open-ended-objective
          - Required: [question_text, correct_answer]
          - Include a short code snippet (3-15 lines) in question_text, in a fenced code block with the language tag, followed by a question asking the student to explain what the code does or how it works.
          - The snippet must be self-contained and directly demonstrate the topic. It must not depend on external files, APIs, or unexplained libraries.
          - correct_answer: a concise explanation (2-4 sentences) listing the key steps or concepts a correct explanation must cover.
          - Language rule: use the language the user specified. If none was specified, or the topic is not something code can demonstrate, do not generate this type. Instead, return "canCreateQuiz": false, a "reason" (e.g. "No programming language specified"), and an empty "questions" array.
        `;
      break;
    case 'code-output-predict-open-ended-objective':
      questionsRuleset = `
        ## code-output-prediction-open-ended-objective
          - Required: [question_text, correct_answer]
          - Include a short code snippet (3-15 lines) in question_text, in a fenced code block with the language tag, and ask the student to state exactly what it outputs.
          - The output must be deterministic: no randomness, current time, user input, or environment-dependent behavior. Trace the code step by step before answering to confirm correct_answer is exactly what it prints.
          - correct_answer: only the exact expected output, nothing else.
          - Language rule: use the language the user specified. If none was specified, or the topic is not something code can demonstrate, do not generate this type. Instead, return "canCreateQuiz": false, a "reason" (e.g. "No programming language specified"), and an empty "questions" array.
        `;
      break;
    default:
      questionsRuleset = `
        ## multiple-choice
          - Required: [question_text, correct_answer_text, correct_answer, option_a, option_b, option_c, option_d]
          - Be sure to include the correct answer in the choices.
          - correct_answer: must include the letter of the correct answer.
        `;
  }

  return questionsRuleset;
};
