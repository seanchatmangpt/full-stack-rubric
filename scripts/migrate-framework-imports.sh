#!/bin/bash

# @nuxt/bdd Migration Script
# Automatically updates import statements from local framework to library

set -e

echo "🚀 Starting @nuxt/bdd migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=".migration-backup-$(date +%Y%m%d-%H%M%S)"
TEST_DIR="tests"
DRY_RUN=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [--verbose] [--help]"
      echo "  --dry-run: Show changes without applying them"
      echo "  --verbose: Show detailed output"
      echo "  --help: Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Function to log messages
log() {
    local level=$1
    shift
    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} $*"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $*"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $*"
            ;;
        DEBUG)
            if [[ $VERBOSE == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} $*"
            fi
            ;;
    esac
}

# Function to create backup
create_backup() {
    log INFO "Creating backup in $BACKUP_DIR..."
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$TEST_DIR" "$BACKUP_DIR/"
        log INFO "Backup created successfully"
    fi
}

# Function to find files that need migration
find_migration_files() {
    log INFO "Scanning for files that need migration..."
    
    # Find JavaScript files with framework imports
    local files=($(grep -r -l "from ['\"]\.\.\/framework\/" "$TEST_DIR" 2>/dev/null | grep -E '\.(js|mjs)$' || true))
    
    if [[ ${#files[@]} -eq 0 ]]; then
        log WARN "No files found with framework imports"
        return 1
    fi
    
    log INFO "Found ${#files[@]} files that need migration:"
    for file in "${files[@]}"; do
        log INFO "  - $file"
    done
    
    echo "${files[@]}"
}

# Function to migrate a single file
migrate_file() {
    local file=$1
    log DEBUG "Migrating file: $file"
    
    # Create temporary file for modifications
    local temp_file="${file}.migration.tmp"
    
    # Apply migration rules
    sed -E \
        -e "s|from ['\"]\.\.\/framework\/core\/index\.js['\"]|from '@nuxt/bdd/core'|g" \
        -e "s|from ['\"]\.\.\/framework\/core-utils\.js['\"]|from '@nuxt/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/config\/zero-config\.js['\"]|from '@nuxt/bdd/config'|g" \
        -e "s|from ['\"]\.\.\/framework\/config\/smart-defaults\.js['\"]|from '@nuxt/bdd/config'|g" \
        -e "s|from ['\"]\.\.\/framework\/config\/plugin-system\.js['\"]|from '@nuxt/bdd/config'|g" \
        -e "s|from ['\"]\.\.\/framework\/bdd\/step-generators\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/bdd\/component-steps\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/bdd\/navigation-steps\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/bdd\/api-steps\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/bdd\/auth-steps\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/integration\/nuxt-bridge\.js['\"]|from '@nuxt/bdd/nuxt'|g" \
        -e "s|from ['\"]\.\.\/framework\/integration\/cucumber-bridge\.js['\"]|from '@nuxt/bdd/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/utils\/test-helpers\.js['\"]|from '@nuxt/bdd'|g" \
        -e "s|from ['\"]\.\.\/framework\/index\.js['\"]|from '@nuxt/bdd'|g" \
        "$file" > "$temp_file"
    
    if [[ $DRY_RUN == true ]]; then
        log INFO "DRY RUN - Would apply these changes to $file:"
        diff "$file" "$temp_file" || true
        rm "$temp_file"
    else
        mv "$temp_file" "$file"
        log INFO "✅ Migrated: $file"
    fi
}

# Function to validate migration
validate_migration() {
    log INFO "Validating migration..."
    
    # Check if @nuxt/bdd is installed
    if ! npm list @nuxt/bdd >/dev/null 2>&1; then
        log WARN "@nuxt/bdd not found in dependencies. Installing..."
        pnpm add @nuxt/bdd
    fi
    
    # Check for remaining framework imports
    local remaining_imports=$(grep -r "from ['\"]\.\.\/framework\/" "$TEST_DIR" 2>/dev/null | grep -E '\.(js|mjs)$' || true)
    
    if [[ -n "$remaining_imports" ]]; then
        log WARN "Some framework imports may still exist:"
        echo "$remaining_imports"
        return 1
    fi
    
    log INFO "✅ No remaining framework imports found"
    
    # Run syntax check
    log INFO "Running syntax validation..."
    local js_files=($(find "$TEST_DIR" -name "*.js" -type f))
    
    for file in "${js_files[@]}"; do
        if ! node -c "$file" 2>/dev/null; then
            log ERROR "Syntax error in $file"
            return 1
        fi
    done
    
    log INFO "✅ All files have valid syntax"
}

# Function to run tests
run_tests() {
    log INFO "Running tests to validate migration..."
    
    if command -v pnpm >/dev/null 2>&1; then
        pnpm test
    elif command -v npm >/dev/null 2>&1; then
        npm test
    else
        log ERROR "Neither pnpm nor npm found"
        return 1
    fi
}

# Function to rollback migration
rollback_migration() {
    log WARN "Rolling back migration..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        rm -rf "$TEST_DIR"
        mv "$BACKUP_DIR/$TEST_DIR" "$TEST_DIR"
        rm -rf "$BACKUP_DIR"
        log INFO "✅ Migration rolled back successfully"
    else
        log ERROR "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
}

# Main migration function
main() {
    log INFO "🚀 @nuxt/bdd Framework Migration Script"
    log INFO "========================================"
    
    # Validate prerequisites
    if [[ ! -d "$TEST_DIR" ]]; then
        log ERROR "Tests directory not found: $TEST_DIR"
        exit 1
    fi
    
    # Create backup before migration
    if [[ $DRY_RUN == false ]]; then
        create_backup
    fi
    
    # Find files to migrate
    local files_to_migrate
    if ! files_to_migrate=$(find_migration_files); then
        log INFO "No migration needed"
        exit 0
    fi
    
    # Convert string to array
    IFS=' ' read -ra files_array <<< "$files_to_migrate"
    
    # Migrate each file
    log INFO "Starting file migration..."
    for file in "${files_array[@]}"; do
        migrate_file "$file"
    done
    
    if [[ $DRY_RUN == true ]]; then
        log INFO "DRY RUN complete. Use without --dry-run to apply changes."
        exit 0
    fi
    
    # Validate migration
    if validate_migration; then
        log INFO "✅ Migration validation successful"
    else
        log ERROR "Migration validation failed"
        read -p "Would you like to rollback? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_migration
            exit 1
        fi
    fi
    
    # Optional: Run tests
    read -p "Would you like to run tests to verify the migration? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if run_tests; then
            log INFO "✅ Tests passed! Migration successful!"
        else
            log ERROR "Tests failed. Consider rolling back."
            read -p "Would you like to rollback? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback_migration
                exit 1
            fi
        fi
    fi
    
    log INFO "🎉 Migration completed successfully!"
    log INFO "Backup available at: $BACKUP_DIR"
    log INFO ""
    log INFO "Next steps:"
    log INFO "1. Review migrated files"
    log INFO "2. Run full test suite: pnpm test"
    log INFO "3. Update documentation"
    log INFO "4. Remove backup when satisfied: rm -rf $BACKUP_DIR"
}

# Trap to handle interruption
trap 'log ERROR "Migration interrupted!"; if [[ $DRY_RUN == false && -d "$BACKUP_DIR" ]]; then log INFO "Backup available at: $BACKUP_DIR"; fi; exit 1' INT TERM

# Run main function
main "$@"