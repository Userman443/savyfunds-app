import { Router } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

const router = Router();

/**
 * Get users ranked by points for the leaderboard
 * This is a real leaderboard based on user activity in the system
 */
router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get top users by points (exclude sensitive data like passwords and exclude specific users)
    const leaderboard = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        level: users.level,
        points: users.points,
        streak: users.streak
      })
      .from(users)
      .where(sql`LOWER(${users.username}) != 'osagie56'`) // Remove osagie56 from leaderboard (case insensitive)
      .orderBy(desc(users.points))
      .limit(limit);
      
    // Extra filter to ensure osagie56 is definitely removed (belt and suspenders approach)
    const filteredLeaderboard = leaderboard.filter(user => 
      user.username.toLowerCase() !== 'osagie56'
    );
    
    // For each user, calculate their rank
    const rankedLeaderboard = filteredLeaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
    
    res.json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

/**
 * Get a specific user's rank and stats
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // First, get the user's points
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        level: users.level,
        points: users.points,
        streak: users.streak
      })
      .from(users)
      .where(sql`${users.id} = ${userId}`)
      .limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Then, count how many users have more points
    const userRank = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.points} > ${user[0].points}`);
    
    // Rank is the number of users with more points + 1
    const rank = userRank[0].count + 1;
    
    res.json({
      ...user[0],
      rank
    });
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ message: "Failed to fetch user rank" });
  }
});

export default router;