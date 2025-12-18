/**
 * Busca de letras de música
 * Otimizado com HTTP connection pooling
 */

import { scrapingClient } from '../../utils/httpClient.js';
import { parseHTML } from 'linkedom';

async function getLyrics(topic) {
  try {
    // Search request
    const response = await scrapingClient.get(`https://solr.sscdn.co/letras/m1/?q=${encodeURIComponent(topic)}&wt=json&callback=LetrasSug`);
    
    if (response.status !== 200) {
      throw new Error('Erro ao buscar letra da música');
    }

    // Parse JSONP response
    const jsonData = response.data.replace('LetrasSug(', '').replace(')\n', '');
    const parsedData = JSON.parse(jsonData);

    if (!parsedData?.response?.docs?.length) {
      throw new Error('Letra não encontrada');
    }

    const lyric = parsedData.response.docs[0];
    if (!lyric?.dns || !lyric?.url) {
      throw new Error('Letra não encontrada');
    }

    // Fetch lyrics page
    const lyricUrl = `https://www.letras.mus.br/${lyric.dns}/${lyric.url}`;
    const lyricResponse = await scrapingClient.get(lyricUrl);

    if (lyricResponse.status !== 200) {
      throw new Error('Sem resposta do servidor');
    }

    // Parse HTML with linkedom
    const { document } = parseHTML(lyricResponse.data);

    // Extract metadata
    const title = document.querySelector('h1')?.textContent || 'Título não disponível';
    const artist = document.querySelector('h2.textStyle-secondary')?.textContent || 'Artista não disponível';

    // Extract lyrics
    const lyricElements = document.querySelectorAll('.lyric-original > p');

    if (!lyricElements.length) {
      throw new Error('Letra não encontrada');
    }

    // Process lyrics, preserving stanzas
    const lyricsText = Array.from(lyricElements).map(p => {
      const spans = p.querySelectorAll('span.verse');
      
      if (spans.length) {
        // Handle romanization (e.g., for songs with alternate scripts)
        return Array.from(spans)
          .map(span => span.querySelector('span.romanization')?.textContent || '')
          .filter(line => line)
          .join('\n');
      }
      
      // Split lines within a stanza and filter out empty lines
      return p.innerHTML.split('<br>')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
    }).filter(stanza => stanza); // Filter out empty stanzas

    // Format output with metadata and lyrics, separating stanzas with double line breaks
    const formattedOutput = `
🎵 *${title.replaceAll('\n', '').replaceAll('  ', '')}* 🎵
Artista: ${artist.replaceAll('\n', '').replaceAll('  ', '')}
URL: ${lyricUrl}

📜 *Letra*:
${lyricsText.join('\n\n')}
    `.trim();

    return formattedOutput;

  } catch (error) {
    throw new Error(`Erro: ${error.message}`);
  }
}

export default getLyrics;