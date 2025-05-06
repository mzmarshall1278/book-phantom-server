import { Injectable } from '@nestjs/common';

// --- Trie Data Structure ---
class TrieNode {
  children = new Map<string, TrieNode>();
  isEndOfWord = false;
  entityType: string | null = null;
  entityText: string | null = null; // To store the original casing of the entity
}

class Trie {
  root = new TrieNode();

  /**
   * Inserts an entity word into the Trie.
   * Stores the word in lowercase for case-insensitive search,
   * but keeps the original casing in entityText.
   * @param {string} word - The entity text.
   * @param {string} type - The type of the entity.
   */
  insert(word: string, type: string): void {
    let node = this.root;
    const wordLower = word.toLowerCase();
    for (const char of wordLower) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    node.entityType = type;
    node.entityText = word; // Store original casing
  }

  /**
   * Searches for the longest registered entity in the given text, starting from startIndex.
   * The search is case-insensitive.
   * @param {string} text - The text to search within.
   * @param {number} [startIndex=0] - The index in the text to start searching from.
   * @returns {{ text: string; type: string; length: number } | null} 
   * An object with original entity text, type, and match length, or null.
   */
  searchLongestMatch(text: string, startIndex = 0): { text: string; type: string; length: number } | null {
    let currentNode = this.root;
    let longestMatchInfo: { text: string; type: string; length: number } | null = null;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i].toLowerCase(); // Match case-insensitively
      if (!currentNode.children.has(char)) {
        break; // No further match possible down this path
      }
      currentNode = currentNode.children.get(char)!;
      if (currentNode.isEndOfWord && currentNode.entityText && currentNode.entityType) {
        // This node represents a complete entity.
        // It might be part of a longer entity, so we record it and continue.
        longestMatchInfo = {
          text: currentNode.entityText, 
          type: currentNode.entityType,
          length: (i - startIndex + 1), 
        };
      }
    }
    return longestMatchInfo;
  }
}

// --- Helper Functions ---

/**
 * Checks if a character is a type of double quote.
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is a double quote.
 */
function isDoubleQuote(char: string): boolean {
  return ['"', '“', '”'].includes(char);
}

/**
 * Gets the appropriate closing double quote for a given opening quote.
 * @param {string} opening - The opening quote character.
 * @returns {string} The corresponding closing quote character.
 */
function getClosingDoubleQuote(opening: string): string {
  return opening === '“' ? '”' : '"';
}

/**
 * Creates a segment object.
 * @param {string} type - The type of the segment.
 * @param {string} text - The text content of the segment.
 * @returns {{ type: string; text: string }} A segment object.
 */
function createSegment(type: string, text: string): { type: string; text: string } {
  return { type, text };
}

/**
 * Counts the number of words in a text.
 * @param {string} text - The text to count words in.
 * @returns {number} The total number of words.
 */
function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.split(/\s+/).filter(w => w !== '').length;
}

/**
 * Helper function to check for word boundaries.
 * An entity is considered a whole word if it's not preceded or followed by an alphanumeric character.
 * @param {string} str - The full string.
 * @param {number} index - The starting index of the potential entity in str.
 * @param {number} length - The length of the potential entity.
 * @returns {boolean} True if it's a valid word boundary.
 */
function checkWordBoundary(str: string, index: number, length: number): boolean {
  const prevChar = index > 0 ? str[index - 1] : null;
  const nextChar = (index + length) < str.length ? str[index + length] : null;

  const prevOk = (prevChar === null) || !/[a-zA-Z0-9]/.test(prevChar);
  const nextOk = (nextChar === null) || !/[a-zA-Z0-9]/.test(nextChar);
  
  return prevOk && nextOk;
}

/**
 * Processes a segment of text (narrative or dialogue content) to find entities using a Trie.
 * This version is adapted from the JavaScript `processTextSegment` for robust entity finding.
 * @param {string} text - The text segment to process.
 * @param {Trie} trie - The Trie containing entity definitions.
 * @param {{ type: string; text: string }[]} content - The array to push new segments into.
 * @param {boolean} isDialogue - True if the text is part of a dialogue.
 */
