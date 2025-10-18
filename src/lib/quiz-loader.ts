'use server';

import type { Question, QuizFileMetadata, UserRole } from "./quiz-data";
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function loadQuizData(fileName: string): Promise<Question[]> {
    try {
        let workbook: XLSX.WorkBook;

        // Try filesystem first (works in local dev and some hosting), then fallback to fetch
        if (typeof window === 'undefined') {
            try {
                // Local development: Try filesystem access first
                const publicDir = path.join(process.cwd(), 'public');
                const normalizedFileName = fileName.normalize('NFC');
                let filePath = path.join(publicDir, normalizedFileName);

                // Try to read the file
                let fileBuffer: Buffer;
                try {
                    fileBuffer = await fs.readFile(filePath);
                } catch (fsError: any) {
                    if (fsError.code === 'ENOENT') {
                        // Try to find file with different normalization
                        const files = await fs.readdir(publicDir).catch(() => []);
                        const matchingFile = files.find(file => {
                            const normalizedFile = file.normalize('NFC');
                            return normalizedFile.toLowerCase() === normalizedFileName.toLowerCase() ||
                                file.toLowerCase() === fileName.toLowerCase();
                        });

                        if (matchingFile) {
                            console.log(`Found file with different normalization: "${matchingFile}"`);
                            filePath = path.join(publicDir, matchingFile);
                            fileBuffer = await fs.readFile(filePath);
                        } else {
                            throw fsError;
                        }
                    } else {
                        throw fsError;
                    }
                }

                workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                console.log(`Loaded ${fileName} from filesystem`);
            } catch (fsError) {
                // Filesystem failed (likely Vercel), try API route instead
                console.log(`Filesystem access failed for ${fileName}, trying API route...`);

                // Build base URL
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');

                // Use API route to serve the file (handles Vietnamese filenames properly)
                const apiUrl = `${baseUrl}/api/quiz-file?file=${encodeURIComponent(fileName)}`;

                try {
                    console.log(`Fetching from API: ${apiUrl}`);
                    const response = await fetch(apiUrl, {
                        cache: 'no-store' // Disable caching for fresh data
                    });

                    if (!response.ok) {
                        throw new Error(`API returned ${response.status}: ${response.statusText}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    console.log(`Successfully fetched ${fileName} from API route`);

                    if (arrayBuffer.byteLength === 0) {
                        throw new Error(`File '${fileName}' is empty.`);
                    }

                    workbook = XLSX.read(arrayBuffer, { type: 'array' });
                } catch (apiError) {
                    const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
                    throw new Error(`Failed to load ${fileName} via filesystem or API. Last error: ${errorMsg}`);
                }
            }
        } else {
            // Client-side (should rarely happen with server actions)
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/quiz-file?file=${encodeURIComponent(fileName)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            workbook = XLSX.read(arrayBuffer, { type: 'array' });
        }

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
        // Build base URL with better Vercel detection
        let baseUrl: string;

        if (process.env.NEXT_PUBLIC_APP_URL) {
            baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            console.log(`Using NEXT_PUBLIC_APP_URL: ${baseUrl}`);
        } else if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
            console.log(`Using VERCEL_URL: ${baseUrl}`);
        } else {
            baseUrl = 'http://localhost:9002';
            console.log(`Using default localhost: ${baseUrl}`);
        }

        const quizFilesUrl = `${baseUrl}/quiz-files.json`;
        console.log(`Fetching quiz files from: ${quizFilesUrl}`);

        // Use retry mechanism
        const response = await fetchWithRetry(quizFilesUrl, maxRetries);

        console.log(`Response status: ${response.status}`);

        const fileList = await response.json();
        console.log(`Received file list with ${Array.isArray(fileList) ? fileList.length : 0} items`);

        if (!Array.isArray(fileList)) {
            console.error("Invalid quiz file list format: expected an array, got:", typeof fileList);
            return [];
        }

        // Validate the new structure
        const validFiles: QuizFileMetadata[] = fileList.filter(item => {
            const isValid = (
                typeof item === 'object' &&
                typeof item.path === 'string' &&
                typeof item.role === 'string' &&
                typeof item.examQuestions === 'number' &&
                (item.path.endsWith('.xlsx') || item.path.endsWith('.xls'))
            );
            if (!isValid) {
                console.warn('Invalid file metadata:', item);
            }
            return isValid;
        });

        console.log(`Found ${validFiles.length} valid quiz files after validation`);

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
        } else {
            console.log(`No role filter applied, returning all ${validFiles.length} files`);
        }

        return filteredFiles;
    } catch (error) {
        console.error("Failed to list available quiz files:", error);
        console.error("Error details:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
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
