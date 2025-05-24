import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: false
})
export class MarkdownPipe implements PipeTransform {
  async transform(value: string): Promise<string> {
    if (!value) return '';
  
    // Decodifica HTML para recuperar Markdown bruto
    let cleaned = value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  
    // Corrige blocos de código não fechados (exemplo simples)
    const openBlocks = (cleaned.match(/```/g) || []).length;
    if (openBlocks % 2 !== 0) {
      cleaned += '\n```';  // fecha bloco aberto
    }
  
    return await marked.parse(cleaned);
  }
}