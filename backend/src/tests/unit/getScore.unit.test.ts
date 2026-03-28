
import { getScore } from "../../services/getScore.service.js";

const testCases = [
  { name: 'Perfect score',
    question: [{
      id: 1, correctAnswer: 'a'
    },{
      id: 2, correctAnswer: 'b'
    },{
      id: 3, correctAnswer: 'b'
    }],
    ans: {'1':'a', '2':'b','3':'b'},
    expected: 3
  },
  { name: 'Partial score',
    question: [{
      id: 1, correctAnswer: 'a'
    },{
      id: 2, correctAnswer: 'b'
    },{
      id: 3, correctAnswer: 'c'
    }],
    ans: {'1':'a', '2':'b','3':'b'},
    expected: 2
  },
  { name: 'No score',
    question: [{
      id: 1, correctAnswer: 'a'
    },{
      id: 2, correctAnswer: 'b'
    },{
      id: 3, correctAnswer: 'b'
    }],
    ans: {'1':'c', '2':'c','3':'c'},
    expected: 0
  },
  { name: 'Partial answer',
    question: [{
      id: 1, correctAnswer: 'a'
    },{
      id: 2, correctAnswer: 'b'
    },{
      id: 3, correctAnswer: 'b'
    }],
    ans: {'1':'a', '2':'','3':'b'},
    expected: 2
  },
];

test.each(testCases)('returns $expected for $name', ({question, ans, expected}) => {
  expect(getScore(question as any, ans as any)).toEqual(expected);
});