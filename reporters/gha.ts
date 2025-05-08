import http from 'node:http';
import type { FullResult, Reporter } from '@playwright/test/reporter';

let error = false;

class MyReporter implements Reporter {
  onEnd(result: FullResult) {
    console.log('Test run completed', result.status);

    if (result.status !== 'passed') {
      console.log('Test run failed');

      error = true;
    }
  }

  onBegin() {
    console.log('Test run started');

    http
      .createServer((req, res) => {
        if (req.url === '/isready') {
          console.log('Ready check received', error ? 'yes' : 'nope');

          res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ alive: !error }));
        } else if (req.url === '/isalive') {
          console.log('Alive check received', error ? 'yes' : 'nope');

          res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ alive: !error }));
        } else {
          console.log('Unknown endpoint', req.url);

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      })
      .listen(8080);
  }
}

// biome-ignore lint/style/noDefaultExport: <explanation>
export default MyReporter;
