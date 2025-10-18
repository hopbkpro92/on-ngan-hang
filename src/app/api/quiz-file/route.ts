import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This API route serves Excel files from the public folder
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('file');

        if (!fileName) {
            return NextResponse.json(
                { error: 'File name is required' },
                { status: 400 }
            );
        }

        // Security: Only allow .xlsx and .xls files
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            return NextResponse.json(
                { error: 'Invalid file type' },
                { status: 400 }
            );
        }

        // Security: Prevent path traversal
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            return NextResponse.json(
                { error: 'Invalid file name' },
                { status: 400 }
            );
        }

        const publicDir = path.join(process.cwd(), 'public');

        // Try to find the file with different normalizations
        const normalizedFileName = fileName.normalize('NFC');
        let filePath = path.join(publicDir, normalizedFileName);

        try {
            await fs.access(filePath);
        } catch {
            // Try to find file with different normalization
            const files = await fs.readdir(publicDir);
            const matchingFile = files.find(file => {
                const normalizedFile = file.normalize('NFC');
                return normalizedFile.toLowerCase() === normalizedFileName.toLowerCase() ||
                    file.toLowerCase() === fileName.toLowerCase();
            });

            if (!matchingFile) {
                console.error(`File not found: ${fileName}`);
                console.error(`Tried path: ${filePath}`);
                console.error(`Available files:`, files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls')));
                return NextResponse.json(
                    { error: 'File not found' },
                    { status: 404 }
                );
            }

            filePath = path.join(publicDir, matchingFile);
        }

        const fileBuffer = await fs.readFile(filePath);

        // Create a proper Response with Uint8Array
        return new Response(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
