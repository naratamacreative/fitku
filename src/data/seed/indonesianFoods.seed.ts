import type { Food } from '../types/food.types'

/**
 * Seed reference data. Values are per stated local serving (not per 100g) —
 * FoodLog snapshots macros at log time, so updating this list never rewrites history.
 */
export const indonesianFoodsSeed: Food[] = [
  // --- Nasi & Karbo ---
  { id: 'food-001', name: 'Nasi Putih', category: 'nasi_karbo', servingLabel: '1 centong (100g)', servingGrams: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'food-002', name: 'Nasi Merah', category: 'nasi_karbo', servingLabel: '1 centong (100g)', servingGrams: 100, calories: 110, protein: 2.6, carbs: 23, fat: 0.9 },
  { id: 'food-003', name: 'Nasi Uduk', category: 'nasi_karbo', servingLabel: '1 centong (100g)', servingGrams: 100, calories: 180, protein: 3, carbs: 25, fat: 7 },
  { id: 'food-004', name: 'Lontong', category: 'nasi_karbo', servingLabel: '1 potong (100g)', servingGrams: 100, calories: 120, protein: 2.5, carbs: 26, fat: 0.3 },
  { id: 'food-005', name: 'Ketupat', category: 'nasi_karbo', servingLabel: '1 buah (100g)', servingGrams: 100, calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
  { id: 'food-006', name: 'Mie Goreng', category: 'nasi_karbo', servingLabel: '1 porsi (200g)', servingGrams: 200, calories: 380, protein: 9, carbs: 55, fat: 13 },
  { id: 'food-007', name: 'Bihun Goreng', category: 'nasi_karbo', servingLabel: '1 porsi (200g)', servingGrams: 200, calories: 320, protein: 7, carbs: 48, fat: 11 },
  { id: 'food-008', name: 'Kentang Rebus', category: 'nasi_karbo', servingLabel: '1 buah sedang (100g)', servingGrams: 100, calories: 87, protein: 2, carbs: 20, fat: 0.1 },

  // --- Lauk ---
  { id: 'food-009', name: 'Ayam Goreng Dada', category: 'lauk', servingLabel: '1 potong (100g)', servingGrams: 100, calories: 240, protein: 27, carbs: 0, fat: 14 },
  { id: 'food-010', name: 'Ayam Bakar', category: 'lauk', servingLabel: '1 potong (100g)', servingGrams: 100, calories: 200, protein: 29, carbs: 2, fat: 8 },
  { id: 'food-011', name: 'Ayam Suwir Kecap', category: 'lauk', servingLabel: '1 porsi (100g)', servingGrams: 100, calories: 210, protein: 25, carbs: 6, fat: 9 },
  { id: 'food-012', name: 'Rendang Sapi', category: 'lauk', servingLabel: '1 potong (80g)', servingGrams: 80, calories: 195, protein: 11, carbs: 3, fat: 15, region: 'Padang' },
  { id: 'food-013', name: 'Semur Daging', category: 'lauk', servingLabel: '1 potong (80g)', servingGrams: 80, calories: 180, protein: 14, carbs: 5, fat: 11 },
  { id: 'food-014', name: 'Telur Dadar', category: 'lauk', servingLabel: '1 butir (60g)', servingGrams: 60, calories: 110, protein: 6.5, carbs: 0.8, fat: 9 },
  { id: 'food-015', name: 'Telur Ceplok', category: 'lauk', servingLabel: '1 butir (55g)', servingGrams: 55, calories: 95, protein: 6, carbs: 0.5, fat: 7 },
  { id: 'food-016', name: 'Telur Rebus', category: 'lauk', servingLabel: '1 butir (50g)', servingGrams: 50, calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { id: 'food-017', name: 'Ikan Nila Goreng', category: 'lauk', servingLabel: '1 ekor (100g)', servingGrams: 100, calories: 190, protein: 22, carbs: 0, fat: 11 },
  { id: 'food-018', name: 'Ikan Kembung Bakar', category: 'lauk', servingLabel: '1 ekor (100g)', servingGrams: 100, calories: 170, protein: 24, carbs: 0, fat: 8 },
  { id: 'food-019', name: 'Pindang Ikan', category: 'lauk', servingLabel: '1 potong (100g)', servingGrams: 100, calories: 150, protein: 20, carbs: 2, fat: 7 },
  { id: 'food-020', name: 'Udang Goreng Tepung', category: 'lauk', servingLabel: '5 buah (80g)', servingGrams: 80, calories: 210, protein: 14, carbs: 12, fat: 12 },
  { id: 'food-021', name: 'Sate Ayam', category: 'lauk', servingLabel: '5 tusuk + bumbu (100g)', servingGrams: 100, calories: 260, protein: 22, carbs: 8, fat: 16 },
  { id: 'food-022', name: 'Tempe Goreng', category: 'lauk', servingLabel: '2 potong (40g)', servingGrams: 40, calories: 80, protein: 4.5, carbs: 4, fat: 5.5 },
  { id: 'food-023', name: 'Tahu Goreng', category: 'lauk', servingLabel: '2 potong (60g)', servingGrams: 60, calories: 90, protein: 6, carbs: 3, fat: 6 },
  { id: 'food-024', name: 'Tempe Bacem', category: 'lauk', servingLabel: '2 potong (50g)', servingGrams: 50, calories: 105, protein: 5, carbs: 10, fat: 5 },
  { id: 'food-025', name: 'Perkedel Kentang', category: 'lauk', servingLabel: '1 buah (50g)', servingGrams: 50, calories: 110, protein: 3, carbs: 12, fat: 6 },

  // --- Sayur ---
  { id: 'food-026', name: 'Tumis Kangkung', category: 'sayur', servingLabel: '1 porsi (100g)', servingGrams: 100, calories: 70, protein: 2.5, carbs: 6, fat: 4 },
  { id: 'food-027', name: 'Sayur Asem', category: 'sayur', servingLabel: '1 mangkok (200g)', servingGrams: 200, calories: 90, protein: 3, carbs: 15, fat: 2 },
  { id: 'food-028', name: 'Sayur Lodeh', category: 'sayur', servingLabel: '1 mangkok (200g)', servingGrams: 200, calories: 140, protein: 4, carbs: 12, fat: 9 },
  { id: 'food-029', name: 'Gado-Gado', category: 'sayur', servingLabel: '1 porsi tanpa lontong (200g)', servingGrams: 200, calories: 250, protein: 9, carbs: 18, fat: 16 },
  { id: 'food-030', name: 'Capcay', category: 'sayur', servingLabel: '1 porsi (150g)', servingGrams: 150, calories: 110, protein: 5, carbs: 10, fat: 5 },
  { id: 'food-031', name: 'Pecel Sayur', category: 'sayur', servingLabel: '1 porsi (150g)', servingGrams: 150, calories: 160, protein: 6, carbs: 14, fat: 9 },
  { id: 'food-032', name: 'Karedok', category: 'sayur', servingLabel: '1 porsi (150g)', servingGrams: 150, calories: 140, protein: 5, carbs: 12, fat: 8, region: 'Sunda' },

  // --- Gorengan ---
  { id: 'food-033', name: 'Bakwan Sayur', category: 'gorengan', servingLabel: '1 buah (40g)', servingGrams: 40, calories: 140, protein: 2, carbs: 15, fat: 8 },
  { id: 'food-034', name: 'Tahu Isi', category: 'gorengan', servingLabel: '1 buah (50g)', servingGrams: 50, calories: 120, protein: 4, carbs: 10, fat: 7 },
  { id: 'food-035', name: 'Pisang Goreng', category: 'gorengan', servingLabel: '1 buah (60g)', servingGrams: 60, calories: 150, protein: 1.5, carbs: 22, fat: 6 },
  { id: 'food-036', name: 'Risoles', category: 'gorengan', servingLabel: '1 buah (50g)', servingGrams: 50, calories: 130, protein: 3, carbs: 14, fat: 7 },
  { id: 'food-037', name: 'Martabak Telur Mini', category: 'gorengan', servingLabel: '1 potong (60g)', servingGrams: 60, calories: 190, protein: 6, carbs: 14, fat: 12 },
  { id: 'food-038', name: 'Cireng', category: 'gorengan', servingLabel: '3 buah (60g)', servingGrams: 60, calories: 160, protein: 1.5, carbs: 20, fat: 8, region: 'Sunda' },

  // --- Sup & Kuah ---
  { id: 'food-039', name: 'Soto Ayam', category: 'sup_kuah', servingLabel: '1 mangkok tanpa nasi (300ml)', servingGrams: 300, calories: 210, protein: 19, carbs: 8, fat: 11 },
  { id: 'food-040', name: 'Bakso Sapi Kuah', category: 'sup_kuah', servingLabel: '1 mangkok (350ml)', servingGrams: 350, calories: 320, protein: 18, carbs: 25, fat: 16 },
  { id: 'food-041', name: 'Sop Buntut', category: 'sup_kuah', servingLabel: '1 mangkok (300ml)', servingGrams: 300, calories: 280, protein: 22, carbs: 6, fat: 18 },
  { id: 'food-042', name: 'Rawon', category: 'sup_kuah', servingLabel: '1 mangkok (300ml)', servingGrams: 300, calories: 260, protein: 18, carbs: 8, fat: 17, region: 'Jawa Timur' },
  { id: 'food-043', name: 'Sayur Bening Bayam', category: 'sup_kuah', servingLabel: '1 mangkok (200ml)', servingGrams: 200, calories: 60, protein: 3, carbs: 8, fat: 1.5 },
  { id: 'food-044', name: 'Mie Ayam', category: 'sup_kuah', servingLabel: '1 mangkok (350g)', servingGrams: 350, calories: 420, protein: 16, carbs: 58, fat: 14 },
  { id: 'food-045', name: 'Soto Betawi', category: 'sup_kuah', servingLabel: '1 mangkok (300ml)', servingGrams: 300, calories: 340, protein: 20, carbs: 8, fat: 25, region: 'Betawi' },

  // --- Camilan ---
  { id: 'food-046', name: 'Kerupuk Udang', category: 'camilan', servingLabel: '5 keping (15g)', servingGrams: 15, calories: 80, protein: 1, carbs: 10, fat: 4 },
  { id: 'food-047', name: 'Emping', category: 'camilan', servingLabel: '10 keping (15g)', servingGrams: 15, calories: 75, protein: 2, carbs: 8, fat: 4 },
  { id: 'food-048', name: 'Klepon', category: 'camilan', servingLabel: '5 buah (75g)', servingGrams: 75, calories: 180, protein: 2, carbs: 30, fat: 6 },
  { id: 'food-049', name: 'Pisang Rebus', category: 'camilan', servingLabel: '1 buah (100g)', servingGrams: 100, calories: 110, protein: 1.2, carbs: 27, fat: 0.3 },
  { id: 'food-050', name: 'Kacang Rebus', category: 'camilan', servingLabel: '1 mangkok kecil (50g)', servingGrams: 50, calories: 90, protein: 5, carbs: 8, fat: 4 },
  { id: 'food-051', name: 'Roti Bakar Coklat', category: 'camilan', servingLabel: '1 potong (80g)', servingGrams: 80, calories: 240, protein: 6, carbs: 32, fat: 10 },

  // --- Minuman ---
  { id: 'food-052', name: 'Es Teh Manis', category: 'minuman', servingLabel: '1 gelas (250ml)', servingGrams: 250, calories: 90, protein: 0, carbs: 22, fat: 0 },
  { id: 'food-053', name: 'Kopi Susu', category: 'minuman', servingLabel: '1 gelas (200ml)', servingGrams: 200, calories: 120, protein: 3, carbs: 15, fat: 5 },
  { id: 'food-054', name: 'Jus Alpukat Tanpa Gula', category: 'minuman', servingLabel: '1 gelas (250ml)', servingGrams: 250, calories: 160, protein: 2, carbs: 12, fat: 12 },
  { id: 'food-055', name: 'Air Kelapa Muda', category: 'minuman', servingLabel: '1 gelas (250ml)', servingGrams: 250, calories: 45, protein: 0.5, carbs: 9, fat: 0.5 },
  { id: 'food-056', name: 'Susu Kedelai', category: 'minuman', servingLabel: '1 gelas (250ml)', servingGrams: 250, calories: 90, protein: 6, carbs: 8, fat: 4 },
]
