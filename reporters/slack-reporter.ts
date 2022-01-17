import nodePath from 'path';
import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fetch from 'node-fetch';
import { SlackMessageThread, getSlack } from '../slack/slack-client';
import {
  SlackIcon,
  asyncForEach,
  delay,
  getFullStatusIcon,
  getTestStatusIcon,
  getTestTitle,
  isNotNull,
} from './functions';

interface TestSlackData {
  icon: SlackIcon;
  status: string;
  title: string;
}

class SlackReporter implements Reporter {
  private slack = getSlack();
  private thread?: SlackMessageThread;
  private mainMessage = '';
  private testStatuses: Map<TestCase, TestSlackData> = new Map();
  private totalTests = 0;
  private completedTests = 0;
  private failedTestCount = 0;
  private creatingSlackMessage = false;
  private timer: NodeJS.Timeout | null = null;
  private startTime = Date.now();

  private async setTestMessage(test: TestCase, status: TestSlackData) {
    this.testStatuses.set(test, status);
    return await this.updateMessage();
  }

  private async updateTestMessage(test: TestCase, status: Partial<Omit<TestSlackData, 'title'>>) {
    const existing = this.testStatuses.get(test);

    if (typeof existing === 'undefined') {
      return;
    }

    return await this.setTestMessage(test, { ...existing, ...status });
  }

  private async updateMainMessage(msg: string) {
    this.mainMessage = msg;
    await this.updateMessage();
  }

  private async updateMessage() {
    // Sort tests by title.
    const orderedTests = Array.from(this.testStatuses.values())
      .sort((a, b) => {
        if (a.title < b.title) {
          return -1;
        }

        if (a.title > b.title) {
          return 1;
        }

        return 0;
      })
      .map(({ icon, status, title }) => `${icon} ${title} - \`${status}\``);

    const message = [`*${this.mainMessage}*`, '', ...orderedTests].join('\n');

    if (this.slack === null) {
      console.log('');
      console.log(message);
      return;
    }

    // If it is currently creating a Slack message/thread.
    if (this.creatingSlackMessage) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
      }

      // Retry in 100ms, hopefully the message/thread exists by then.
      return new Promise<void>((res) => {
        this.timer = setTimeout(async () => {
          await this.updateMessage();
          res();
        }, 100);
      });
    }

    // If there is no Slack message/thread.
    if (typeof this.thread === 'undefined' && !this.creatingSlackMessage) {
      // If it has not yet started to create a Slack message/thread, do so and set the flag.
      this.creatingSlackMessage = true;
      this.thread = await this.slack?.postMessage(this.mainMessage);
      this.creatingSlackMessage = false;
    }

    await this.thread?.update(message);
  }

  async onBegin(config: FullConfig, suite: Suite) {
    const allTests = suite.allTests();
    this.totalTests = allTests.length;
    this.mainMessage = `Running ${this.totalTests} E2E tests with ${config.workers} workers...`;
    allTests.forEach((test) =>
      this.testStatuses.set(test, { icon: SlackIcon.WAITING, title: getTestTitle(test), status: 'Running...' })
    );
    this.updateMessage();
  }

  async onTestBegin(test: TestCase) {
    this.updateTestMessage(test, { icon: SlackIcon.WAITING });
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const icon = getTestStatusIcon(test, result.status);
    const title = getTestTitle(test);
    this.updateTestMessage(test, { icon, status: `${result.duration / 1000} seconds` });

    if (result.status === 'failed' || result.status === 'timedOut') {
      this.failedTestCount += 1;

      const log = [`${title} - stacktrace`, '```', result?.error?.stack ?? 'No stacktrace', '```'];
      await this.thread?.reply(log.join('\n'));

      const fileOrder = ['video', 'screenshot', 'trace'];

      const sortedFiles = result.attachments
        .map(({ name, path }) => {
          if (typeof path === 'undefined') {
            return null;
          }

          return { name, path };
        })
        .filter(isNotNull)
        .sort((a, b) => fileOrder.indexOf(a.name) - fileOrder.indexOf(b.name));

      await asyncForEach(sortedFiles, async ({ name, path }) => {
        const filename = name + nodePath.extname(path);

        if (name === 'trace') {
          return await this.thread?.replyFilePath(
            path,
            `${title} - \`${name}\`\n\`npx playwright show-trace ${filename}\``,
            test.title,
            filename
          );
        }

        return await this.thread?.replyFilePath(path, `${title} - ${name}`, test.title, filename);
      });
    }

    this.completedTests += 1;
  }

  async onEnd(result: FullResult) {
    const icon = getFullStatusIcon(result);
    const duration = (Date.now() - this.startTime) / 1000;

    if (result.status === 'passed') {
      await this.updateMainMessage(`${icon} All ${this.totalTests} tests succeeded! \`${duration} seconds\``);
    } else if (result.status === 'failed') {
      await this.updateMainMessage(
        `<!channel> ${icon} ${this.failedTestCount} of ${this.totalTests} tests failed! \`${duration} seconds\``
      );
    } else if (result.status === 'timedout') {
      await this.updateMainMessage(
        `<!channel> ${icon} Global timeout! ${this.failedTestCount} of ${this.totalTests} tests failed! \`${duration} seconds\``
      );
    }

    // Wait for all tests to be done sending to Slack.
    while (this.completedTests < this.totalTests) {
      await delay(200);
    }

    if (this.slack !== null) {
      console.log('Shutting down Linkerd.');
      // Shut down Linkerd proxy sidecar.
      await fetch('http://127.0.0.1:4191/shutdown', {
        method: 'post',
      });
    }
  }
}

export default SlackReporter;
