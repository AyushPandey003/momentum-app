'use server';

import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Checks if a LeetCode user has an "Accepted" submission for a specific question.
 * Uses the recentAcSubmissionList query to check the last 15 accepted submissions.
 * @param username The LeetCode username (their profile URL slug)
 * @param questionSlug The question slug (e.g., "two-sum", "median-of-two-sorted-arrays")
 * @returns boolean - true if an accepted submission is found, false otherwise.
 */
export async function checkLeetCodeSubmission(
  username: string,
  questionSlug: string,
): Promise<{ success: boolean; hasAccepted: boolean; error?: string }> {
  
  const LEETCODE_API_URL = 'https://leetcode.com/graphql';

  // This query fetches the most recent accepted submissions (limit 15)
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const variables = {
    username,
    limit: 15, // Check last 15 accepted submissions
  };

  try {
    const response = await fetch(LEETCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': `https://leetcode.com/${username}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store', // Don't cache for fresh results
    });

    if (!response.ok) {
      console.error(`LeetCode API request failed with status ${response.status}`);
      return {
        success: false,
        hasAccepted: false,
        error: `API request failed with status ${response.status}`
      };
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors) {
      console.error('GraphQL Error:', result.errors);
      return {
        success: false,
        hasAccepted: false,
        error: 'GraphQL error occurred'
      };
    }

    const data = result.data;
    if (!data || data.recentAcSubmissionList === null) {
      console.warn('User not found or no recent submissions');
      return {
        success: true,
        hasAccepted: false,
        error: 'User not found or no recent submissions'
      };
    }
    
    const submissions = data.recentAcSubmissionList || [];

    // Loop through the list of accepted submissions
    // If the titleSlug matches, they solved it recently
    const hasAcceptedSubmission = submissions.some(
      (sub: any) => sub.titleSlug === questionSlug
    );

    return {
      success: true,
      hasAccepted: hasAcceptedSubmission
    };

  } catch (error) {
    console.error('Error fetching LeetCode data:', error);
    return {
      success: false,
      hasAccepted: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Connect a LeetCode username to the user's account
 */
export async function connectLeetCodeUsername(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the username exists by trying to fetch their profile
    const verifyQuery = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
          }
        }
      }
    `;

    const verifyResponse = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: verifyQuery, 
        variables: { username } 
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.data?.matchedUser) {
      return { success: false, error: "LeetCode username not found" };
    }

    // Update user with LeetCode username
    await db.update(schema.user)
      .set({ 
        leetcodeUsername: username,
        updatedAt: new Date()
      })
      .where(eq(schema.user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Error connecting LeetCode username:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect LeetCode account'
    };
  }
}

/**
 * Get the connected LeetCode username for the current user
 */
export async function getLeetCodeUsername(): Promise<{ username: string | null }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { username: null };
    }

    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
      columns: {
        leetcodeUsername: true
      }
    });

    return { username: user?.leetcodeUsername || null };
  } catch (error) {
    console.error('Error getting LeetCode username:', error);
    return { username: null };
  }
}

/**
 * Disconnect LeetCode account
 */
export async function disconnectLeetCode(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.update(schema.user)
      .set({ 
        leetcodeUsername: null,
        updatedAt: new Date()
      })
      .where(eq(schema.user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting LeetCode:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to disconnect LeetCode account'
    };
  }
}
