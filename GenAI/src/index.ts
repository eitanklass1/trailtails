import { z } from "zod";
import OpenAI from "openai";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

// Check for required API keys
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required in .env.development file');
}

if (!process.env.DAIN_API_KEY) {
  throw new Error('DAIN_API_KEY is required in .env.development file');
}

console.log('DAIN API Key loaded:', process.env.DAIN_API_KEY.substring(0, 8) + '...');
console.log('OpenAI API Key loaded:', process.env.OPENAI_API_KEY.substring(0, 8) + '...');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateTrailArtConfig: ToolConfig = {
  id: "generate-trail-art",
  name: "Generate Trail Art",
  description: "Generates artistic interpretation of a hiking trail photo",
  input: z
    .object({
      imageBase64: z.string().describe("Base64 encoded trail image"),
      stylePreference: z.string().optional().describe("Optional art style preference"),
    })
    .describe("Input parameters for the art generation request"),
  output: z
    .object({
      artworkUrl: z.string().describe("URL of the generated artwork"),
      description: z.string().describe("Description of the generated artwork"),
    })
    .describe("Generated artwork information"),
  pricing: { pricePerUse: 2, currency: "USD" },
  handler: async ({ imageBase64, stylePreference }, agentInfo) => {
    try {
      console.log("Starting artwork generation...");
      console.log("Agent Info:", agentInfo);

      // First, analyze the trail image using GPT-4 Vision
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this hiking trail scene in detail, focusing on the landscape, colors, and natural elements present.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      });

      const sceneDescription = visionResponse.choices[0].message.content;
      console.log("\nScene Description:", sceneDescription);

      // Then generate artwork based on the description
      const artStyle = stylePreference || "impressionistic landscape painting with dramatic lighting";
      const artPrompt = `Create an artistic interpretation of this hiking trail scene: ${sceneDescription}. Style: ${artStyle}`;
      
      console.log("\nGenerating artwork with prompt:", artPrompt);

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: artPrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      const artworkUrl = imageResponse.data[0].url;
      
      console.log("\n========================================");
      console.log("🎨 Generated Artwork URL:");
      console.log(artworkUrl);
      console.log("========================================\n");

      return {
        text: `Artwork generated successfully! You can view it at: ${artworkUrl}`,
        data: {
          artworkUrl,
          description: sceneDescription,
        },
        ui: {
          image: artworkUrl,
        },
      };

    } catch (error) {
      console.error("Error generating artwork:", error);
      throw new Error(`Failed to generate artwork: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "Trail Art Generation Service",
    description: "A DAIN service that transforms hiking trail photos into artistic interpretations",
    version: "1.0.0",
    author: "Your Name",
    tags: ["hiking", "art", "ai", "trail"],
    logo: "https://cdn-icons-png.flaticon.com/512/2784/2784403.png"
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY
  },
  tools: [generateTrailArtConfig],
});

// Add error handling for the server start
dainService.startNode({ port: 2023 })
  .then(() => {
    console.log("Trail Art Generation Service is running on port 2023");
  })
  .catch((error) => {
    console.error("Failed to start service:", error);
    process.exit(1);
  });

// Add graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});