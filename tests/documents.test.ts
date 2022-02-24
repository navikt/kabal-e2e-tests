import { test } from '../fixtures/oppgavebehandling/fixture';

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

  test('Saksbehandler kan laste opp, endre navn på og ferdigstille dokumenter', async ({ kabalPage }) => {
    const filename = 'e2e-test-document.pdf';

    const oppgave = await kabalPage.generateKlage();
    await oppgave.assign();
    await oppgave.navigateTo();

    const documents: string[] = [];

    for (let i = 0; i <= 3; i++) {
      const title = await oppgave.uploadDocument(filename);
      documents.push(title);
    }

    const renamedFinishedDocuments: string[] = [];

    for (const title of documents) {
      const newTitle = await oppgave.renameDocument(title, `${title}-renamed`);
      await kabalPage.page.waitForResponse(
        (response) => response.url().endsWith('/tittel') && response.request().method() === 'PUT' && response.ok()
      );
      await oppgave.finishDocument(newTitle);
      renamedFinishedDocuments.push(newTitle);
    }

    const journalfoerte = renamedFinishedDocuments.map((title) => oppgave.verifyFinishedDocument(title));

    await Promise.all(journalfoerte);

    await oppgave.deAssign();
  });
});