function processTextSegment(
  text: string,
  trie: Trie,
  content: { type: string; text: string }[],
  isDialogue: boolean,
): void {
  let remaining = text;
  const segmentType = isDialogue ? 'dialogue' : 'narrative';

  while (remaining.length > 0) {
    let firstEntityFoundInfo: { text: string; type: string; position: number; length: number } | null = null;

    // Iterate through the 'remaining' text to find the *next* (earliest) entity
    for (let i = 0; i < remaining.length; i++) {
      const potentialMatch = trie.searchLongestMatch(remaining, i);

      if (potentialMatch) {
        // An entity was found by the Trie. Now check if it respects word boundaries.
        if (checkWordBoundary(remaining, i, potentialMatch.length)) {
          firstEntityFoundInfo = {
            text: potentialMatch.text,
            type: potentialMatch.type,
            position: i,
            length: potentialMatch.length,
          };
          break; // Found the earliest, boundary-respecting entity
        }
      }
    }

    if (firstEntityFoundInfo) {
      // An entity was found. Add text before it.
      if (firstEntityFoundInfo.position > 0) {
        const beforeText = remaining.slice(0, firstEntityFoundInfo.position);
        content.push(createSegment(segmentType, beforeText));
      }
      // Add the entity segment
      content.push(createSegment(firstEntityFoundInfo.type, firstEntityFoundInfo.text));
      // Update remaining text
      remaining = remaining.slice(firstEntityFoundInfo.position + firstEntityFoundInfo.length);
    } else {
      // No more entities found in the 'remaining' text. Add it all as one segment.
      if (remaining.length > 0) {
        content.push(createSegment(segmentType, remaining));
      }
      remaining = ''; // All text consumed
    }
  }
}

/**
 * Processes a single paragraph, identifying dialogue and narrative segments.
 * @param {string} paragraph - The text of the paragraph.
 * @param {Trie} trie - The Trie containing entity definitions.
 * @returns {{ type: string; text: string }[]} An array of segment objects.
 */
function processParagraph(paragraph: string, trie: Trie): { type: string; text: string }[] {
  const content: { type: string; text: string }[] = [];
  let remaining = paragraph;
  let safetyCounter = 0; // Safety to prevent infinite loops
  const MAX_ITERATIONS = paragraph.length * 2; // Max iterations based on paragraph length

  while (remaining.length > 0 && safetyCounter++ < MAX_ITERATIONS) {
    const quoteMatch = remaining.match(/["“”]/); // Regex to find any type of double quote

    if (quoteMatch && quoteMatch.index !== undefined) { // Ensure quoteMatch.index is defined
      const quoteIndex = quoteMatch.index;
      const quoteChar = quoteMatch[0];

      // Process text before the quote as narrative
      if (quoteIndex > 0) {
        const beforeText = remaining.slice(0, quoteIndex);
        processTextSegment(beforeText, trie, content, false); // isDialogue = false
      }

      // Find the corresponding closing quote
      let endQuoteIndex = -1;
      for (let i = quoteIndex + 1; i < remaining.length; i++) {
        if (isDoubleQuote(remaining[i])) {
          endQuoteIndex = i;
          break;
        }
      }

      if (endQuoteIndex === -1) { // Unclosed quote
        const dialogueContentText = remaining.slice(quoteIndex + 1);
        content.push(createSegment('dialogue', quoteChar)); // Add opening quote
        processTextSegment(dialogueContentText, trie, content, true); // isDialogue = true
        remaining = ''; // Consumed the rest of the paragraph
        break;
      }

      // A closing quote was found
      const dialogueContentText = remaining.slice(quoteIndex + 1, endQuoteIndex);
      content.push(createSegment('dialogue', quoteChar)); // Add opening quote
      processTextSegment(dialogueContentText, trie, content, true); // Process inner dialogue content
      content.push(createSegment('dialogue', getClosingDoubleQuote(quoteChar))); // Add closing quote

      remaining = remaining.slice(endQuoteIndex + 1); // Update remaining text
      continue; // Continue processing the rest of the paragraph
    }

    // No more quotes found in the remaining text, process it as narrative
    processTextSegment(remaining, trie, content, false); // isDialogue = false
    remaining = ''; // Consumed the rest of the paragraph
  }

  return mergeSegments(content); // Merge consecutive segments
}

/**
 * Merges consecutive segments of the same type, including 'dialogue' segments.
 * @param {{ type: string; text: string }[]} segments - Array of segment objects.
 * @returns {{ type: string; text: string }[]} Array of merged segment objects.
 */
function mergeSegments(segments: { type: string; text: string }[]): { type: string; text: string }[] {
  if (!segments || segments.length === 0) {
    return [];
  }
  const merged: { type: string; text: string }[] = [];
  let currentSegment = { ...segments[0] }; 

  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i];
    // Merge if types are the same
    if (currentSegment.type === nextSegment.type) {
      currentSegment.text += nextSegment.text;
    } else {
      merged.push(currentSegment);
      currentSegment = { ...nextSegment };
    }
  }
  merged.push(currentSegment); // Push the last accumulated segment
  return merged;
}

/**
 * Main chapter processing function to be called by the service.
 * @param {string} text - The full text of the chapter.
 * @param {string} title - The title of the chapter.
 * @param {Trie} trie - The pre-populated Trie with relevant entities.
 * @returns {{ title: string; totalWords: number; paragraphs: { id: number; content: { type: string; text: string }[] }[] }}
 */
