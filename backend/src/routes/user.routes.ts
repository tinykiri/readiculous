import { Router, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../../utils/prisma";
import { authenticate, authorizeUser, AuthenticatedRequest } from "../middleware/auth.middleware";
import { z } from "zod";
import { validate } from "../middleware/validation.middleware";

const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required").max(50, "Username is too long").optional(),
    avatar_url: z.string().url("Invalid URL format").optional().nullable(),
  }),
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
  }),
});

const getUserSchema = z.object({
  params: z.object({
    user_id: z.string().uuid("Invalid user ID format"),
  }),
});

const router = Router();

router.use(authenticate);

// Get user profile
router.get(
  '/:user_id/profile',
  authorizeUser,
  validate(getUserSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
        total_books: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
      return;
    }

    res.json(user);
  })
);

router.put(
  '/:user_id/edit-profile',
  authorizeUser,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user_id } = req.params;
    const { username, avatar_url } = req.body;

    const updateData: Partial<{
      username: string;
      avatar_url: string | null;
    }> = {};
    if (username !== undefined) updateData.username = username;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await prisma.user.update({
      where: {
        id: user_id,
      },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
        total_books: true,
      },
    });

    res.json(user);
  })
);

export default router;
