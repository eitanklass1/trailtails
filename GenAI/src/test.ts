import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

async function testArtGeneration() {
    try {
        // Verify OpenAI API key is loaded
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not found in environment variables');
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Read the image file
        const imagePath = path.join(__dirname, 'test-image.jpg');
        console.log('Reading image from:', imagePath);
        
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at: ${imagePath}`);
        }
        
        // Generate artwork directly
        console.log('\nGenerating artwork...');
        const artPrompt = `Create an abstract artistic interpretation of an urban route through Los Angeles. 
        The main focus should be a bold, flowing red line that weaves through a minimalist city grid in light gray. 
        The style should be modern and geometric, like a piece of contemporary art. The background should be subtle 
        and light-colored, with the red path being the dominant element. Include abstract representations of urban 
        landmarks like the Crypto.com Arena. The overall composition should feel like a blend between a city map 
        and modern abstract art, with clean lines and a sophisticated color palette of whites, grays, and a striking red path.`;

        console.log('\nUsing prompt:', artPrompt);

        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: artPrompt,
            size: "1024x1024",
            quality: "standard",
            n: 1,
            style: "vivid"
        });

        const artworkUrl = imageResponse.data[0].url;
        
        console.log('\n=== Generated Artwork Results ===');
        console.log('Artwork URL:', artworkUrl);
        
        // Save the URL to a file for easy access
        const resultPath = path.join(__dirname, 'artwork-result.txt');
        fs.writeFileSync(resultPath, `Artwork URL: ${artworkUrl}\n\nPrompt Used: ${artPrompt}`);
        console.log(`\nResults saved to: ${resultPath}`);
        
    } catch (error) {
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

// Suppress deprecation warning
process.removeAllListeners('warning');

console.log('Starting artwork generation test...');
testArtGeneration();