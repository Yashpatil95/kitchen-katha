CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`meal_types` text DEFAULT '[]' NOT NULL,
	`cuisine` text DEFAULT 'Indian' NOT NULL,
	`diet` text DEFAULT 'Vegetarian' NOT NULL,
	`status` text DEFAULT 'want-to-try' NOT NULL,
	`spice_level` integer DEFAULT 2 NOT NULL,
	`prep_minutes` integer DEFAULT 0 NOT NULL,
	`cook_minutes` integer DEFAULT 0 NOT NULL,
	`servings` integer DEFAULT 2 NOT NULL,
	`ingredients` text DEFAULT '[]' NOT NULL,
	`steps` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`last_cooked_at` text,
	`rating` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `recipes` (`title`, `description`, `meal_types`, `cuisine`, `diet`, `status`, `spice_level`, `prep_minutes`, `cook_minutes`, `servings`, `ingredients`, `steps`, `notes`, `last_cooked_at`, `rating`)
VALUES ('Sunday Kanda Poha', 'Soft, lemony poha with plenty of onion, peanuts and a crisp curry-leaf tadka.', '["Breakfast","Snacks"]', 'Maharashtrian', 'Vegetarian', 'keep', 1, 10, 18, 3, '["2 cups thick poha","1 large onion, finely chopped","3 tbsp roasted peanuts","1 green chilli, sliced","8 curry leaves","1/2 tsp mustard seeds","1/2 tsp turmeric","1 lemon","Coriander and salt"]', '["Rinse the poha briefly, drain well and rest for 8 minutes.","Heat oil and crackle the mustard seeds, then add peanuts, chilli and curry leaves.","Cook the onion until translucent, then add turmeric.","Fold in poha and salt. Cover on low heat for 4 minutes.","Finish with lemon and coriander just before serving."]', 'Rinsing once is enough for the thick poha. Add lemon only after turning off the heat.', '2026-08-23', 5);
--> statement-breakpoint
INSERT INTO `recipes` (`title`, `description`, `meal_types`, `cuisine`, `diet`, `status`, `spice_level`, `prep_minutes`, `cook_minutes`, `servings`, `ingredients`, `steps`, `notes`, `last_cooked_at`, `rating`)
VALUES ('Smoky Dal Tadka', 'Comforting yellow dal finished with a garlicky chilli tadka.', '["Lunch","Dinner"]', 'North Indian', 'Vegetarian', 'tried', 2, 10, 35, 4, '["1 cup toor dal","2 tomatoes, chopped","1/2 tsp turmeric","1 tsp cumin seeds","4 garlic cloves, sliced","2 dried red chillies","1 tbsp ghee","Salt to taste"]', '["Rinse the dal and pressure cook with tomatoes, turmeric and 3 cups water for 3 whistles.","Whisk the cooked dal and simmer with salt until creamy.","Heat ghee, crackle cumin, then fry garlic and dried chillies until golden.","Pour the hot tadka over the dal and cover for 2 minutes before serving."]', 'Two whistles may be enough next time. Keep the dal slightly loose because it thickens as it rests.', '2026-08-20', 4);
--> statement-breakpoint
INSERT INTO `recipes` (`title`, `description`, `meal_types`, `cuisine`, `diet`, `status`, `spice_level`, `prep_minutes`, `cook_minutes`, `servings`, `ingredients`, `steps`, `notes`)
VALUES ('Monsoon Masala Chai', 'A warming ginger-cardamom chai to test on the next rainy afternoon.', '["Drinks"]', 'Indian', 'Vegetarian', 'want-to-try', 1, 4, 8, 2, '["1 cup water","1 cup whole milk","2 tsp Assam tea","1 inch ginger, crushed","3 green cardamom pods","2 tsp jaggery or sugar"]', '["Bring the water, ginger and cardamom to a lively boil for 3 minutes.","Add tea and simmer for 1 minute.","Pour in milk and sweetener, then bring the chai up twice without boiling over.","Strain into warm cups and serve immediately."]', 'Try jaggery after taking the pan off the heat so the milk does not split.');
