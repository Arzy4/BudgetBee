
-- Create the CategoryName enum
CREATE TYPE "CategoryName" AS ENUM (
  'SALARY',
  'GIFTS',
  'INVESTMENT',
  'BONUS',
  'FOOD_AND_DRINKS',
  'HEALTH',
  'FASHION',
  'TRANSPORTATION'
);

-- Convert the existing category name to CategoryName
ALTER TABLE "categories"
  ALTER COLUMN "name"
  TYPE "CategoryName"
  USING "name"::"CategoryName";

-- Convert CategoryType to TransactionType
ALTER TABLE "categories"
  ALTER COLUMN "type"
  TYPE "TransactionType"
  USING "type"::text::"TransactionType";

-- Remove the unused CategoryType enum
DROP TYPE "CategoryType";
