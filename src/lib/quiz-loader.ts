'use server';

import type { Question, QuizFileMetadata, UserRole } from "./quiz-data";
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function loadQuizData(fileName: string): Promise<Question[]> {
    try {
        // Server-side: read file directly from filesystem
        if (typeof window === 'undefined') {
            // Normalize the filename to handle Unicode character variations (NFC form)
            const normalizedFileName = fileName.normalize('NFC');
            const filePath = path.join(process.cwd(), 'public', normalizedFileName);

            // Try to read with normalized filename first
            try {
                const fileBuffer = await fs.readFile(filePath);
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

                // Get visible sheets only
                const visibleSheets = workbook.SheetNames.filter(name => {
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

                return parseWorksheet(worksheet, fileName);
            } catch (readError: any) {
                // If normalized version fails, try to find the file by listing directory
                if (readError.code === 'ENOENT') {
                    const publicDir = path.join(process.cwd(), 'public');
                    const files = await fs.readdir(publicDir);

                    // Find file with case-insensitive and normalization-insensitive match
                    const matchingFile = files.find(file => {
                        const normalizedFile = file.normalize('NFC');
                        const normalizedSearch = fileName.normalize('NFC');
                        return normalizedFile.toLowerCase() === normalizedSearch.toLowerCase() ||
                            file.toLowerCase() === fileName.toLowerCase();
                    });

                    if (matchingFile) {
                        console.log(`Found file with different normalization: "${matchingFile}" for requested "${fileName}"`);
                        const actualFilePath = path.join(publicDir, matchingFile);
                        const fileBuffer = await fs.readFile(actualFilePath);
                        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

                        // Get visible sheets only
                        const visibleSheets = workbook.SheetNames.filter(name => {
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

                        return parseWorksheet(worksheet, fileName);
                    }
                }
                throw readError;
            }
        }

        // Client-side: fetch from public URL (should rarely happen with server actions)
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

        return parseWorksheet(worksheet, fileName);
    } catch (error) {
        console.error(`Error loading quiz data from ${fileName}:`, error);
        if (error instanceof Error) {
            throw new Error(`Could not load or parse quiz data from '${fileName}'. ${error.message}`);
        }
        throw new Error(`Could not load or parse quiz data from '${fileName}'. An unknown error occurred.`);
    }
}

// Helper function to parse worksheet data
function parseWorksheet(worksheet: XLSX.WorkSheet, fileName: string): Question[] {
    try {
        // Track statistics for diagnostics
        const stats = {
            totalRows: 0,
            emptyRows: 0,
            malformedRows: 0,
            invalidIdRows: 0,
            emptyQuestionRows: 0,
            invalidAnswerRows: 0,
            validQuestions: 0,
            duplicateIds: 0
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

export async function listAvailableQuizFiles(userRole?: UserRole): Promise<QuizFileMetadata[]> {
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

        // Validate the new structure
        const validFiles: QuizFileMetadata[] = fileList.filter(item => {
            return (
                typeof item === 'object' &&
                typeof item.path === 'string' &&
                typeof item.role === 'string' &&
                typeof item.examQuestions === 'number' &&
                (item.path.endsWith('.xlsx') || item.path.endsWith('.xls'))
            );
        });

        if (validFiles.length === 0) {
            console.warn("No valid quiz files found in quiz-files.json");
            return [];
        }

        // Filter by user role if provided
        let filteredFiles = validFiles;
        if (userRole) {
            filteredFiles = validFiles.filter(file =>
                file.role === userRole || file.role === "Kiến thức chung"
            );
            console.log(`Filtered to ${filteredFiles.length} files for role: ${userRole} (including common knowledge)`);
        }

        console.log(`Successfully loaded ${filteredFiles.length} quiz files`);
        return filteredFiles;
    } catch (error) {
        console.error("Failed to list available quiz files:", error);
        return [];
    }
}

/**
 * Load questions from quiz files based on user role with specified question counts
 * @param userRole - The user's role (Kế toán, Kiểm ngân, or Quản lý)
 * @param totalQuestions - Total number of questions to load (default: 100)
 * @returns Array of questions distributed according to examQuestions specification
 */
export async function loadExamQuestions(userRole: UserRole, totalQuestions: number = 100): Promise<Question[]> {
    try {
        const files = await listAvailableQuizFiles(userRole);

        if (files.length === 0) {
            throw new Error(`No quiz files available for role: ${userRole}`);
        }

        console.log(`Loading exam questions for role: ${userRole} from ${files.length} files...`);

        // Load questions from each file
        const allFileQuestions: { metadata: QuizFileMetadata; questions: Question[] }[] = [];

        for (const fileMetadata of files) {
            try {
                const questions = await loadQuizData(fileMetadata.path);
                if (questions.length > 0) {
                    allFileQuestions.push({ metadata: fileMetadata, questions });
                    console.log(`Loaded ${questions.length} questions from ${fileMetadata.path} (Role: ${fileMetadata.role})`);
                }
            } catch (error) {
                console.warn(`Failed to load ${fileMetadata.path}, skipping:`, error);
            }
        }

        if (allFileQuestions.length === 0) {
            throw new Error("No valid questions found in any quiz file");
        }

        // Select questions based on examQuestions specification
        const examQuestions: Question[] = [];

        for (const fileData of allFileQuestions) {
            const questionsToGet = Math.min(fileData.metadata.examQuestions, fileData.questions.length);

            console.log(`Getting ${questionsToGet} questions from ${fileData.metadata.path} (specified: ${fileData.metadata.examQuestions}, available: ${fileData.questions.length})`);

            // Randomly select the specified number of questions from this file
            const shuffled = [...fileData.questions].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, questionsToGet);

            examQuestions.push(...selected);
        }

        // Final shuffle to mix questions from different files
        const finalQuestions = [...examQuestions].sort(() => 0.5 - Math.random());

        console.log(`Exam ready with ${finalQuestions.length} questions from ${allFileQuestions.length} files for role: ${userRole}`);

        return finalQuestions;
    } catch (error) {
        console.error("Error loading exam questions:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to load exam questions: ${error.message}`);
        }
        throw new Error("Failed to load exam questions: An unknown error occurred");
    }
}
