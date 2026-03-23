import express from 'express';
import cors from 'cors';
import { routes } from './routes';

const app = express();
app.use(express.json());
app.use(cors());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// All API routes
app.use('/api', routes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
