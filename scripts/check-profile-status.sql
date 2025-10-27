-- SQL Script to Check and Fix Profile Completion Status
-- Run this in your database to diagnose and fix the issue

-- ==========================================
-- 1. CHECK CURRENT USER STATUS
-- ==========================================

-- See all users and their profile completion status
SELECT 
  id,
  phone,
  name,
  email,
  profileCompleted,
  createdAt
FROM users
ORDER BY createdAt DESC
LIMIT 20;

-- ==========================================
-- 2. FIND USERS WITH NULL OR FALSE PROFILE STATUS
-- ==========================================

-- These users should be redirected to profile setup
SELECT 
  id,
  phone,
  name,
  email,
  address,
  profileCompleted,
  CASE 
    WHEN profileCompleted IS NULL THEN 'NULL (needs fix)'
    WHEN profileCompleted = false THEN 'FALSE (correct)'
    ELSE 'TRUE (completed)'
  END as status
FROM users
WHERE profileCompleted IS NULL OR profileCompleted = false;

-- ==========================================
-- 3. FIX NULL VALUES (if any exist)
-- ==========================================

-- Convert NULL to FALSE for consistency
-- Uncomment to run:
-- UPDATE users 
-- SET profileCompleted = false 
-- WHERE profileCompleted IS NULL;

-- ==========================================
-- 4. CHECK SPECIFIC USER (for testing)
-- ==========================================

-- Replace with your test phone number
SELECT 
  id,
  phone,
  name,
  email,
  address,
  vipStatus,
  profileCompleted,
  roleId,
  createdAt
FROM users
WHERE phone = '+1234567890';  -- Change to your test phone

-- ==========================================
-- 5. MANUALLY RESET PROFILE FOR TESTING
-- ==========================================

-- Use this to test the profile flow again
-- Uncomment and change phone number to run:
-- UPDATE users 
-- SET 
--   profileCompleted = false,
--   email = NULL,
--   address = NULL
-- WHERE phone = '+1234567890';

-- ==========================================
-- 6. CHECK USERS WHO COMPLETED PROFILE
-- ==========================================

SELECT 
  id,
  phone,
  name,
  email,
  profileCompleted,
  updatedAt
FROM users
WHERE profileCompleted = true
ORDER BY updatedAt DESC
LIMIT 10;

-- ==========================================
-- 7. PROFILE COMPLETION STATISTICS
-- ==========================================

SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN profileCompleted = true THEN 1 ELSE 0 END) as completed_profiles,
  SUM(CASE WHEN profileCompleted = false OR profileCompleted IS NULL THEN 1 ELSE 0 END) as incomplete_profiles,
  ROUND(
    SUM(CASE WHEN profileCompleted = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
    2
  ) as completion_percentage
FROM users;
