import { Page } from '@playwright/test';
import { UI_DOMAIN } from '../../tests/functions';
import { assignBehandling, deAssignBehandling } from './assign';
import { deleteBehandling } from './delete';
import {
  deleteDocument,
  finishAndVerifyDocument,
  renameDocument,
  setDocumentAsAttachmentTo,
  setDocumentType,
  uploadDocument,
} from './documents';
import { IGenerateResponse, SaksTypeName, Sakstype } from './generate';
import { DocumentType } from './types';

export class Behandling {
  public readonly id: string;
  public readonly typeId: Sakstype;
  public readonly ytelseId: string;
  public readonly hjemmelId: string;

  constructor(private page: Page, { id, typeId, ytelseId, hjemmelId }: IGenerateResponse) {
    this.id = id;
    this.typeId = typeId;
    this.ytelseId = ytelseId;
    this.hjemmelId = hjemmelId;
  }

  private getTypeName = (): SaksTypeName => (this.typeId === Sakstype.KLAGE ? SaksTypeName.KLAGE : SaksTypeName.ANKE);

  public delete = () => deleteBehandling(this.page, this.id);

  // Behandling
  public assign = () => assignBehandling(this.page, this.id);
  public deAssign = () => deAssignBehandling(this.page, this.id);
  public navigateTo = () => this.page.goto(`${UI_DOMAIN}/${this.getTypeName()}behandling/${this.id}`);

  // Documents
  public uploadDocument = (type: DocumentType, filename: string, title = `e2e-${new Date().toISOString()}.pdf`) =>
    uploadDocument(this.page, type, filename, title);
  public renameDocument = (title: string, newTitle: string) => renameDocument(this.page, title, newTitle);
  public deleteDocument = (title: string) => deleteDocument(this.page, title);
  public finishAndVerifyDocument = (title: string) => finishAndVerifyDocument(this.page, title);
  public setDocumentType = (title: string, type: DocumentType) => setDocumentType(this.page, title, type);
  public setDocumentAsAttachmentTo = (title: string, parentName: string) =>
    setDocumentAsAttachmentTo(this.page, title, parentName);
}
