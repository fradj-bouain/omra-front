const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Built Angular files (Angular 17+ default: dist/<project>/browser)
const distPath = path.join(__dirname, 'dist', 'omra-front', 'browser');
app.use(express.static(distPath));

// SPA fallback: all routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serving Angular app on http://0.0.0.0:${PORT}`);
});