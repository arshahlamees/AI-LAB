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
        const form = formidable();
        const [fields, files] = await form.parse(req);
        const file = files.file?.[0];

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create a temporary file
        const tempPath = join('/tmp', file.originalFilename || 'temp.jpg');
        await fs.copyFile(file.filepath, tempPath);

        // Run Python script for prediction
        const { stdout } = await execAsync(`python inference.py ${tempPath}`);
        const prediction = stdout.trim();

        // Clean up
        await fs.unlink(tempPath);

        return res.status(200).json({ prediction });
    } catch (error) {
        console.error('Error processing image:', error);
        return res.status(500).json({ error: 'Error processing image' });
    }
} 