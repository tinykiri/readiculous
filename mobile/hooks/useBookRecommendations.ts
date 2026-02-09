import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  searchBooksByAuthor,
  searchBooksByLanguage,
  searchBooksByPublisher,
  searchSimilarBooks,
  ParsedBook
} from '@/src/services/googleBooksService';

interface UserBook {
  id: string;
  title: string;
  author: string;
  rating?: number | null;
  original_language?: string;
  publisher?: string;
  year_published?: number;
}

interface UserPreferences {
  favoriteAuthors: { author: string; avgRating: number; count: number }[];
  favoritePublishers: string[];
  languagePreference?: string;
  avgYearPublished?: number;
  totalBooks: number;
  avgRating: number;
}

export const useBookRecommendations = (userId: string) => {
  const [recommendations, setRecommendations] = useState<ParsedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  const analyzeUserLibrary = (books: UserBook[]): UserPreferences => {
    const authorStats = books.reduce((acc, book) => {
      const rating = book.rating ?? 0;
      if (rating >= 4) {
        if (!acc[book.author]) {
          acc[book.author] = { total: 0, count: 0 };
        }
        acc[book.author].total += rating;
        acc[book.author].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const favoriteAuthors = Object.entries(authorStats)
      .map(([author, stats]) => ({
        author,
        avgRating: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    const publisherCounts = books
      .filter(book => (book.rating ?? 0) >= 4 && book.publisher)
      .reduce((acc, book) => {
        acc[book.publisher!] = (acc[book.publisher!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const favoritePublishers = Object.entries(publisherCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([publisher]) => publisher);

    const languageCounts = books
      .filter(book => book.original_language)
      .reduce((acc, book) => {
        acc[book.original_language!] = (acc[book.original_language!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const languagePreference = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const avgYearPublished = books
      .filter(book => book.year_published)
      .reduce((sum, book) => sum + book.year_published!, 0) /
      books.filter(book => book.year_published).length;

    const avgRating = books.reduce((sum, book) => sum + (book.rating ?? 0), 0) / books.length;

    return {
      favoriteAuthors,
      favoritePublishers,
      languagePreference,
      avgYearPublished,
      totalBooks: books.length,
      avgRating
    };
  };

  const getSmartRecommendations = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      const queryUserId = session.user.id;

      const { data: userBooks, error } = await supabase
        .from('book')
        .select('*')
        .eq('user_id', queryUserId);

      if (error) {
        console.error('Error fetching user books:', error);
        throw error;
      }

      if (!userBooks || userBooks.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      const preferences = analyzeUserLibrary(userBooks);
      setUserPreferences(preferences);

      const allRecommendations: ParsedBook[] = [];
      const seenBooks = new Set(userBooks.map(b => `${b.title.toLowerCase()}_${b.author.toLowerCase()}`));


      for (const favAuthor of preferences.favoriteAuthors.slice(0, 3)) {
        const authorBooks = await searchBooksByAuthor(favAuthor.author);
        const filtered = authorBooks.filter(book =>
          !seenBooks.has(`${book.title.toLowerCase()}_${book.author.toLowerCase()}`)
        );
        allRecommendations.push(...filtered.slice(0, 3));
      }

      const topBooks = userBooks
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3);

      for (const book of topBooks) {
        const similar = await searchSimilarBooks(book.title, book.author);
        const filtered = similar.filter(rec =>
          !seenBooks.has(`${rec.title.toLowerCase()}_${rec.author.toLowerCase()}`) &&
          rec.author.toLowerCase() !== book.author.toLowerCase()
        );
        allRecommendations.push(...filtered.slice(0, 2));
      }

      if (preferences.favoritePublishers.length > 0) {
        const publisherBooks = await searchBooksByPublisher(preferences.favoritePublishers[0]);
        const filtered = publisherBooks.filter(book =>
          !seenBooks.has(`${book.title.toLowerCase()}_${book.author.toLowerCase()}`)
        );
        allRecommendations.push(...filtered.slice(0, 2));
      }

      if (preferences.languagePreference && preferences.languagePreference !== 'en') {
        const langBooks = await searchBooksByLanguage(preferences.languagePreference);
        const filtered = langBooks.filter(book =>
          !seenBooks.has(`${book.title.toLowerCase()}_${book.author.toLowerCase()}`)
        );
        allRecommendations.push(...filtered.slice(0, 2));
      }

      const uniqueRecommendations = Array.from(
        new Map(allRecommendations.map(book => [book.googleId, book])).values()
      );

      const sorted = uniqueRecommendations
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 20);

      setRecommendations(sorted);
    } catch (error) {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    userPreferences,
    getSmartRecommendations
  };
};