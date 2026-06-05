import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// If MONGO_URI is not set, pre-emptively activate the Mock DB so that
// when the Mongoose models are imported, they initialize in mock mode.
if (!process.env.MONGO_URI) {
  process.env.USE_MOCK_DB = 'true';
}
