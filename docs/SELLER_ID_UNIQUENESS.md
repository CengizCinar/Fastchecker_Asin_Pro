# Seller ID Uniqueness Implementation

## 🎯 **Problem Statement**
Prevent users from creating multiple accounts with different emails to abuse free plan limits using the same Seller ID. Each Seller ID should be tied to only one account, but users should be able to change their email address.

## 🏗️ **Solution Architecture**

### Database Schema Changes
1. **New `seller_ownership` table** - Tracks which user owns each Seller ID
2. **Unique constraint** on `user_api_settings.seller_id` 
3. **Email change functionality** - Maintains Seller ID ownership across email changes

### Key Features
- ✅ **One Seller ID = One Account**: Each Seller ID can only be registered once
- ✅ **Email Change Support**: Users can update their email while keeping their Seller ID
- ✅ **First-Come-First-Served**: During migration, existing users keep their Seller IDs
- ✅ **Clear Error Messages**: Informative feedback when conflicts occur

## 📊 **Database Schema**

### New Table: `seller_ownership`
```sql
CREATE TABLE seller_ownership (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(255) UNIQUE NOT NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: `user_api_settings`
```sql
-- Added unique constraint
ALTER TABLE user_api_settings 
ADD CONSTRAINT unique_seller_id UNIQUE (seller_id);
```

## 🔧 **Implementation Files**

### Backend Changes
1. **Migration Script**: `/scripts/migrate-seller-uniqueness.js`
   - Creates `seller_ownership` table
   - Migrates existing data (first-come-first-served)
   - Adds unique constraint
   - Includes rollback functionality

2. **Controller Updates**: `/controllers/userController.js`
   - Enhanced `updateSettings()` with Seller ID validation
   - New `changeEmail()` endpoint
   - New `getSellerOwnership()` endpoint

3. **Route Updates**: `/routes/user.js`
   - Added `POST /api/user/change-email`
   - Added `GET /api/user/seller-ownership`

### Frontend Changes
1. **Error Handling**: Enhanced user feedback for Seller ID conflicts
2. **API Client**: Added email change and seller ownership methods
3. **Toast Messages**: Better error messages for conflicts

## 🚀 **Deployment Instructions**

### 1. Run Migration
```bash
# In fastchecker-backend directory
npm run migrate-seller-uniqueness
```

### 2. Verify Migration
- Check `seller_ownership` table was created
- Verify existing Seller IDs were migrated
- Confirm unique constraint is active

### 3. Deploy Backend
- Push changes to `backend` branch
- Railway will auto-deploy

### 4. Rollback (if needed)
```bash
npm run rollback-seller-uniqueness
```

## 🔒 **Validation Logic**

### Seller ID Registration
```javascript
// Check if Seller ID is already owned by another user
const existingOwner = await pool.query(`
  SELECT so.owner_user_id, u.email 
  FROM seller_ownership so
  JOIN users u ON so.owner_user_id = u.id
  WHERE so.seller_id = $1 AND so.owner_user_id != $2
`, [sellerId, userId]);

if (existingOwner.rows.length > 0) {
  return res.status(409).json({ 
    error: 'Seller ID already in use',
    message: 'This Seller ID is already registered to another account.'
  });
}
```

### Email Change Process
1. **Verify current password**
2. **Check new email availability**
3. **Update user email** (maintains Seller ID ownership)
4. **Update ownership record timestamp**

## 📱 **User Experience**

### Seller ID Conflict
When a user tries to register an already-used Seller ID:
```
❌ Seller ID already in use by another account. 
Each Seller ID can only be used once.
```

### Email Change Success
```
✅ Email updated successfully from old@email.com to new@email.com
```

### API Endpoints

#### Save Settings with Validation
- **Endpoint**: `POST /api/user/settings`
- **New Behavior**: Validates Seller ID uniqueness
- **Error Response**: `409 Conflict` if Seller ID exists

#### Change Email
- **Endpoint**: `POST /api/user/change-email`
- **Body**: `{ "newEmail": "new@email.com", "password": "currentPassword" }`
- **Response**: `{ "message": "Email updated successfully", "newEmail": "new@email.com" }`

#### Get Seller Ownership
- **Endpoint**: `GET /api/user/seller-ownership`
- **Response**: 
```json
{
  "sellerOwnership": {
    "seller_id": "A1B2C3D4E5F6G7",
    "original_email": "original@email.com",
    "current_email": "current@email.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

## 🧪 **Testing Scenarios**

### 1. New User Registration
- User registers with unused Seller ID ✅
- User tries to register with existing Seller ID ❌

### 2. Existing User Migration
- First user keeps their Seller ID ✅
- Duplicate users lose access to conflicting Seller ID ❌

### 3. Email Change
- User changes email, keeps Seller ID ✅
- New email already in use ❌
- Wrong password ❌

### 4. Edge Cases
- Multiple users with same Seller ID (migration handles)
- User deletes account (Seller ID becomes available)
- Database transaction failures (rollback protection)

## 🔄 **Migration Details**

The migration script handles existing data carefully:
1. **Creates tables** without affecting existing data
2. **Migrates existing Seller IDs** on first-come-first-served basis
3. **Removes duplicates** (keeps earliest registration)
4. **Adds constraints** after cleanup
5. **Provides rollback** for safety

### Migration Output Example
```
🚀 Starting seller uniqueness migration...
✅ Created seller_ownership table
📦 Found 15 existing seller IDs to migrate
✅ Migrated seller_id: A1B2C3 → user@example.com
⚠️  Skipping duplicate seller_id: A1B2C3 for user: duplicate@example.com
🧹 Cleaning up 3 duplicate seller_id entries...
✅ Added unique constraint to user_api_settings.seller_id

✅ Migration completed successfully!
📊 Summary:
   - Migrated: 12 unique seller IDs
   - Skipped duplicates: 3 entries
   - Total processed: 15 entries
```

## 🛡️ **Security Features**

### Database Level
- **Unique constraints** prevent duplicates
- **Foreign key constraints** maintain referential integrity
- **Transaction safety** ensures atomic operations

### Application Level
- **Pre-check validation** before database operations
- **Password verification** for email changes
- **Detailed error messages** without exposing sensitive data

### Privacy Protection
- Conflicting email addresses are masked: `use***@example.com`
- Original email stored for audit purposes only
- No sensitive data in error messages

## 📈 **Performance Impact**

### Database
- **New indexes** on `seller_ownership` table
- **Additional query** for Seller ID validation (cached)
- **Minimal overhead** - single lookup per settings save

### User Experience
- **Immediate feedback** on Seller ID conflicts
- **No impact** on existing functionality
- **Enhanced security** without complexity

This implementation effectively prevents free plan abuse while maintaining a smooth user experience and providing the flexibility users need to manage their accounts.