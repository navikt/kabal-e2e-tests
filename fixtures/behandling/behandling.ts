import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { assignBehandling, deAssignBehandling } from '@/fixtures/behandling/assign';
import { deleteBehandling } from '@/fixtures/behandling/delete';
import {
  deleteDocument,
  downloadPdf,
  finishAndVerifyDocument,
  initSmartEditor,
  renameDocument,
  setDocumentAsAttachmentTo,
  setDocumentType,
  uploadDocument,
} from '@/fixtures/behandling/documents';
import type { IGenerateResponse, SaksTypeName } from '@/fixtures/behandling/generate';
import type { DocumentType } from '@/fixtures/behandling/types';
import { HJEMMEL_MAP_PATH } from '@/setup/get-hjemler';
import { UI_DOMAIN } from '@/tests/functions';

export class Behandling {
  public readonly id: string;
  public readonly typeName: SaksTypeName;
  public readonly ytelseName: string;
  public readonly hjemmelId: string;
  private hjemler: { id: string; navn: string; beskrivelse: string }[] = [];

  constructor(
    private page: Page,
    typeName: SaksTypeName,
    ytelseName: string,
    { id, hjemmelId }: IGenerateResponse,
  ) {
    this.id = id;
    this.typeName = typeName;
    this.ytelseName = ytelseName;
    this.hjemmelId = hjemmelId;

    this.hjemler = JSON.parse(readFileSync(HJEMMEL_MAP_PATH, 'utf-8'));
  }

  public delete = () => deleteBehandling(this.page, this.id);

  // Behandling
  public assign = () => assignBehandling(this.page, this.id);
  public deAssign = () => deAssignBehandling(this.page, this.id);
  public navigateTo = () => this.page.goto(`${UI_DOMAIN}/${this.typeName}behandling/${this.id}`);

  // Documents
  public uploadDocument = (type: DocumentType, filename: string, title = `e2e-${new Date().toISOString()}.pdf`) =>
    uploadDocument(this.page, type, filename, title);
  public renameDocument = (title: string, newTitle: string) => renameDocument(this.page, title, newTitle);
  public deleteDocument = (title: string) => deleteDocument(this.page, title);
  public finishAndVerifyDocument = (title: string) => finishAndVerifyDocument(this.page, title);
  public downloadPdf = async (title: string) => downloadPdf(this.page, this.id, title);
  public setDocumentType = (title: string, type: DocumentType) => setDocumentType(this.page, title, type);
  public setDocumentAsAttachmentTo = (title: string, parentName: string) =>
    setDocumentAsAttachmentTo(this.page, title, parentName);
  public initSmartEditor = (templateName: string) => initSmartEditor(this.page, templateName);
  public getHjemmelName = () => {
    const hjemmel = this.hjemler.find((h) => h.id === this.hjemmelId);

    if (hjemmel === undefined) {
      throw new Error(`Hjemmel with ID "${this.hjemmelId}" not found in hjemler.`);
    }

    return hjemmel.beskrivelse;
  };
}
