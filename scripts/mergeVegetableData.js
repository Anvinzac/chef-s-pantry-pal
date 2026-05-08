import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read both files
const moreDataPath = path.join(__dirname, '..', 'moredata.json');
const ingredientsPath = path.join(__dirname, '..', 'src', 'data', 'ingredients.json');

const moreData = JSON.parse(fs.readFileSync(moreDataPath, 'utf8'));
const ingredients = JSON.parse(fs.readFileSync(ingredientsPath, 'utf8'));

// Find the highest existing v-number
const vNumbers = ingredients
  .filter((item) => item.id.startsWith('v'))
  .map((item) => parseInt(item.id.slice(1), 10));
const maxVNumber = Math.max(...vNumbers);

console.log(`Highest existing v-number: ${maxVNumber}`);

// Emoji mapping for categories
const emojiMap = {
  'leafy-greens': '\ud83e\udd6c',
  herbs: '\ud83c\udf3f',
  'root-vegetables': '\ud83e\udd55',
  'fruit-vegetables': '\ud83c\udf45',
  'beans-legumes': '\ud83e\uded8',
  'tofu-products': '\ud83e\uddc8',
  mushrooms: '\ud83c\udf44',
  'stems-shoots': '\ud83c\udf31',
  'sea-vegetables': '\ud83c\udf0a',
};

// Convert underscore key to hyphenated format
function toHyphenated(key) {
  return key.replace(/_/g, '-');
}

// Create new ingredients
const newIngredients = [];
let nextNumber = maxVNumber + 1;

for (const category of moreData.vegetable_categories) {
  const subcategory = toHyphenated(category.category_key);
  const emoji = emojiMap[subcategory] || '\ud83e\udd6c';

  for (const item of category.items) {
    // Check if an ingredient with this name already exists (case-insensitive)
    const existingIndex = ingredients.findIndex(
      (existing) =>
        existing.name.toLowerCase() === item.name_vi.toLowerCase() &&
        existing.category === 'vegetables'
    );

    if (existingIndex !== -1) {
      console.log(
        `Skipping duplicate: "${item.name_vi}" (already exists as ingredient ${ingredients[existingIndex].id})`
      );
      continue;
    }

    newIngredients.push({
      id: `v${nextNumber}`,
      name: item.name_vi,
      emoji: emoji,
      unit: 'kg',
      category: 'vegetables',
      subcategory: subcategory,
      quickQuantities: [1, 2],
    });
    nextNumber++;
  }
}

// Append new ingredients to the existing array
ingredients.push(...newIngredients);

// Write back to ingredients.json
fs.writeFileSync(
  ingredientsPath,
  JSON.stringify(ingredients, null, 2) + '\n',
  'utf8'
);

console.log(`\nAdded ${newIngredients.length} new ingredients`);
console.log(`New ID range: v${maxVNumber + 1} to v${nextNumber - 1}`);
console.log('\nSample entries by subcategory:');

// Show one sample from each new subcategory
const addedSubcategories = {};
for (const ingredient of newIngredients) {
  if (!addedSubcategories[ingredient.subcategory]) {
    addedSubcategories[ingredient.subcategory] = ingredient;
  }
}

for (const [subcategory, sample] of Object.entries(addedSubcategories)) {
  console.log(
    `\n  ${subcategory}: ${sample.emoji} ${sample.name} (ID: ${sample.id})`
  );
}
