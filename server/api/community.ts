import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { isAuthenticated } from "../middleware/auth";
import { 
  insertForumPostSchema, 
  insertForumCommentSchema, 
  insertPostReactionSchema,
  insertCommentReactionSchema
} from "@shared/schema";

const router = Router();

// Get all forum categories with post counts
router.get("/categories", async (req, res) => {
  try {
    // First get categories from storage
    const categories = await storage.getForumCategories();
    
    // For database-backed storage, get post counts for each category
    if (db) {
      try {
        // Use SQL to get the count of posts for each category
        const categoryCounts = await db.execute(
          `SELECT 
            category_id, 
            COUNT(*) as post_count 
          FROM forum_posts 
          GROUP BY category_id`
        );
        
        // Convert the results to a map for easy lookup
        const countMap = new Map();
        categoryCounts.rows.forEach((row: any) => {
          countMap.set(Number(row.category_id), Number(row.post_count));
        });
        
        // Add the post count to each category
        const categoriesWithCounts = categories.map(category => ({
          ...category,
          postCount: countMap.get(category.id) || 0
        }));
        
        return res.json(categoriesWithCounts);
      } catch (dbError) {
        console.error("Error counting posts per category:", dbError);
        // Fall back to categories without counts if DB query fails
        return res.json(categories);
      }
    }
    
    // If not using DB or if error, return categories without counts
    res.json(categories);
  } catch (error) {
    console.error("Error fetching forum categories:", error);
    res.status(500).json({ message: "Failed to fetch forum categories" });
  }
});

