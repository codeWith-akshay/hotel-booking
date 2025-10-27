#!/bin/bash

###############################################################################
# PostgreSQL Database Backup Script
# 
# Usage: ./scripts/pg-backup.sh
# 
# This script creates a compressed PostgreSQL backup using pg_dump
# and names it with a timestamp for easy organization.
###############################################################################

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%F)
BACKUP_FILE="${BACKUP_DIR}/hotel_db_${DATE_ONLY}.dump"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}📦 Starting PostgreSQL backup...${NC}"

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
  exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:/?]*\).*/\1/p')
DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Default port if not specified
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Host: ${DB_HOST}:${DB_PORT}${NC}"

# Set password for pg_dump
export PGPASSWORD="${DB_PASS}"

# Create backup with compression (-Fc), no ACL, no owner
pg_dump -Fc --no-acl --no-owner \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -f "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo -e "${GREEN}✅ Backup created successfully!${NC}"
  echo -e "${GREEN}   File: ${BACKUP_FILE}${NC}"
  echo -e "${GREEN}   Size: ${BACKUP_SIZE}${NC}"
  
  # Create a metadata file
  cat > "${BACKUP_FILE}.meta.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "port": "${DB_PORT}",
  "size": "$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}")",
  "sizeHuman": "${BACKUP_SIZE}"
}
EOF
  
  echo -e "${GREEN}   Metadata: ${BACKUP_FILE}.meta.json${NC}"
else
  echo -e "${RED}❌ Backup failed!${NC}"
  exit 1
fi

# Unset password
unset PGPASSWORD

echo -e "${GREEN}🎉 Backup process completed!${NC}"
