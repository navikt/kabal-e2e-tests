import { test } from '../fixtures/behandling/fixture';
import { DocumentType } from '../fixtures/behandling/types';

test.describe('Dokumenter', () => {
  test('Saksbehandler kan laste opp og slette dokumenter', async ({ klagebehandling }) => {
    const filename = 'e2e-test-document.pdf';

    const { behandling } = klagebehandling;

    const title = await behandling.uploadDocument(filename);
    await behandling.deleteDocument(title);
  });

  test('Opplasting, endre navn/type, ferdigstille, sette vedlegg', async ({ klagebehandling }) => {
    const filename = 'e2e-test-document.pdf';

    const { behandling } = klagebehandling;

    const documents: string[] = [];

    const DOCUMENTS_TO_UPLOAD = 5;

    for (let i = 0; i < DOCUMENTS_TO_UPLOAD; i++) {
      const title = await behandling.uploadDocument(filename);
      documents.push(title);
    }

    const [parent, vedlegg] = documents;

    await behandling.setDocumentAsAttachmentTo(vedlegg, parent);

    const renamedDocuments: string[] = [];

    for (const title of documents) {
      const newTitle = await behandling.renameDocument(title, `${title}-renamed`);

      renamedDocuments.push(newTitle);
    }

    const [hoveddokument1, vedlegg1, vedlegg2, hoveddokument2, hoveddokument3] = renamedDocuments;
    const hoveddokumentmenter = [hoveddokument1, hoveddokument2, hoveddokument3];

    await behandling.setDocumentAsAttachmentTo(vedlegg2, hoveddokument1);
    const newTitle = `${vedlegg1}-again`;
    await behandling.renameDocument(vedlegg1, newTitle);

    const afterAttachmentNames = renamedDocuments.map((n) => (n === vedlegg1 ? newTitle : n));

    await behandling.setDocumentType(hoveddokument2, DocumentType.BREV);
    await behandling.setDocumentType(hoveddokument3, DocumentType.BESLUTNING);

    for (const hoveddokument of hoveddokumentmenter) {
      await behandling.finishDocument(hoveddokument);
    }

    const journalfoerte = afterAttachmentNames.map(behandling.verifyFinishedDocument);

    await Promise.all(journalfoerte);

    await behandling.deAssign();
  });
});
