import express from 'express';
import cors from 'cors';

import { Anon } from "@anyone-protocol/anyone-client";
import { AnonSocksClient } from "@anyone-protocol/anyone-client";

const app = express();
const port = 3000;

// Enable CORS for all origins
app.use(cors());

let anon;
let anonSocksClient;

async function startAnon() {
  anon = new Anon();
  anonSocksClient = new AnonSocksClient(anon);
  await anon.start();
}

async function stopAnon() {
  await anon.stop();
}

app.get('/start', async (req, res) => {
  try {
    await startAnon();
    res.json({ message: 'Anon started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/stop', async (req, res) => {
  try {
    await stopAnon();
    res.json({ message: 'Anon stopped successfully' });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/get-ip', async (req, res) => {
  try {
    const response = await anonSocksClient.get('https://api.ipify.org?format=json');
    res.json({ ip: response.data.ip }); // Extract the IP directly
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});