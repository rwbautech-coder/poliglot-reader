
export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        
        // Access global pdfjsLib
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        
        let fullText = '';
        const maxPages = pdf.numPages;

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
             // @ts-ignore
            .map((item) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }

        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const readFileContent = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  } else {
    // TXT file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};