import { Router, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../../utils/prisma";
import { authenticate, authorizeUser, AuthenticatedRequest } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createBookSchema,
  updateRatingSchema,
  addCommentSchema,
  editCommentSchema,
  addQuoteSchema,
  getBooksSchema,
  getBookInfoSchema,
  deleteBookSchema,
  deleteQuoteSchema,
  getCalendarDataSchema,
} from "../schemas/book.schemas";

const router = Router();

router.use(authenticate);

// Create new book
router.post(
  "/:user_id/add-new-book/new-book",
  authorizeUser,
  validate(createBookSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;
    const data = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          ...data,
          user_id: user_id,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user_id },
        data: { total_books: { increment: 1 } },
        select: { total_books: true },
      });

      return { book, totalBooks: updatedUser.total_books };
    });

    res.status(201).json(result);
  })
);

// Update book rating
router.put(
  '/:user_id/book/:book_id/edit-rating',
  authorizeUser,
  validate(updateRatingSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;
    const { rating } = req.body;

    const book = await prisma.book.update({
      where: {
        id: Number(book_id),
        user_id: user_id,
      },
      data: {
        rating: Number(rating),
      },
      select: {
        rating: true,
      },
    });

    res.json(book);
  })
);

// Get user's library with pagination and search
router.get(
  "/:user_id/user-library",
  authorizeUser,
  validate(getBooksSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: user_id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          started_at: 'desc',
        },
      }),
      prisma.book.count({ where }),
    ]);

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get last ten books
router.get(
  "/:user_id/last-ten-books",
  authorizeUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;

    const last10Books = await prisma.book.findMany({
      where: {
        user_id: user_id,
      },
      orderBy: {
        started_at: 'desc',
      },
      take: 10,
    });

    res.json(last10Books);
  })
);

// Get calendar data
router.get(
  "/:user_id/calendar-data",
  authorizeUser,
  validate(getCalendarDataSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const allBooks = await prisma.book.findMany({
      where: {
        user_id: user_id,
      },
      select: {
        started_at: true,
        finished_at: true,
      },
    });

    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());

    allBooks.forEach((book) => {
      if (book.started_at) {
        yearsSet.add(book.started_at.getFullYear());
      }
      if (book.finished_at) {
        yearsSet.add(book.finished_at.getFullYear());
      }
    });

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    const books = await prisma.book.findMany({
      where: {
        user_id: user_id,
        OR: [
          {
            started_at: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          },
          {
            finished_at: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          },
        ],
      },
      select: {
        started_at: true,
        finished_at: true,
        photo_url: true,
      },
    });

    res.json({ books, year, availableYears });
  })
);

// Delete book
router.delete(
  "/:user_id/user-library/:book_id/remove-book",
  authorizeUser,
  validate(deleteBookSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: {
          id: Number(book_id),
          user_id: user_id,
        },
      });

      if (!book) {
        const error: any = new Error("Book not found");
        error.statusCode = 404;
        throw error;
      }

      await tx.book.delete({
        where: {
          id: Number(book_id),
          user_id: user_id,
        },
      });

      const updatedUser = await tx.user.update({
        where: {
          id: user_id,
        },
        data: {
          total_books: {
            decrement: 1,
          },
        },
        select: {
          total_books: true,
        },
      });

      return { totalBooks: updatedUser.total_books };
    });

    res.json(result);
  })
);

// Add comment
router.post(
  '/:user_id/book/:book_id/add-comment',
  authorizeUser,
  validate(addCommentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;
    const { comment_section } = req.body;

    const book = await prisma.book.update({
      where: {
        id: Number(book_id),
        user_id: user_id,
      },
      data: {
        comment_section: comment_section,
      },
      select: {
        comment_section: true,
      },
    });

    res.json(book);
  })
);

// Edit comment
router.put(
  '/:user_id/book/:book_id/edit-comment',
  authorizeUser,
  validate(editCommentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;
    const { comment_section } = req.body;

    const book = await prisma.book.update({
      where: {
        id: Number(book_id),
        user_id: user_id,
      },
      data: {
        comment_section: comment_section,
      },
    });

    res.json(book);
  })
);

// Remove comment
router.delete(
  '/:user_id/book/:book_id/comment/:comment_id/remove-comment',
  authorizeUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.update({
        where: {
          id: Number(book_id),
          user_id: user_id,
        },
        data: {
          comment_section: null,
        },
        select: {
          comment_section: true,
        },
      });

      return { book };
    });

    res.json(result);
  })
);

// Get book info
router.get(
  '/:user_id/book/:book_id/book-info',
  authorizeUser,
  validate(getBookInfoSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;

    const book = await prisma.book.findUnique({
      where: {
        id: Number(book_id),
        user_id: user_id,
      },
      select: {
        title: true,
        author: true,
        rating: true,
        comment_section: true,
        started_at: true,
        finished_at: true,
        photo_url: true,
        original_language: true,
        publisher: true,
        year_published: true,
        memorable_quotes: true,
      },
    });

    if (!book) {
      res.status(404).json({
        error: "Not Found",
        message: "Book not found",
      });
      return;
    }

    res.json(book);
  })
);

// Add quote
router.post(
  '/:user_id/book/:book_id/add-quote',
  authorizeUser,
  validate(addQuoteSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id } = req.params;
    const { quote } = req.body;

    const book = await prisma.book.findUnique({
      where: {
        id: Number(book_id),
        user_id: user_id,
      },
    });

    if (!book) {
      res.status(404).json({
        error: "Not Found",
        message: "Book not found",
      });
      return;
    }

    const bookQuote = await prisma.memorable_quote.create({
      data: {
        content: quote,
        book_id: Number(book_id),
      },
    });

    res.status(201).json({ bookQuote });
  })
);

// Remove quote
router.delete(
  '/:user_id/book/:book_id/memorable-quote/:quote_id/remove-quote',
  authorizeUser,
  validate(deleteQuoteSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id, book_id, quote_id } = req.params;

    const quote = await prisma.memorable_quote.findUnique({
      where: {
        id: Number(quote_id),
        book_id: Number(book_id),
      },
      include: {
        book: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!quote || quote.book.user_id !== user_id) {
      res.status(404).json({
        error: "Not Found",
        message: "Quote not found",
      });
      return;
    }

    const deletedQuote = await prisma.memorable_quote.delete({
      where: {
        id: Number(quote_id),
      },
    });

    res.json({ quote: deletedQuote });
  })
);

export default router;
