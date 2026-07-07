import { XMLParser } from 'fast-xml-parser';

// Preserve attributes and tag names so the importer can normalize the legacy XML reliably.
export const markrXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  trimValues: true,
});
