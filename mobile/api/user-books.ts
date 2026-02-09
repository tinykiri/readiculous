import { axiosInstance } from '.';
import { Book } from '../src/types';

const BASE_URL = "/book";

export const getLastTenBooks = async (userId: string): Promise<Book[]> => {
  const { data } = await axiosInstance.get(`${BASE_URL}/${userId}/last-ten-books`);
  return data;
};

export const getBooks = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  search: string = ''
): Promise<{ books: Book[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const { data } = await axiosInstance.get(`${BASE_URL}/${userId}/user-library`, {
    params: {
      page,
      limit,
      search,
    },
  });

  return data;
};

export const addNewBook = async (userId: string, bookData: Book): Promise<{ book: Book; totalBooks: number }> => {
  const { data } = await axiosInstance.post(`${BASE_URL}/${userId}/add-new-book/new-book`, {
    ...bookData,
  });

  return data;
};

export const editRating = async (userId: string, id: number, rating: number): Promise<{ rating: number }> => {
  const { data } = await axiosInstance.put(`${BASE_URL}/${userId}/book/${id}/edit-rating`, {
    rating,
  });

  return data;
};

export const removeBook = async (userId: string, id: number): Promise<{ totalBooks: number }> => {
  const { data } = await axiosInstance.delete(`${BASE_URL}/${userId}/user-library/${id}/remove-book`);
  return data;
};

export const getBookInfo = async (userId: string, id: number): Promise<Book> => {
  const { data } = await axiosInstance.get(`${BASE_URL}/${userId}/book/${id}/book-info`);
  return data;
};

export const addComment = async (userId: string, id: number, comment: string): Promise<{ comment_section: string }> => {
  const { data } = await axiosInstance.post(`${BASE_URL}/${userId}/book/${id}/add-comment`, {
    comment_section: comment,
  });

  return data;
};

export const editComment = async (userId: string, id: number, comment: string): Promise<Book> => {
  const { data } = await axiosInstance.put(`${BASE_URL}/${userId}/book/${id}/edit-comment`, {
    comment_section: comment,
  });

  return data;
};

export const removeComment = async (userId: string, id: number, commentId: number): Promise<{ book: { comment_section: string | null } }> => {
  const { data } = await axiosInstance.delete(`${BASE_URL}/${userId}/book/${id}/comment/${commentId}/remove-comment`);
  return data;
};

export const addQuote = async (userId: string, bookId: number, quote: string): Promise<{ bookQuote: { id: number; content: string; book_id: number } }> => {
  const { data } = await axiosInstance.post(`${BASE_URL}/${userId}/book/${bookId}/add-quote`, {
    quote,
  });

  return data;
};

export const removeQuote = async (userId: string, bookId: number, quoteId: number): Promise<{ quote: { id: number; content: string; book_id: number } }> => {
  const { data } = await axiosInstance.delete(`${BASE_URL}/${userId}/book/${bookId}/memorable-quote/${quoteId}/remove-quote`);
  return data;
};

export const getCalendarData = async (userId: string, year?: number): Promise<{ books: Array<{ started_at: Date | null; finished_at: Date | null; photo_url: string | null }>; year: number; availableYears: number[] }> => {
  const { data } = await axiosInstance.get(`${BASE_URL}/${userId}/calendar-data`, {
    params: year ? { year } : undefined,
  });
  return data;
};
