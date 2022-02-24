import { Page } from '@playwright/test';
import { ROOT_URL } from '../../tests/functions';
import { assignTask, deAssignTask } from './assign';
import { deleteDocument, finishDocument, renameDocument, uploadDocument, verifyFinishedDocument } from './documents';

export class Oppgave {
  private _id: string;
  private page: Page;

  get id(): string {
    return this._id;
  }

  constructor(page: Page, id: string) {
    this.page = page;
    this._id = id;
  }

  public assign = () => assignTask(this.page, this._id);
  public deAssign = () => deAssignTask(this.page, this._id);
  public navigateTo = () => this.page.goto(`${ROOT_URL}/klagebehandling/${this._id}`);

  public uploadDocument = (filename: string, title = `e2e-${new Date().toISOString()}.pdf`) =>
    uploadDocument(this.page, filename, title);
  public renameDocument = (title: string, newTitle: string) => renameDocument(this.page, title, newTitle);
  public finishDocument = (title: string) => finishDocument(this.page, title);
  public deleteDocument = (title: string) => deleteDocument(this.page, title);
  public verifyFinishedDocument = (title: string) => verifyFinishedDocument(this.page, title);
}
