// question.ts
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";

const rl = readline.createInterface({ input, output });

const questions: string[] = [
    "select prroject owner name:",
    "select project name:",
];

const answers: string[] = [];

function pjSign(index: number) {
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
        pjSign(index + 1);
    });
}

export default function shellHandler() {
    pjSign(0);
}
