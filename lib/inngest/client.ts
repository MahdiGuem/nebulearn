import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nebulearn",
  schemas: {
    "pdf/uploaded": {
      data: {
        documentId: "string",
        pdfUrl: "string",
        teacherId: "string",
        classId: "string",
        subjectId: "string",
        title: "string",
      },
    },
    "pdf/progress": {
      data: {
        documentId: "string",
        progress: "number",
        stage: "string",
        message: "string",
      },
    },
  },
});
