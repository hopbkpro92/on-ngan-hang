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
        const worksheetName = workbook.SheetNames[0];
        if (!worksheetName) {
            throw new Error(`No sheets found in '${fileName}'.`);
        }
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) {
            throw new Error(`Sheet '${worksheetName}' could not be read from '${fileName}'.`);
        }

        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const questions: Question[] = [];
        for (const row of jsonData) {
            // Skip fully empty rows or rows that don't look like question data
            if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                continue;
            }
            // Expect at least 7 columns: ID, Question, 4 Options, CorrectAnswerIndex
            if (row.length < 7) {
                console.warn(`Skipping malformed row in ${fileName} (not enough columns, expected 7, got ${row.length}):`, row);
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
                console.warn(`Skipping row in ${fileName} due to invalid ID (value: ${row[0]}):`, row);
                continue;
            }
            if (!questionText) {
                console.warn(`Skipping row in ${fileName} due to empty question text:`, row);
                continue;
            }
            // Ensure all 4 options are present, even if empty strings. UI expects 4.
            // If any option is strictly undefined or null (not just empty string), it might indicate parsing issue or bad data.
            // For now, String(row[x] || '') handles this by converting to empty string.

            if (isNaN(correctAnswerNum) || correctAnswerNum < 1 || correctAnswerNum > 4) {
                console.warn(`Skipping row in ${fileName} due to invalid correct answer index (value: ${row[6]}, must be 1-4):`, row);
                continue;
            }
            // Check if the option designated as correct is non-empty
            if (!options[correctAnswerNum - 1]) {
                console.warn(`Skipping row in ${fileName} because the correct option (index ${correctAnswerNum}, text: "${options[correctAnswerNum - 1]}") is empty:`, row);
                continue;
            }


            questions.push({
                id,
                question: questionText,
                options,
                correctAnswerIndex: correctAnswerNum - 1, // Convert 1-based to 0-based
            });
        }

        if (questions.length === 0 && jsonData.some(r => r && r.length > 0 && !r.every(cell => cell === null || cell === undefined || String(cell).trim() === ''))) {
            console.warn(`No valid questions were processed from '${fileName}', though the file appeared to contain data. Please check data format, content, and console logs for skipped rows.`);
            // Depending on requirements, you might throw an error here or return empty questions.
            // For now, returning empty questions allows the UI to state "No questions found in this file."
        }

        return questions;

    } catch (error) {
        console.error(`Error loading quiz data from ${fileName}:`, error);
        if (error instanceof Error) {
            // Prepend a user-friendly part to the error message.
            throw new Error(`Could not load or parse quiz data from '${fileName}'. ${error.message}`);
        }
        throw new Error(`Could not load or parse quiz data from '${fileName}'. An unknown error occurred.`);
    }
}

export async function listAvailableQuizFiles(): Promise<string[]> {
    try {
        // Fallback for production (Vercel): fetch the list from a JSON file
        if (!process.env.NEXT_PUBLIC_APP_URL) {
            console.warn("NEXT_PUBLIC_APP_URL environment variable is not set");
            return []; // Return empty array instead of throwing
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quiz-files.json`);

        if (!response.ok) {
            console.error(`Failed to fetch quiz file list: ${response.statusText} (${response.status})`);
            console.info("Make sure you have a quiz-files.json file in your public directory that lists all your quiz files.");
            return []; // Return empty array instead of throwing
        }

        const fileList = await response.json();

        if (!Array.isArray(fileList)) {
            console.error("Invalid quiz file list format: expected an array");
            return []; // Return empty array instead of throwing
        }

        // Filter and sort the Excel files
        const excelFiles = fileList
            .filter(filename => typeof filename === 'string' && (filename.endsWith('.xlsx') || filename.endsWith('.xls')))
            .sort();

        if (excelFiles.length === 0) {
            console.warn("No quiz files (.xlsx or .xls) found in quiz-files.json");
        }

        return excelFiles;
    } catch (error) {
        console.error("Failed to list available quiz files:", error);
        // Return empty array instead of throwing error
        return [];
    }
}
