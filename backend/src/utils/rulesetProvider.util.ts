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
        
        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no code fences, no text before or after. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string,
            "questions": [
              {
                "question_text": string,
                "correct_answer": "true" | "false"
              }
            ]
          }

          Example:
          {
            "canCreateQuiz": true,
            "reason": "",
            "questions": [
              {
                "question_text": "Water boils at 100°C at sea level.",
                "correct_answer": "true"
              }
            ]
          }
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

        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no code fences, no text before or after. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string,
            "questions": [
              {
                "question_text": string,
                "correct_answer": string,
              }
            ]
          }

          Example:
          {
            "canCreateQuiz": true,
            "reason": "",
            "questions": [
              {
                "question_text": "What is the official term for the complete process of conceiving, designing, programming, testing, and maintaining computer programs, apps, and digital systems to meet user needs and business goals",
                "correct_answer": "Software Development",
              }
            ]
          }
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
        
        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no code fences, no text before or after. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string,
            "questions": [
              {
                "question_text": string,
                "correct_answer": string,
              }
            ]
          }

          Example:
          {
            "canCreateQuiz": boolean,
            "reason": string,
            "questions": [
              {
                "question_text": "What is the name of the process by which plants convert light energy into chemical energy? Briefly explain why this process is essential to most life on Earth.",
                "correct_answer": Photosynthesis. Plants use sunlight, water, and carbon dioxide to produce glucose and oxygen, which forms the base of most food chains and supplies the oxygen that most organisms breathe.
              }
            ]
          }
        `;
      break;
    case 'code-explain-open-ended-objective':
      questionsRuleset = `
        ## code-explain-open-ended-objective
          - Required: [question_text, correct_answer]
          - question_text: a short code snippet (3-15 lines) in a markdown fenced code block (three backticks plus the language name, then the code, then three closing backticks), followed by a question asking the student to explain what the code does or how it works. Use \\n for line breaks inside question_text.
          - The snippet must be self-contained and directly demonstrate the topic. It must not depend on external files, APIs, or unexplained libraries.
          - correct_answer: a concise explanation (2-4 sentences) listing the key steps or concepts a correct explanation must cover.
          - Language rule: use the language the user specified. If none was specified, or the topic is not something code can demonstrate, do not generate this type. Instead, return "canCreateQuiz": false, a "reason" (e.g. "No programming language specified"), and an empty "questions" array.

        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no text before or after, and no code fences around the JSON itself. Code fences inside question_text are required. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string, // "" when canCreateQuiz is true
            "questions": [
              {
                "question_text": string,
                "correct_answer": string
              }
            ]
          }
      `;
      break;
    case 'code-output-predict-open-ended-objective':
      questionsRuleset = `
        ## code-output-predict-open-ended-objective
          - Required: [question_text, correct_answer]
          - question_text: a short code snippet (3-15 lines) in a markdown fenced code block (three backticks plus the language name, then the code, then three closing backticks), followed by a question asking what the code prints. Use \\n for line breaks inside question_text.
          - The output must be deterministic: no randomness, current time, user input, or environment-dependent behavior. Trace the code step by step internally to confirm correct_answer is exactly what it prints.
          - correct_answer: only the exact expected output, nothing else. If the output has multiple lines, separate them with \\n.
          - Language rule: use the language the user specified. If none was specified, or the topic is not something code can demonstrate, do not generate this type. Instead, return "canCreateQuiz": false, a "reason" (e.g. "No programming language specified"), and an empty "questions" array.

        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no text before or after, and no code fences around the JSON itself. Code fences inside question_text are required. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string, // "" when canCreateQuiz is true
            "questions": [
              {
                "question_text": string,
                "correct_answer": string
              }
            ]
          }
        `;
      break;
    default:
      questionsRuleset = `
        ## multiple-choice
          - Required: [question_text, correct_answer_text, correct_answer, option_a, option_b, option_c, option_d]
          - question_text: a clear question with exactly one correct answer.
          - correct_answer_text: the full text of the correct answer, written first, before the options.
          - Write the correct answer first, then write 3 distractors that match it.
          - Distractor rules:
            - Each distractor must be a plausible misconception, a common mistake, or a closely related concept that a student who only half-understands the topic would pick.
            - All four options must have similar length (within about 20% of each other in characters), the same level of detail, and the same grammatical structure.
            - Do not make the correct answer the longest, most specific, or most carefully qualified option. Give distractors the same specificity and qualifiers.
            - Do not make distractors obviously absurd, off-topic, or joke answers.
            - Do not use absolute words ("always", "never", "only") in distractors unless they also appear in the correct answer.
          - Place the correct answer at a random position among the four options. Do not favor any letter.
          - option_a to option_d: contain the correct_answer_text exactly once, with no letter prefixes like "A)".
          - correct_answer: the letter ("a", "b", "c", or "d") of the option that contains correct_answer_text. Write it last, after the options.
        
        # OUTPUT FORMAT
          Respond with ONLY the specified JSON. No markdown, no code fences, no text before or after. The JSON must match this exact shape:
          {
            "canCreateQuiz": boolean,
            "reason": string,
            "questions": [
              {
                "question_text": string,
                "correct_answer_text": string,
                "option_a": string,
                "option_b": string,
                "option_c": string,
                "option_d": string,
                "correct_answer: char
              }
            ]
          }

          Example:
          {
            "canCreateQuiz": true,
            "reason": "",
            "questions": [
              {
                "question_text": "What is the powerhouse of the cell?",
                "correct_answer_text": "Mitochondria",
                "option_a": "Nucleus",
                "option_b": "Cell",
                "option_c": "Mitochondria",
                "option_d": "Ribosome",
                "correct_answer: "c"
              }
            ]
          }
        `;
  }

  return questionsRuleset;
};
