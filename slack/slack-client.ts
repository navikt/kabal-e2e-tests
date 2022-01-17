import { ReadStream, createReadStream } from 'fs';
import { App } from '@slack/bolt';
import { ChatPostMessageResponse } from '@slack/web-api';
import { requiredEnvString } from '../config/env';

class SlackClient {
  private app: App;
  private token: string;
  private channel: string;

  constructor() {
    this.token = requiredEnvString('slack_e2e_token');
    this.channel = requiredEnvString('kabal_notications_channel');

    this.app = new App({
      token: this.token,
      signingSecret: requiredEnvString('slack_signing_secret'),
    });
  }

  async postMessage(message: string) {
    const response = await this.app.client.chat.postMessage({
      token: this.token,
      channel: this.channel,
      text: message,
    });

    return new SlackMessageThread(this, response);
  }

  async uploadFile(
    filePath: string,
    filename: string = filePath,
    title: string = filePath,
    message?: string,
    threadMessage?: ChatPostMessageResponse
  ) {
    return await this.uploadFileBuffer(createReadStream(filePath), filename, title, message, threadMessage);
  }

  async uploadFileBuffer(
    fileBuffer: Buffer | ReadStream,
    filename: string,
    title: string,
    message?: string,
    threadMessage?: ChatPostMessageResponse
  ) {
    return await this.app.client.files.upload({
      token: this.token,
      file: fileBuffer,
      channels: threadMessage?.channel ?? this.channel,
      filename,
      title,
      initial_comment: message,
      thread_ts: threadMessage?.ts,
    });
  }

  async updateMessage(message: ChatPostMessageResponse, newMessage: string) {
    if (typeof message.ts === 'undefined') {
      throw new Error('Could not update message.');
    }

    const response = await this.app.client.chat.update({
      token: this.token,
      channel: message?.channel ?? this.channel,
      ts: message.ts,
      text: newMessage,
    });

    return new SlackMessageThread(this, response);
  }

  async postReply(threadMessage: ChatPostMessageResponse, reply: string) {
    if (typeof threadMessage.ts === 'undefined') {
      throw new Error('Could not reply to message.');
    }

    await this.app.client.chat.postMessage({
      token: this.token,
      channel: threadMessage?.channel ?? this.channel,
      thread_ts: threadMessage.ts,
      text: reply,
    });

    return threadMessage;
  }
}

export type SlackClientType = InstanceType<typeof SlackClient>;

const isDeployed = process.env.NODE_ENV === 'test';

export const getSlack = () => {
  if (isDeployed) {
    return new SlackClient();
  }

  return null;
};

export class SlackMessageThread {
  private app: SlackClient;
  private message: ChatPostMessageResponse;

  constructor(app: SlackClient, message: ChatPostMessageResponse) {
    this.app = app;
    this.message = message;
  }

  update = (newMessage: string) => this.app.updateMessage(this.message, newMessage);

  reply = (reply: string) => this.app.postReply(this.message, reply);

  replyFilePath = (filePath: string, reply?: string, title?: string, filename?: string) =>
    this.app.uploadFile(filePath, filename, title, reply, this.message);

  replyFileBuffer = (file: Buffer, reply?: string, title?: string, filename?: string) =>
    this.app.uploadFileBuffer(file, filename, title, reply, this.message);
}
