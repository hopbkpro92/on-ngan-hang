'use server';

import type { Question } from "./quiz-data";
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function loadQuizData(fileName: string): Promise<Question[]> {
    try {
        // Properly encode the filename to handle special characters and spaces
        const encodedFileName = encodeURIComponent(fileName);

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/${encodedFileName}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${fileName}: ${response.statusText} (status: ${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            throw new Error(`File '${fileName}' is empty.`);
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get visible sheets only
        const visibleSheets = workbook.SheetNames.filter(name => {
            // Check if the sheet is hidden
            const sheet = workbook.Sheets[name];
            const sheetVisible = !(workbook.Workbook?.Sheets?.find(s => s.name === name)?.Hidden);
            return sheetVisible;
        });

        if (visibleSheets.length === 0) {
            throw new Error(`No visible sheets found in '${fileName}'.`);
        }

        console.log(`Processing file ${fileName}: Found ${workbook.SheetNames.length} total sheets, ${visibleSheets.length} visible`);

        const worksheetName = visibleSheets[0];
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) {
            throw new Error(`Sheet '${worksheetName}' could not be read from '${fileName}'.`);
        }

        // Track statistics for diagnostics
        const stats = {
            totalRows: 0,
            emptyRows: 0,
            malformedRows: 0,
            invalidIdRows: 0,
            emptyQuestionRows: 0,
            invalidAnswerRows: 0,
            validQuestions: 0,
            duplicateIds: 0,
            hiddenSheets: workbook.SheetNames.length - visibleSheets.length
        };

        // Use defval: null to clearly distinguish truly empty cells
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        stats.totalRows = jsonData.length;

        const questions: Question[] = [];
        const seenIds = new Set<number>(); // Track seen IDs to prevent duplicates

        // Skip header row if present (typically has column titles)
        const startRowIndex = isHeaderRow(jsonData[0]) ? 1 : 0;

        for (let i = startRowIndex; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Skip truly empty rows (completely null or empty cells)
            if (!row || row.length === 0 || isEmptyRow(row)) {
                stats.emptyRows++;
                continue;
            }

            // Expect at least 7 columns: ID, Question, 4 Options, CorrectAnswerIndex
            if (row.length < 7) {
                console.warn(`Skipping malformed row ${i + 1} in ${fileName} (not enough columns, expected 7, got ${row.length}):`, row);
                stats.malformedRows++;
                continue;
            }

            const id = Number(row[0]);
            const questionText = String(row[1] || '').trim();
            const options = [
                String(row[2] || '').trim(),
                String(row[3] || '').trim(),
                String(row[4] || '').trim(),
                String(row[5] || '').trim(),
            ];
            const correctAnswerNum = Number(row[6]);

            if (isNaN(id) || id <= 0) {
                console.warn(`Skipping row ${i + 1} in ${fileName} due to invalid ID (value: ${row[0]}):`, row);
                stats.invalidIdRows++;
                continue;
            }

            // Check for duplicate IDs
            if (seenIds.has(id)) {
                console.warn(`Duplicate ID ${id} found in row ${i + 1}. Skipping duplicate.`);
                stats.duplicateIds++;
                continue;
            }
            seenIds.add(id);

            if (!questionText) {
                console.warn(`Skipping row ${i + 1} in ${fileName} due to empty question text:`, row);
                stats.emptyQuestionRows++;
                continue;
            }

            if (isNaN(correctAnswerNum) || correctAnswerNum < 1 || correctAnswerNum > 4) {
                console.warn(`Skipping row ${i + 1} in ${fileName} due to invalid correct answer index (value: ${row[6]}, must be 1-4):`, row);
                stats.invalidAnswerRows++;
                continue;
            }

            // Check if the option designated as correct is non-empty
            if (!options[correctAnswerNum - 1]) {
                console.warn(`Skipping row ${i + 1} in ${fileName} because the correct option (index ${correctAnswerNum}, text: "${options[correctAnswerNum - 1]}") is empty:`, row);
                stats.invalidAnswerRows++;
                continue;
            }

            questions.push({
                id,
                question: questionText,
                options,
                correctAnswerIndex: correctAnswerNum - 1, // Convert 1-based to 0-based
            });
            stats.validQuestions++;
        }

        console.log(`File ${fileName} parsing stats:`, stats);
        console.log(`Loaded ${questions.length} questions from ${stats.totalRows} rows`);

        if (questions.length === 0 && stats.totalRows > 0) {
            console.warn(`No valid questions were processed from '${fileName}', though the file appeared to contain data. Please check data format, content, and console logs for skipped rows.`);
        }

        return questions;

    } catch (error) {
        console.error(`Error loading quiz data from ${fileName}:`, error);
        if (error instanceof Error) {
            throw new Error(`Could not load or parse quiz data from '${fileName}'. ${error.message}`);
        }
        throw new Error(`Could not load or parse quiz data from '${fileName}'. An unknown error occurred.`);
    }
}

// Helper function to determine if a row is truly empty
function isEmptyRow(row: any[]): boolean {
    return row.every(cell =>
        cell === null ||
        cell === undefined ||
        String(cell).trim() === ''
    );
}

// Helper function to detect header rows (usually text headers not number IDs in first column)
function isHeaderRow(row: any[]): boolean {
    if (!row || row.length === 0) return false;
    // If first cell is not a number but contains text, likely a header
    const firstCell = row[0];
    return firstCell !== null &&
        isNaN(Number(firstCell)) &&
        typeof firstCell === 'string' &&
        firstCell.trim() !== '';
}

export async function listAvailableQuizFiles(): Promise<string[]> {
    // Retry parameters
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second

    // Helper function to retry with exponential backoff
    const fetchWithRetry = async (url: string, retries: number): Promise<Response> => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
            throw new Error(`Failed to fetch: ${response.statusText} (${response.status})`);
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying fetch (${maxRetries - retries + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    };

    try {
        if (!process.env.NEXT_PUBLIC_APP_URL) {
            console.warn("NEXT_PUBLIC_APP_URL environment variable is not set");
            return [];
        }

        const quizFilesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quiz-files.json`;
        console.log(`Fetching quiz files from: ${quizFilesUrl}`);

        // Use retry mechanism
        const response = await fetchWithRetry(quizFilesUrl, maxRetries);

        const fileList = await response.json();

        if (!Array.isArray(fileList)) {
            console.error("Invalid quiz file list format: expected an array");
            return [];
        }

        // Filter and sort the Excel files
        const excelFiles = fileList
            .filter(filename => typeof filename === 'string' && (filename.endsWith('.xlsx') || filename.endsWith('.xls')))
            .sort();

        if (excelFiles.length === 0) {
            console.warn("No quiz files (.xlsx or .xls) found in quiz-files.json");
        } else {
            console.log(`Successfully loaded ${excelFiles.length} quiz files`);
        }

        return excelFiles;
    } catch (error) {
        console.error("Failed to list available quiz files:", error);
        return [];
    }
}

/**
 * Load questions from all quiz files with proportional distribution
 * @param totalQuestions - Total number of questions to load (default: 100)
 * @returns Array of questions distributed proportionally across all files
 */
export async function loadExamQuestions(totalQuestions: number = 100): Promise<Question[]> {
    try {
        const files = await listAvailableQuizFiles();

        if (files.length === 0) {
            throw new Error("No quiz files available for exam mode");
        }

        console.log(`Loading exam questions from ${files.length} files...`);

        // Load all questions from all files
        const allFileQuestions: { fileName: string; questions: Question[] }[] = [];
        let totalAvailableQuestions = 0;

        for (const file of files) {
            try {
                const questions = await loadQuizData(file);
                if (questions.length > 0) {
                    allFileQuestions.push({ fileName: file, questions });
                    totalAvailableQuestions += questions.length;
                    console.log(`Loaded ${questions.length} questions from ${file}`);
                }
            } catch (error) {
                console.warn(`Failed to load ${file}, skipping:`, error);
            }
        }

        if (totalAvailableQuestions === 0) {
            throw new Error("No valid questions found in any quiz file");
        }

        console.log(`Total available questions: ${totalAvailableQuestions}`);

        // Calculate proportional distribution
        const examQuestions: Question[] = [];
        const questionsToGet = Math.min(totalQuestions, totalAvailableQuestions);

        for (const fileData of allFileQuestions) {
            const proportion = fileData.questions.length / totalAvailableQuestions;
            const questionsFromThisFile = Math.round(questionsToGet * proportion);

            console.log(`Getting ${questionsFromThisFile} questions from ${fileData.fileName} (${fileData.questions.length} available, ${(proportion * 100).toFixed(1)}%)`);

            // Randomly select questions from this file
            const shuffled = [...fileData.questions].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Math.min(questionsFromThisFile, fileData.questions.length));

            examQuestions.push(...selected);
        }

        // If we don't have exactly the right number due to rounding, adjust
        if (examQuestions.length < questionsToGet) {
            // Add more random questions from any file
            const allQuestions = allFileQuestions.flatMap(f => f.questions);
            const existingIds = new Set(examQuestions.map(q => q.id));
            const availableQuestions = allQuestions.filter(q => !existingIds.has(q.id));

            const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
            const needed = questionsToGet - examQuestions.length;
            examQuestions.push(...shuffled.slice(0, needed));
        } else if (examQuestions.length > questionsToGet) {
            // Remove excess questions
            examQuestions.length = questionsToGet;
        }

        // Final shuffle to mix questions from different files
        const finalQuestions = [...examQuestions].sort(() => 0.5 - Math.random());

        console.log(`Exam ready with ${finalQuestions.length} questions from ${allFileQuestions.length} files`);

        return finalQuestions;
    } catch (error) {
        console.error("Error loading exam questions:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to load exam questions: ${error.message}`);
        }
        throw new Error("Failed to load exam questions: An unknown error occurred");
    }
}