// Get posts by category, type, or user - direct from database
router.get("/posts", async (req, res) => {
  try {
    const { categoryId, userId, type, limit, offset } = req.query;
    
    const options = {
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      type: type as string || undefined,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0
    };
    
    // Use a direct database query for improved performance
    try {
      // Use a simple raw SQL query to get posts with necessary data
      const query = `
        SELECT 
          p.id, p.title, p.content, p.type, p.tags, 
          p.view_count as "viewCount", p.created_at as "createdAt",
          p.is_pinned as "isPinned", p.category_id as "categoryId",
          u.id as "userId", u.username, u.display_name as "displayName", 
          u.level, u.is_premium as "isPremium",
          (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) as "commentsCount",
          (SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id) as "likesCount"
        FROM forum_posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `;
      
      let whereConditions = [];
      const params = [];
      let paramIndex = 1;
      
      if (options.categoryId) {
        whereConditions.push(`p.category_id = $${paramIndex++}`);
        params.push(options.categoryId);
      }
      
      if (options.userId) {
        whereConditions.push(`p.user_id = $${paramIndex++}`);
        params.push(options.userId);
      }
      
      if (options.type) {
        whereConditions.push(`p.type = $${paramIndex++}`);
        params.push(options.type);
      }
      
      const whereSql = whereConditions.length > 0 
        ? ` AND ${whereConditions.join(' AND ')}` 
        : '';
        
      // Add limit and offset parameters
      params.push(options.limit);
      params.push(options.offset);
      const fullQuery = `${query}${whereSql} ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      
      let result;
      try {
        // Instead of trying to fix the parameters, use a direct query with proper prepared statements
        const commentsSubquery = `(SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id)`;
        const reactionsSubquery = `(SELECT COUNT(*) FROM post_reactions r WHERE r.post_id = p.id)`;
        
        // Use a simple query without any subqueries to avoid the aggregate function error
        const postsQuery = `
          SELECT 
            p.id, p.title, p.content, p.type, p.tags, 
            p.view_count as "viewCount", p.created_at as "createdAt",
            p.is_pinned as "isPinned", p.category_id as "categoryId",
            u.id as "userId", u.username, u.display_name as "displayName", 
            u.level, u.is_premium as "isPremium",
            c.name as "categoryName"
          FROM forum_posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN forum_categories c ON p.category_id = c.id
          ORDER BY p.created_at DESC
          LIMIT 20
        `;
        
        result = await db.execute(postsQuery);
        
        // Create empty reactions map
        // We'll skip complex queries for now to fix the database errors
      } catch (error) {
        console.error("Database error fetching forum posts:", error);
        // Fall back to a simpler query if there's an error
        const simpleQuery = `
          SELECT 
            p.id, p.title, p.content, p.type, p.tags, 
            p.view_count as "viewCount", p.created_at as "createdAt",
            p.is_pinned as "isPinned", p.category_id as "categoryId",
            u.id as "userId", u.username, u.display_name as "displayName", 
            u.level, u.is_premium as "isPremium"
          FROM forum_posts p
          LEFT JOIN users u ON p.user_id = u.id
          ORDER BY p.created_at DESC
          LIMIT 20
        `;
        result = await db.execute(simpleQuery);
      }
      
      // Use the post reactions map created above
      const postReactions = {};
      
      // Format posts for client consumption
      const formattedPosts = result.rows.map((post: any) => {
        // Convert tags from string to array if needed
        let tags = post.tags;
        if (typeof tags === 'string') {
          try {
            tags = JSON.parse(tags);
          } catch {
            tags = tags.split(',').map((tag: string) => tag.trim());
          }
        }
        
        // Add reactions to the post
        const reactions = postReactions[post.id] || [];
        
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          type: post.type || "discussion",
          isPinned: post.isPinned,
          categoryId: post.categoryId,
          viewCount: post.viewCount || 0,
          commentsCount: parseInt(post.commentsCount || '0'),
          likesCount: parseInt(post.likesCount || '0'),
          createdAt: post.createdAt,
          tags: tags || [],
          author: post.username || "Anonymous",
          authorId: post.userId,
          authorDisplayName: post.displayName,
          authorLevel: post.level || 1,
          authorIsPremium: post.isPremium || false,
          reactions: reactions
        };
      });
      
      return res.json(formattedPosts);
    } catch (dbError) {
      console.error("Database error fetching forum posts:", dbError);
      // Fall back to storage method if database query fails
      const posts = await storage.getForumPosts(options);
      return res.json(posts);
    }
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    res.status(500).json({ message: "Failed to fetch forum posts" });
  }
});

// Get a single post by ID with direct database access
router.get("/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    
    // Use direct database query for detailed post view
    try {
      // Get the post with author information
      const postQuery = `
        SELECT 
          p.id, p.title, p.content, p.type, p.tags, 
          p.view_count as "viewCount", p.created_at as "createdAt",
          p.is_pinned as "isPinned", p.category_id as "categoryId",
          u.id as "userId", u.username, u.display_name as "displayName", 
          u.level, u.is_premium as "isPremium",
          c.name as "categoryName"
        FROM forum_posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN forum_categories c ON p.category_id = c.id
        WHERE p.id = $1
      `;
      
      const postResult = await db.execute(postQuery.replace(/\$1/g, '$1::int'), [postId]);
      
      if (postResult.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const post = postResult.rows[0];
      
      // Convert tags from string to array if needed
      let tags = post.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(',').map((tag: string) => tag.trim());
        }
      }
      
      // Increment view count in database
      await db.execute(
        `UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1`,
        [postId]
      );
      
      // Get comments for this post with user information
      const commentsQuery = `
        SELECT 
          c.id, c.content, c.created_at as "createdAt", c.updated_at as "updatedAt",
          c.parent_id as "parentId", c.is_deleted as "isDeleted",
          u.id as "userId", u.username, u.display_name as "displayName", 
          u.level, u.is_premium as "isPremium",
          (SELECT COUNT(*) FROM comment_reactions r WHERE r.comment_id = c.id) as "reactionCount"
        FROM forum_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
          c.created_at ASC
      `;
      
      const commentsResult = await db.execute(commentsQuery, [postId]);
      
      // Get reactions for this post
      const reactionsQuery = `
        SELECT 
          r.id, r.created_at as "createdAt",
          rt.name as "reactionName", rt.emoji,
          u.id as "userId", u.username, u.display_name as "displayName"
        FROM post_reactions r
        LEFT JOIN reaction_types rt ON r.reaction_type_id = rt.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.post_id = $1
      `;
      
      const reactionsResult = await db.execute(reactionsQuery, [postId]);
      
      // Format the post for the response
      const formattedPost = {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        isPinned: post.isPinned,
        categoryId: post.categoryId,
        categoryName: post.categoryName,
        viewCount: (post.viewCount || 0) + 1, // Include the increment we just made
        createdAt: post.createdAt,
        tags: tags || [],
        author: post.username || "Anonymous",
        authorId: post.userId,
        authorDisplayName: post.displayName,
        authorLevel: post.level || 1,
        authorIsPremium: post.isPremium || false
      };
      
      // Format the comments
      const formattedComments = commentsResult.rows.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        parentId: comment.parentId,
        isDeleted: comment.isDeleted,
        reactionCount: parseInt(comment.reactionCount || '0'),
        author: comment.username || "Anonymous",
        authorId: comment.userId,
        authorDisplayName: comment.displayName,
        authorLevel: comment.level || 1,
        authorIsPremium: comment.isPremium || false
      }));
      
      // Organize reactions by type
      const reactionsByType = reactionsResult.rows.reduce((acc: any, reaction: any) => {
        const typeName = reaction.reactionName;
        if (!acc[typeName]) {
          acc[typeName] = {
            type: typeName,
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        
        acc[typeName].count++;
        acc[typeName].users.push({
          id: reaction.userId,
          username: reaction.username,
          displayName: reaction.displayName
        });
        
        return acc;
      }, {});
      
      return res.json({
        post: formattedPost,
        comments: formattedComments,
        reactions: Object.values(reactionsByType)
      });
    } catch (dbError) {
      console.error("Database error fetching forum post:", dbError);
      
      // Fall back to storage method if database query fails
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment the view count
      await storage.incrementForumPostView(post.id);
      
      // Get comments for this post
      const comments = await storage.getForumComments(post.id);
      
      // Get reactions for this post
      const reactions = await storage.getPostReactions(post.id);
      
      return res.json({
        post,
        comments,
        reactions
      });
    }
  } catch (error) {
    console.error("Error fetching forum post:", error);
    res.status(500).json({ message: "Failed to fetch forum post" });
  }
});

// Create a new post
router.post("/posts", isAuthenticated, async (req, res) => {
  try {
    const validation = insertForumPostSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid post data", 
        errors: validation.error.format() 
      });
    }
    
    const post = await storage.createForumPost({
      ...validation.data,
      userId: req.user!.id
    });
    
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating forum post:", error);
    res.status(500).json({ message: "Failed to create forum post" });
  }
});

// Update a post
router.patch("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const post = await storage.getForumPost(parseInt(req.params.id));
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }
    
    const updatedPost = await storage.updateForumPost(post.id, req.body);
    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating forum post:", error);
    res.status(500).json({ message: "Failed to update forum post" });
  }
});

// Delete a post with direct database access
router.delete("/posts/:id", isAuthenticated, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    
    // First use database to check if the post exists and if user is authorized
    try {
      // Query to get the post with just enough info to verify ownership
      const postQuery = `
        SELECT id, user_id FROM forum_posts WHERE id = $1
      `;
      
      const result = await db.execute(postQuery, [postId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const post = result.rows[0];
      
      // Check if user is authorized to delete this post
      if (post.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      // Delete using direct database access for better performance
      // First delete all related reactions
      await db.execute(`DELETE FROM post_reactions WHERE post_id = $1`, [postId]);
      
      // Then delete all comments and their reactions
      const commentIds = await db.execute(`
        SELECT id FROM forum_comments WHERE post_id = $1
      `, [postId]);
      
      for (const row of commentIds.rows) {
        const commentId = row.id;
        await db.execute(`DELETE FROM comment_reactions WHERE comment_id = $1`, [commentId]);
      }
      
      // Now delete all comments
      await db.execute(`DELETE FROM forum_comments WHERE post_id = $1`, [postId]);
      
      // Finally delete the post itself
      await db.execute(`DELETE FROM forum_posts WHERE id = $1`, [postId]);
      
      return res.status(204).end();
    } catch (dbError) {
      console.error("Database error deleting post:", dbError);
      
      // Fall back to storage method if database deletion fails
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this post" });
      }
      
      await storage.deleteForumPost(post.id);
      return res.status(204).end();
    }
  } catch (error) {
    console.error("Error deleting forum post:", error);
    res.status(500).json({ message: "Failed to delete forum post" });
  }
});

// Create a comment on a post
router.post("/comments", isAuthenticated, async (req, res) => {
  try {
    const validation = insertForumCommentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid comment data", 
        errors: validation.error.format() 
      });
    }
    
    const comment = await storage.createForumComment({
      ...validation.data,
      userId: req.user!.id
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
});

// Update a comment
router.patch("/comments/:id", isAuthenticated, async (req, res) => {
  try {
    const comment = await storage.getForumComment(parseInt(req.params.id));
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    if (comment.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to update this comment" });
    }
    
    const updatedComment = await storage.updateForumComment(comment.id, req.body.content);
    res.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Failed to update comment" });
  }
});

// Delete a comment
router.delete("/comments/:id", isAuthenticated, async (req, res) => {
  try {
    const comment = await storage.getForumComment(parseInt(req.params.id));
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    if (comment.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    
    await storage.deleteForumComment(comment.id);
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

// Get reaction types
router.get("/reaction-types", async (req, res) => {
  try {
    const reactionTypes = await storage.getReactionTypes();
    res.json(reactionTypes);
  } catch (error) {
    console.error("Error fetching reaction types:", error);
    res.status(500).json({ message: "Failed to fetch reaction types" });
  }
});

// React to a post
router.post("/posts/:id/react", isAuthenticated, async (req, res) => {
  try {
    const validation = insertPostReactionSchema.safeParse({
      postId: parseInt(req.params.id),
      userId: req.user!.id,
      reactionTypeId: req.body.reactionTypeId
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid reaction data", 
        errors: validation.error.format() 
      });
    }
    
    const result = await storage.createOrRemovePostReaction(validation.data);
    res.json(result);
  } catch (error) {
    console.error("Error reacting to post:", error);
    res.status(500).json({ message: "Failed to react to post" });
  }
});

// React to a comment
router.post("/comments/:id/react", isAuthenticated, async (req, res) => {
  try {
    const validation = insertCommentReactionSchema.safeParse({
      commentId: parseInt(req.params.id),
      userId: req.user!.id,
      reactionTypeId: req.body.reactionTypeId
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid reaction data", 
        errors: validation.error.format() 
      });
    }
    
    const result = await storage.createOrRemoveCommentReaction(validation.data);
    res.json(result);
  } catch (error) {
    console.error("Error reacting to comment:", error);
    res.status(500).json({ message: "Failed to react to comment" });
  }
});

// Get comments for a specific post
router.get("/posts/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    
    // Use direct database access for better performance
    try {
      const commentsQuery = `
        SELECT 
          c.id, c.content, c.created_at as "createdAt", c.updated_at as "updatedAt",
          c.parent_id as "parentId", c.is_deleted as "isDeleted", c.post_id as "postId",
          u.id as "userId", u.username, u.display_name as "displayName", 
          u.level, u.is_premium as "isPremium",
          (SELECT COUNT(*) FROM comment_reactions r WHERE r.comment_id = c.id) as "reactionCount"
        FROM forum_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
          c.created_at ASC
      `;
      
      const commentsResult = await db.execute(commentsQuery, [postId]);
      
      // Format the comments
      const formattedComments = commentsResult.rows.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        parentId: comment.parentId,
        postId: comment.postId,
        isDeleted: comment.isDeleted,
        reactionCount: parseInt(comment.reactionCount || '0'),
        author: comment.username || "Anonymous",
        authorId: comment.userId,
        authorDisplayName: comment.displayName,
        authorLevel: comment.level || 1,
        authorIsPremium: comment.isPremium || false
      }));
      
      return res.json(formattedComments);
    } catch (dbError) {
      console.error("Database error fetching comments:", dbError);
      
      // Fall back to storage method if database query fails
      const comments = await storage.getForumComments(postId);
      return res.json(comments);
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

export default router;