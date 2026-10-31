-- Create the CategoryType enum
CREATE TYPE "CategoryType" AS ENUM (
  'INCOME',
  'EXPENSE'
);

-- Convert category names to TEXT
ALTER TABLE "categories"
  ALTER COLUMN "name"
  TYPE TEXT
  USING "name"::text;

-- Convert the category type to CategoryType
ALTER TABLE "categories"
  ALTER COLUMN "type"
  TYPE "CategoryType"
  USING "type"::text::"CategoryType";
