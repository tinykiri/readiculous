import { z } from "zod";

export const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    author: z.string().min(1).max(200),
    rating: z.coerce.number().min(0).max(5).optional().nullable(),
    comment_section: z.string().max(5000).optional().nullable(),
    started_at: z.coerce.date(),
    finished_at: z.coerce.date().optional().nullable(),
    photo_url: z.string().url().or(z.literal("")).optional().nullable(),
    original_language: z.string().max(100).optional().nullable(),
    publisher: z.string().max(200).optional().nullable(),
    year_published: z.coerce.date().optional().nullable(),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
  }),
});

export const updateRatingSchema = z.object({
  body: z.object({
    rating: z.number().min(0).max(5),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    comment_section: z.string().min(1, "Comment cannot be empty").max(5000, "Comment is too long"),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const editCommentSchema = z.object({
  body: z.object({
    comment_section: z.string().max(5000, "Comment is too long"),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const addQuoteSchema = z.object({
  body: z.object({
    quote: z.string().min(1, "Quote cannot be empty").max(1000, "Quote is too long"),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const getBooksSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
  }).optional(),
});

export const getBookInfoSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const deleteBookSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
  }),
});

export const deleteQuoteSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
    book_id: z.string().regex(/^\d+$/, "Book ID must be a number"),
    quote_id: z.string().regex(/^\d+$/, "Quote ID must be a number"),
  }),
});

export const getCalendarDataSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
  }),
  query: z.object({
    year: z.string().regex(/^\d{4}$/, "Year must be a 4-digit number").transform(Number).optional(),
  }).optional(),
});
