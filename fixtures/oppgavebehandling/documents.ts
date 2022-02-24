import fs from 'fs';
import { resolve } from 'path';
import { Page, expect } from '@playwright/test';

const getDocumentByName = (page: Page, documentName: string) => {
  const newDocumentsList = page.locator('data-testid=new-documents-list');
  return newDocumentsList.locator(`article[data-documentname="${documentName}"]`);
};

const getDocumentById = (page: Page, documentId: string) => {
  const newDocumentsList = page.locator('data-testid=new-documents-list');
  return newDocumentsList.locator(`article[data-documentid="${documentId}"]`);
};

export const uploadDocument = async (page: Page, filename: string, name: string) => {
  const filePath = resolve(process.cwd(), `./test-pdf-documents/${filename}`);
  const buffer = fs.readFileSync(filePath);
  const mimeType = 'application/pdf';

  const fileInput = page.locator('data-testid=upload-document-input');
  await fileInput.setInputFiles({ name, buffer, mimeType });

  const container = getDocumentByName(page, name);
  await container.waitFor();

  return name;
};

export const renameDocument = async (page: Page, documentName: string, newDocumentName: string) => {
  const container = getDocumentByName(page, documentName);
  const renameButton = container.locator('data-testid=document-title-edit-save-button');
  const documentId = await container.getAttribute('data-documentid');

  if (documentId === null) {
    throw new Error(`Document with name "${documentName}" is missing its document ID.`);
  }

  const renameButtonCount = await renameButton.count();

  if (renameButtonCount !== 1) {
    throw new Error(`Expected 1 rename button, found ${renameButtonCount}`);
  }

  await renameButton.click();

  const input = container.locator('data-testid=document-filename-input');
  await input.focus();
  await input.fill('');
  await input.fill(newDocumentName);
  await input.press('Enter');

  const document = getDocumentById(page, documentId);
  await document.waitFor();
  await document.locator(`text="${newDocumentName}"`).waitFor({ timeout: 100 });

  return newDocumentName;
};

export const finishDocument = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const actionButton = container.locator('data-testid=document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Expected 1 action button, found ${actionButtonCount}`);
  }

  await actionButton.click();

  await container.locator('data-testid=document-finish-button').click();
  await container.locator('data-testid=document-finish-confirm').click();

  await container.locator('data-testid=document-archiving').waitFor();

  return documentName;
};

export const verifyFinishedDocument = async (page: Page, documentName: string) => {
  const inProgressList = page.locator('data-testid=new-documents-list');
  const finishedList = page.locator('data-testid=oppgavebehandling-documents-all-list');

  await inProgressList.waitFor();
  await finishedList.waitFor();

  const finishedDocument = finishedList.locator(`article[data-documentname="${documentName}"]`);
  await finishedDocument.waitFor({ timeout: 20 * 1000 });

  await finishedDocument
    .locator('[data-testid="journalfoert-document-checkbox"]:checked')
    .waitFor({ timeout: 20 * 1000 });

  const inNewList = await inProgressList.locator(`article[data-documentname="${documentName}"]`).count();
  expect(inNewList, 'Forventet at journalført dokument forsvinner fra "Under arbeid"-listen.').toBe(0);
};

export const deleteDocument = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const actionButton = container.locator('data-testid=document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Expected 1 action button, found ${actionButtonCount}`);
  }

  await actionButton.click();

  await container.locator('data-testid=document-delete-button').click();
  await container.locator('data-testid=document-delete-confirm').click();

  await page.waitForResponse((res) => res.request().method() === 'DELETE', { timeout: 500 });

  const documentsCount = await container.count();

  if (documentsCount !== 0) {
    throw new Error(`Expected document to be deleted, but it was not`);
  }

  return documentName;
};
