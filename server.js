import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// These two lines replace __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Your Digital Master Tailor routes go here
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
  console.log('Digital Master Tailor running at http://localhost:3000');
});