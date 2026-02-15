type PdfParseModule = {
  PDFParse: new (options: { data: Uint8Array }) => {
    getText: () => Promise<{ text: string }>
    destroy: () => Promise<void>
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let parser: {
    getText: () => Promise<{ text: string }>
    destroy: () => Promise<void>
  } | null = null

  try {
    const { PDFParse } = (await import("pdf-parse")) as PdfParseModule
    parser = new PDFParse({ data: new Uint8Array(buffer) })

    const result = await parser.getText()
    const combined = result.text.trim()

    if (combined.length === 0) {
      throw new Error("PDF contains no extractable text.")
    }

    return combined
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parser error."
    throw new Error(`Failed to parse PDF: ${message}`)
  } finally {
    if (parser) {
      await parser.destroy()
    }
  }
}