function processChapterWithTrie(
  text: string,
  title: string,
  trie: Trie
): {
  title: string;
  totalWords: number;
  paragraphs: { id: number; content: { type: string; text: string }[] }[];
} {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  return {
    title,
    totalWords: countWords(text),
    paragraphs: paragraphs.map((para, index) => ({
      id: index + 1,
      content: processParagraph(para, trie), // Use the robust processParagraph
    })),
  };
}


// --- NestJS Service ---
@Injectable()
export class ChapterProcessingService {
  /**
   * Processes the chapter content to identify narrative, dialogue, and entities.
   * @param {string} text - The raw text of the chapter.
   * @param {string} title - The title of the chapter.
   * @param {Record<string, string[]>} dictionary - A dictionary of entities, 
   * e.g., { characters: ["Harry", "Ron"], places: ["Hogwarts"] }.
   * The key is the plural entity type (e.g., "characters") and
   * the value is an array of entity strings.
   * @returns The processed chapter structure.
   */
  processChapterContent(
    text: string,
    title: string,
    dictionary: any // Using Record for better type safety
  ) {
    const presentDictionary: any = {};
    const lowerCaseText = text.toLowerCase();

    // Filter dictionary to include only items present in the text (optimization)
    for (const typePlural in dictionary) {
      if (Object.prototype.hasOwnProperty.call(dictionary, typePlural) && Array.isArray(dictionary[typePlural])) {
        const relevantItems = dictionary[typePlural].filter(item =>
          typeof item === 'string' && lowerCaseText.includes(item.toLowerCase()),
        );
        if (relevantItems.length > 0) {
          presentDictionary[typePlural] = relevantItems;
        }
      }
    }

    // Populate the Trie
    const localTrie = new Trie();
    for (const typePlural in presentDictionary) {
      if (Object.prototype.hasOwnProperty.call(presentDictionary, typePlural)) {
        // Convert plural type (e.g., "characters") to singular (e.g., "character")
        // This assumes simple pluralization by removing 's'. Adjust if needed.
        const singularType = typePlural.endsWith('s') ? typePlural.slice(0, -1) : typePlural;
        presentDictionary[typePlural].forEach(item => {
          if (typeof item === 'string' && item.trim() !== '') { // Ensure item is a valid string
             localTrie.insert(item, singularType);
          }
        });
      }
    }
    
    // console.log("Present (filtered and relevant) Dictionary for Trie:", presentDictionary);
    // Use the main processing function that utilizes the robust paragraph and text segment processors
    return processChapterWithTrie(text, title, localTrie);
  }
}

/*
// Example Usage (can be run in a Node.js environment with NestJS context or adapted for testing)

async function testService() {
  const service = new ChapterProcessingService();
  const entitiesExample = {
    characters: ["Harry", "Ron", "Hermione", "Dumbledore", "He"],
    places: ["Hogwarts", "Diagon Alley", "Privet Drive", "New York"],
    spells: ["Wingardium Leviosa", "Expecto Patronum", "Avada Kedavra"],
    specials: ["Golden Snitch", "Marauder's Map"] // Note: type will be 'special'
  };

  const chapterText1 = `“Are you sure that’s a real spell?” asked Hermione. "Well, it’s not very good, is it?"
Harry looked at Ron. "He's right!" This was at Hogwarts. He smiled. They went to New York.`;

  const processedChapter1 = service.processChapterContent(chapterText1, "Chapter 1 Title", entitiesExample);
  console.log("--- Processed Chapter 1 ---");
  processedChapter1.paragraphs.forEach((p, i) => {
    console.log(`Paragraph ${i + 1}:`);
    console.log(JSON.stringify(p.content, null, 2));
  });

  const chapterText2 = `"A spell," said Dumbledore, "like Avada Kedavra, is powerful." Even He knew it.`;
   const processedChapter2 = service.processChapterContent(chapterText2, "Chapter 2 Title", entitiesExample);
  console.log("\n--- Processed Chapter 2 ---");
  processedChapter2.paragraphs.forEach((p, i) => {
    console.log(`Paragraph ${i + 1}:`);
    console.log(JSON.stringify(p.content, null, 2));
  });

  const chapterText3 = `Dialogue at start, "then Ron appeared." Hogwarts was mentioned.`;
  const processedChapter3 = service.processChapterContent(chapterText3, "Chapter 3: Dialogue First", entitiesExample);
   console.log("\n--- Processed Chapter 3 ---");
   processedChapter3.paragraphs.forEach((p, i) => {
     console.log(`Paragraph ${i + 1}:`);
     console.log(JSON.stringify(p.content, null, 2));
   });
}

// testService(); // Uncomment to run example if in a suitable environment
*/
