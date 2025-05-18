'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [prediction, setPrediction] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setPrediction('');
            setError('');
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setPrediction('');
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setPrediction('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('/api/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setPrediction(response.data.prediction);
        } catch (err) {
            setError('Error processing image. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold text-center mb-6">Scene Classification</h1>
                <p className="text-center text-gray-600 mb-8">
                    Upload an image to classify it into one of these categories: buildings, forest, glacier, mountain, sea, or street.
                </p>

                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput')?.click()}
                >
                    <input
                        type="file"
                        id="fileInput"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <p className="text-gray-600">Drag and drop an image here or click to select</p>
                </div>

                {preview && (
                    <div className="mt-6">
                        <img src={preview} alt="Preview" className="max-w-full h-auto rounded-lg" />
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            {loading ? 'Processing...' : 'Classify Image'}
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="mt-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-600">Processing image...</p>
                    </div>
                )}

                {prediction && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-800">Prediction Result</h3>
                        <p className="text-green-600">This image is classified as: {prediction}</p>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
            </div>
        </main>
    );
} 