import { describe, expect, it } from "vitest";
import { loadQuizData } from "../src/lib/quiz-loader";
import {
    filterQuestionsByIdRange,
    selectQuestions,
} from "../src/lib/quiz-selection";

const FILE_NAME = "17. Kiến thức chung.xlsx";
const FROM_ID = 1;
const TO_ID = 240;
const COUNT = 240;
const RUNS = 50;

describe("17. Kiến thức chung - range 1-240, random 240 questions", () => {
    it("loads the real file and has questions in range 1-240", async () => {
        const questions = await loadQuizData(FILE_NAME);

        console.log(`Total questions in file: ${questions.length}`);

        const inRange = filterQuestionsByIdRange(questions, FROM_ID, TO_ID);
        console.log(`Questions in range ${FROM_ID}-${TO_ID}: ${inRange.length}`);

        expect(inRange.length).toBeGreaterThan(0);
    });

    it("selects 240 random questions with no duplicates", async () => {
        const questions = await loadQuizData(FILE_NAME);
        const inRange = filterQuestionsByIdRange(questions, FROM_ID, TO_ID);

        const available = Math.min(COUNT, inRange.length);
        console.log(
            `Selecting ${available} of ${inRange.length} questions (random)`,
        );

        // Run multiple times because selection is random each run
        for (let run = 1; run <= RUNS; run++) {
            const selected = selectQuestions(inRange, COUNT, "random");

            expect(selected).toHaveLength(available);

            // Check duplicate IDs
            const ids = selected.map((question) => question.id);
            const uniqueIds = new Set(ids);
            expect(
                uniqueIds.size,
                `Run ${run}: duplicate IDs found: ${ids.length - uniqueIds.size}`,
            ).toBe(ids.length);

            // Check duplicate question texts (catches source-data duplicates)
            const texts = selected.map((question) => question.question);
            const uniqueTexts = new Set(texts);
            if (uniqueTexts.size !== texts.length) {
                const seen = new Set<string>();
                const duplicated: string[] = [];
                for (const text of texts) {
                    if (seen.has(text)) {
                        duplicated.push(text);
                    }
                    seen.add(text);
                }
                console.warn(
                    `Run ${run}: ${duplicated.length} duplicated question texts (source data issue):`,
                    duplicated,
                );
            }

            // All selected questions must be within the requested range
            for (const question of selected) {
                expect(question.id).toBeGreaterThanOrEqual(FROM_ID);
                expect(question.id).toBeLessThanOrEqual(TO_ID);
            }
        }

        console.log(`Passed ${RUNS} random runs with no duplicate IDs.`);
    });
});
