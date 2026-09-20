import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Script to add email verification columns to users table
 */
async function migrateEmailVerification() {
  console.log('Running migration: Adding email verification columns to users table');
  
  try {
    // Check if the columns already exist
    const checkColumnsQuery = sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('is_email_verified', 'verification_token', 'verification_token_expiry')
    `;
    
    const existingColumns = await db.execute(checkColumnsQuery);
    const columnNames = existingColumns.rows.map((row: any) => row.column_name);
    
    // Add is_email_verified column if it doesn't exist
    if (!columnNames.includes('is_email_verified')) {
      console.log('Adding is_email_verified column');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE
      `);
    }
    
    // Add verification_token column if it doesn't exist
    if (!columnNames.includes('verification_token')) {
      console.log('Adding verification_token column');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN verification_token TEXT
      `);
    }
    
    // Add verification_token_expiry column if it doesn't exist
    if (!columnNames.includes('verification_token_expiry')) {
      console.log('Adding verification_token_expiry column');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN verification_token_expiry TIMESTAMP
      `);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration directly
migrateEmailVerification()
  .catch((error) => {
    console.error('Migration script failed:', error);
  });

export { migrateEmailVerification };