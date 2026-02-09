const googleBooksAPI = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API || 'https://www.googleapis.com/books/v1/volumes';
const googleBooksAPIKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

const sanitizeQuery = (str: string) => {
  if (!str) return '';
  return str
    .replace(/[,\.;:!\?]/g, '')
    .trim()
    .normalize('NFC');
};

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: { thumbnail: string };
    averageRating?: number;
    pageCount?: number;
    publishedDate?: string;
    language?: string;
    publisher?: string;
  };
}

export interface ParsedBook {
  googleId: string;
  title: string;
  author: string;
  description?: string;
  thumbnail?: string;
  categories: string[];
  averageRating?: number;
  pageCount?: number;
  publishedDate?: string;
  language?: string;
  publisher?: string;
  matchReason?: string;
}

const parseGoogleBooks = (items: GoogleBook[], matchReason: string): ParsedBook[] => {
  return items.map(item => ({
    googleId: item.id,
    title: item.volumeInfo.title || 'Unknown Title',
    author: item.volumeInfo.authors?.[0] || 'Unknown Author',
    description: item.volumeInfo.description,
    thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
    categories: item.volumeInfo.categories || [],
    averageRating: item.volumeInfo.averageRating,
    pageCount: item.volumeInfo.pageCount,
    publishedDate: item.volumeInfo.publishedDate,
    language: item.volumeInfo.language,
    publisher: item.volumeInfo.publisher,
    matchReason
  }));
};

export const searchBooksByAuthor = async (author: string): Promise<ParsedBook[]> => {
  if (!googleBooksAPIKey || !author) return [];
  const cleanAuthor = sanitizeQuery(author);
  try {
    const url = `${googleBooksAPI}?q=inauthor:"${encodeURIComponent(cleanAuthor)}"&maxResults=15&orderBy=relevance&key=${googleBooksAPIKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return [];
    return parseGoogleBooks(data.items || [], `Other books by ${cleanAuthor}`);
  } catch (error) {
    console.error('Error fetching books by author:', error);
    return [];
  }
};

export const searchSimilarBooks = async (title: string, author: string): Promise<ParsedBook[]> => {
  if (!googleBooksAPIKey) return [];
  const cleanTitle = sanitizeQuery(title);
  const cleanAuthor = sanitizeQuery(author);
  try {
    const query = `${cleanTitle} ${cleanAuthor}`;
    const url = `${googleBooksAPI}?q=${encodeURIComponent(query)}&maxResults=10&key=${googleBooksAPIKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return [];
    const filteredItems = (data.items || []).filter((item: GoogleBook) =>
      !item.volumeInfo.title.toLowerCase().includes(cleanTitle.toLowerCase())
    );
    return parseGoogleBooks(filteredItems, `Because you liked "${cleanTitle}"`);
  } catch (error) {
    console.error('Error fetching similar books:', error);
    return [];
  }
};

export const searchBooksByPublisher = async (publisher: string): Promise<ParsedBook[]> => {
  if (!googleBooksAPIKey || !publisher) return [];
  const cleanPublisher = sanitizeQuery(publisher);
  try {
    const url = `${googleBooksAPI}?q=inpublisher:"${encodeURIComponent(cleanPublisher)}"&maxResults=10&orderBy=newest&key=${googleBooksAPIKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return [];
    return parseGoogleBooks(data.items || [], `New from ${cleanPublisher}`);
  } catch (error) {
    console.error('Error fetching books by publisher:', error);
    return [];
  }
};

export const searchBooksByLanguage = async (language: string, genre?: string): Promise<ParsedBook[]> => {
  if (!googleBooksAPIKey) return [];
  try {
    const query = genre ? `subject:${genre}` : '""';
    const url = `${googleBooksAPI}?q=${encodeURIComponent(query)}&langRestrict=${language}&maxResults=10&key=${googleBooksAPIKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return parseGoogleBooks(data.items || [], `Popular in ${language}`);
  } catch (error) {
    return [];
  }
};

export const testGoogleBooksAPI = async () => {
  if (!googleBooksAPIKey) return console.error('Missing API Key');
  const url = `${googleBooksAPI}?q=harry+potter&maxResults=1&key=${googleBooksAPIKey}`;
  try {
    const res = await fetch(url);
    await res.json();
    return res.ok;
  } catch (e) {
    console.error('API Test Failed');
    return false;
  }
};