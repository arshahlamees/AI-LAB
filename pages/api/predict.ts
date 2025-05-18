import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import formidable from 'formidable';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Starting file upload process');
        const form = formidable();
        const [fields, files] = await form.parse(req);
        const file = files.file?.[0];

        if (!file) {
            console.error('No file received in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', {
            filename: file.originalFilename,
            size: file.size,
            type: file.mimetype
        });

        // Create a temporary file
        const tempPath = join('/tmp', file.originalFilename || 'temp.jpg');
        console.log('Creating temporary file at:', tempPath);
        await fs.copyFile(file.filepath, tempPath);

        // Run Python script for prediction
        console.log('Running inference script');
        const { stdout, stderr } = await execAsync(`python inference.py ${tempPath}`);

        if (stderr) {
            console.error('Python script error:', stderr);
            throw new Error(stderr);
        }

        console.log('Prediction result:', stdout);
        const prediction = stdout.trim();

        // Clean up
        console.log('Cleaning up temporary files');
        await fs.unlink(tempPath);
        await fs.unlink(file.filepath);

        return res.status(200).json({ prediction });
    } catch (error) {
        console.error('Error in API route:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Error processing image'
        });
    }
} 