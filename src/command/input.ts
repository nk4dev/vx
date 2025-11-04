// question.ts
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";
import { init } from "./pjmake";

const rl = readline.createInterface({ input, output });

const questions: string[] = [
  "project name or path:",
];

const answers: string[] = [];

function shellInputHandler(index: number) {
  try {
    if (index >= questions.length) {
      rl.close();
      console.log("\n project created");
      questions.forEach((q, i) => {
        console.log(`- ${q} ${answers[i]}`);
      });
      return;
    }

    rl.question(questions[index] + " ", (answer) => {
      answers.push(answer);
      if (index === questions.length - 1) {
        // Last answer received; run initializer with provided project name
        init(answers[0]);
        rl.close();
      } else {
        shellInputHandler(index + 1);
      }
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export default function shellhaldler() {
  shellInputHandler(0);
}