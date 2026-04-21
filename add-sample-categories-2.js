const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets, smartphones, laptops, and more',
    icon_name: 'Laptop'
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, shoes, and accessories',
    icon_name: 'Shirt'
  },
  {
    name: 'Home & Garden',
    slug: 'home',
    description: 'Furniture, decor, and home essentials',
    icon_name: 'Home'
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Cosmetics, skincare, and personal care',
    icon_name: 'Sparkles'
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Athletic gear and fitness equipment',
    icon_name: 'Dumbbell'
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Video games, consoles, and accessories',
    icon_name: 'Gamepad2'
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Fiction, non-fiction, and educational books',
    icon_name: 'Book'
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car parts, accessories, and tools',
    icon_name: 'Car'
  },
  {
    name: 'Baby & Kids',
    slug: 'baby',
    description: 'Baby products and kids items',
    icon_name: 'Baby'
  },
  {
    name: 'Food & Beverages',
    slug: 'food',
    description: 'Groceries, snacks, and drinks',
    icon_name: 'Utensils'
  },
  {
    name: 'Music',
    slug: 'music',
    description: 'Instruments, audio equipment, and more',
    icon_name: 'Music'
  },
  {
    name: 'Photography',
    slug: 'photography',
    description: 'Cameras, lenses, and photography gear',
    icon_name: 'Camera'
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Watches, jewelry, and fashion accessories',
    icon_name: 'Watch'
  },
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Mobile phones and accessories',
    icon_name: 'Smartphone'
  },
  {
    name: 'Audio',
    slug: 'audio',
    description: 'Headphones, speakers, and audio equipment',
    icon_name: 'Headphones'
  },
  {
    name: 'Coffee & Tea',
    slug: 'coffee',
    description: 'Coffee beans, tea, and brewing equipment',
    icon_name: 'Coffee'
  },
  {
    name: 'Art & Craft',
    slug: 'art',
    description: 'Art supplies, craft materials, and DIY kits',
    icon_name: 'Palette'
  },
  {
    name: 'Travel',
    slug: 'travel',
    description: 'Luggage, travel accessories, and gear',
    icon_name: 'Plane'
  }
];

async function addSampleCategories() {
  try {
    console.log('Adding sample categories...');
    
    for (const category of sampleCategories) {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select();

      if (error) {
        console.error(`Error adding category ${category.name}:`, error);
      } else {
        console.log(`Successfully added category: ${category.name}`);
      }
    }
    
    console.log('Sample categories addition completed!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addSampleCategories();
