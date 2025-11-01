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
        init(answers[0]);
      }
      shellInputHandler(index + 1);
    });
  } catch (error) {
    const err = error as Error;
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

export default function shellhaldler() {
  shellInputHandler(0);
}