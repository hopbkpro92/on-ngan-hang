'use server';

import type { Question } from "./quiz-data";
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function loadQuizData(fileName: string): Promise<Question[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/${fileName}`);
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
  // This function runs on the server.
  try {
    const publicDirectory = path.join(process.cwd(), 'public');
    const dirents = await fs.readdir(publicDirectory, { withFileTypes: true });
    const excelFiles = dirents
      .filter(dirent => dirent.isFile() && (dirent.name.endsWith('.xlsx') || dirent.name.endsWith('.xls')))
      .map(dirent => dirent.name)
      .sort(); // Sort alphabetically for consistent order
    
    return excelFiles;
  } catch (error) {
    console.error("Failed to list available quiz files from public directory:", error);
    // Propagate a more specific error if possible, or a generic server error.
    let message = "Server error: Could not retrieve the list of quiz files.";
    if (error instanceof NodeJS.ErrnoException && error.code === 'ENOENT') {
      message = "Server error: The 'public' directory was not found.";
    }
    throw new Error(message);
  }
}
