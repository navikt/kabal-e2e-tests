import { test } from '../fixtures/oppgavebehandling/fixture';
import { DocumentType } from '../fixtures/oppgavebehandling/types';

test.describe('Dokumenter', () => {
  test('Saksbehandler kan laste opp og slette dokumenter', async ({ kabalPage }) => {
    const filename = 'e2e-test-document.pdf';

    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

    const title = await oppgave.uploadDocument(filename);
    await oppgave.deleteDocument(title);

    await oppgave.deAssign();
  });

  test('Opplasting, endre navn/type, ferdigstille, sette vedlegg', async ({ kabalPage }) => {
    const filename = 'e2e-test-document.pdf';

    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

    const documents: string[] = [];

    const DOCUMENTS_TO_UPLOAD = 5;

    for (let i = 0; i < DOCUMENTS_TO_UPLOAD; i++) {
      const title = await oppgave.uploadDocument(filename);
      documents.push(title);
    }

    const [parent, vedlegg] = documents;

    await oppgave.setDocumentAsAttachmentTo(vedlegg, parent);

    const renamedDocuments: string[] = [];

    for (const title of documents) {
      const newTitle = await oppgave.renameDocument(title, `${title}-renamed`);

      renamedDocuments.push(newTitle);
    }

    const [hoveddokument1, vedlegg1, vedlegg2, hoveddokument2, hoveddokument3] = renamedDocuments;
    const hoveddokumentmenter = [hoveddokument1, hoveddokument2, hoveddokument3];

    await oppgave.setDocumentAsAttachmentTo(vedlegg2, hoveddokument1);
    const newTitle = `${vedlegg1}-again`;
    await oppgave.renameDocument(vedlegg1, newTitle);

    const afterAttachmentNames = renamedDocuments.map((n) => (n === vedlegg1 ? newTitle : n));

    await oppgave.setDocumentType(hoveddokument2, DocumentType.BREV);
    await oppgave.setDocumentType(hoveddokument3, DocumentType.BESLUTNING);

    for (const hoveddokument of hoveddokumentmenter) {
      await oppgave.finishDocument(hoveddokument);
    }

    const journalfoerte = afterAttachmentNames.map(oppgave.verifyFinishedDocument);

    await Promise.all(journalfoerte);

    await oppgave.deAssign();
  });
});
