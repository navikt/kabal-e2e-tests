import { Page } from '@playwright/test';
import { ROOT_URL } from '../../tests/functions';
import { assignTask, deAssignTask } from './assign';
import {
  deleteDocument,
  finishDocument,
  renameDocument,
  setDocumentAsAttachmentTo,
  setDocumentType,
  uploadDocument,
  verifyFinishedDocument,
} from './documents';
import { IGenerateOppgaveResponse, Sakstype } from './generate';
import { DocumentType } from './types';

export class Oppgave {
  private _id: string;
  private _typeId: Sakstype;
  private _ytelseId: string;
  private _hjemmelId: string;
  private page: Page;

  get id(): string {
    return this._id;
  }

  get typeId(): Sakstype {
    return this._typeId;
  }

  get ytelseId(): string {
    return this._ytelseId;
  }

  get hjemmelId(): string {
    return this._hjemmelId;
  }

  constructor(page: Page, { id, typeId, ytelseId, hjemmelId }: IGenerateOppgaveResponse) {
    this.page = page;
    this._id = id;
    this._typeId = typeId;
    this._ytelseId = ytelseId;
    this._hjemmelId = hjemmelId;
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
  public setDocumentType = (title: string, type: DocumentType) => setDocumentType(this.page, title, type);
  public setDocumentAsAttachmentTo = (title: string, parentName: string) =>
    setDocumentAsAttachmentTo(this.page, title, parentName);
}
