import 'dotenv/config'; 
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url'; 

import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import provinceRoutes from './routes/provinceRoutes.js';
import hotspotRoutes from './routes/hostpotRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/badges', badgeRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // Kirim error sebagai JSON
  res.json({
    error: {
      message: err.message,
      status: err.status
    }
  });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
export default app; // Ganti ke export default