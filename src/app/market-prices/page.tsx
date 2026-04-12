'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Building2, Home, Factory, Trees, Hotel, MapPin, Filter, ChevronDown, Edit3, X, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

const PROPERTY_TYPES = {
  residential: { label: 'سكني', labelEn: 'Residential', icon: <Home size={20} />, color: '#4a90d9' },
  residential_commercial: { label: 'سكني تجاري', labelEn: 'Residential Commercial', icon: <Building2 size={20} />, color: '#22c55e' },
  industrial: { label: 'صناعي', labelEn: 'Industrial', icon: <Factory size={20} />, color: '#f59e0b' },
  agricultural: { label: 'زراعي', labelEn: 'Agricultural', icon: <Trees size={20} />, color: '#84cc16' },
  tourist: { label: 'سياحي', labelEn: 'Tourist', icon: <Hotel size={20} />, color: '#a855f7' },
};

type PropertyTypeKey = keyof typeof PROPERTY_TYPES;

interface AreaPrice {
  high: number | null;
  low: number | null;
}

interface Area {
  id: number;
  name: string;
  tourist: AreaPrice;
  agricultural: AreaPrice;
  industrial: AreaPrice;
  residential_commercial: AreaPrice;
  residential: AreaPrice;
}

interface Region {
  name_ar: string;
  name_en: string;
  areas: Area[];
}

interface Governorate {
  name_ar: string;
  name_en: string;
  regions?: { [key: string]: Region };
  areas?: Area[];
}

interface MarketData {
  governorates: { [key: string]: Governorate };
  price_summary: {
    highest_prices: { [key: string]: { value: number; location: string; unit: string } };
    lowest_prices: { [key: string]: { value: number; location: string; unit: string } };
  };
  statistics: {
    total_governorates: number;
    total_regions: number;
    total_areas: number;
    price_categories: string[];
  };
}

const createEmptyArea = (id: number, name: string): Area => ({
  id,
  name,
  tourist: { high: null, low: null },
  agricultural: { high: null, low: null },
  industrial: { high: null, low: null },
  residential_commercial: { high: null, low: null },
  residential: { high: null, low: null },
});

const initialMarketData: MarketData = {
  governorates: {
    muscat: {
      name_ar: 'محافظة مسقط',
      name_en: 'Muscat Governorate',
      regions: {
        mutrah: {
          name_ar: 'ولاية مطرح',
          name_en: 'Mutrah',
          areas: [
            { id: 1, name: 'مطرح', tourist: { high: null, low: 218.11 }, agricultural: { high: null, low: null }, industrial: { high: 305.73, low: 108.63 }, residential_commercial: { high: 461.02, low: 145.41 }, residential: { high: 203.82, low: 72.42 } },
            { id: 2, name: 'حي مطرح التجاري 1', tourist: { high: null, low: 312.29 }, agricultural: { high: null, low: null }, industrial: { high: 237.24, low: 142.15 }, residential_commercial: { high: 546.52, low: 401.29 }, residential: { high: 158.16, low: 94.77 } },
            { id: 3, name: 'حي مطرح التجاري 2', tourist: { high: null, low: 301.71 }, agricultural: { high: null, low: null }, industrial: { high: 198.0, low: 153.0 }, residential_commercial: { high: 528.0, low: 408.0 }, residential: { high: 132.0, low: 102.0 } },
            { id: 4, name: 'فندق شيراتون', tourist: { high: null, low: 372.01 }, agricultural: { high: null, low: null }, industrial: { high: 247.74, low: 168.12 }, residential_commercial: { high: 558.01, low: 421.87 }, residential: { high: 165.16, low: 112.08 } },
            { id: 5, name: 'روي', tourist: { high: null, low: 276.26 }, agricultural: { high: null, low: null }, industrial: { high: 259.42, low: 160.5 }, residential_commercial: { high: 483.46, low: 321.25 }, residential: { high: 172.95, low: 107.0 } },
            { id: 6, name: 'الممتاز وبيت الفلج', tourist: { high: null, low: 198.83 }, agricultural: { high: null, low: null }, industrial: { high: 264.0, low: 161.63 }, residential_commercial: { high: 347.95, low: 269.38 }, residential: { high: 184.31, low: 107.75 } },
            { id: 7, name: 'دارسيت الطويان', tourist: { high: null, low: 213.71 }, agricultural: { high: null, low: null }, industrial: { high: 224.4, low: 145.5 }, residential_commercial: { high: 374.0, low: 204.33 }, residential: { high: 187.0, low: 97.0 } },
            { id: 8, name: 'الوادي الكبير', tourist: { high: null, low: 196.57 }, agricultural: { high: null, low: null }, industrial: { high: 258.0, low: 150.58 }, residential_commercial: { high: 344.0, low: 217.67 }, residential: { high: 172.0, low: 97.0 } },
            { id: 9, name: 'الولجة', tourist: { high: null, low: 217.83 }, agricultural: { high: null, low: null }, industrial: { high: 228.72, low: 145.5 }, residential_commercial: { high: 381.2, low: 204.33 }, residential: { high: 152.48, low: 97.0 } },
            { id: 10, name: 'الحميرة', tourist: { high: null, low: 191.16 }, agricultural: { high: null, low: null }, industrial: { high: 247.5, low: 154.43 }, residential_commercial: { high: 334.53, low: 206.19 }, residential: { high: 165.0, low: 102.95 } },
            { id: 11, name: 'وادي عدي', tourist: { high: null, low: 186.86 }, agricultural: { high: null, low: null }, industrial: { high: 130.8, low: 92.4 }, residential_commercial: { high: 327.0, low: 231.0 }, residential: { high: 109.0, low: 77.0 } },
            { id: 12, name: 'حلة السد', tourist: { high: null, low: 257.98 }, agricultural: { high: null, low: null }, industrial: { high: 225.74, low: 111.43 }, residential_commercial: { high: 451.47, low: 222.86 }, residential: { high: 150.49, low: 74.29 } }
          ]
        },
        'al_watiyah_khawr': {
          name_ar: 'الوطية والخوير',
          name_en: 'Al Watiyah & Khawr',
          areas: [
            { id: 1, name: 'الوطنية', tourist: { high: null, low: 369.6 }, agricultural: { high: 50.4, low: 31.81 }, industrial: { high: 277.2, low: 174.97 }, residential_commercial: { high: 554.4, low: 397.67 }, residential: { high: 252.0, low: 159.07 } },
            { id: 2, name: 'مناطق رقم (9,20,29,32,13,14)', tourist: { high: null, low: 400.4 }, agricultural: { high: 66.73, low: 37.68 }, industrial: { high: 200.2, low: 113.03 }, residential_commercial: { high: 600.6, low: 452.13 }, residential: { high: 400.4, low: 226.07 } },
            { id: 3, name: 'منطقة 16', tourist: { high: null, low: 533.87 }, agricultural: { high: 66.73, low: 37.68 }, industrial: { high: 200.2, low: 113.03 }, residential_commercial: { high: 800.8, low: 452.13 }, residential: { high: 400.4, low: 226.07 } },
            { id: 4, name: 'القرم/لولاي', tourist: { high: null, low: 400.4 }, agricultural: { high: 66.73, low: 36.17 }, industrial: { high: 200.2, low: 108.5 }, residential_commercial: { high: 600.6, low: 434.0 }, residential: { high: 400.4, low: 217.0 } },
            { id: 5, name: 'رابية القرم', tourist: { high: null, low: 397.89 }, agricultural: { high: 66.32, low: 42.49 }, industrial: { high: 198.95, low: 127.46 }, residential_commercial: { high: 596.84, low: 382.37 }, residential: { high: 397.89, low: 254.91 } },
            { id: 6, name: 'مدينة السلطان قابوس', tourist: { high: null, low: 397.93 }, agricultural: { high: 66.9, low: 44.98 }, industrial: { high: 200.7, low: 134.95 }, residential_commercial: { high: 596.9, low: 539.8 }, residential: { high: 399.51, low: 269.9 } },
            { id: 7, name: 'الصاروج', tourist: { high: null, low: 501.4 }, agricultural: { high: 83.57, low: 50.33 }, industrial: { high: 250.7, low: 151.0 }, residential_commercial: { high: 752.1, low: 604.0 }, residential: { high: 501.4, low: 302.0 } },
            { id: 8, name: 'شاطئ القرم', tourist: { high: null, low: 517.14 }, agricultural: { high: 99.45, low: 66.3 }, industrial: { high: 198.9, low: 132.6 }, residential_commercial: { high: 775.71, low: 517.14 }, residential: { high: 596.7, low: 397.8 } },
            { id: 9, name: 'الخط الأول من البحر', tourist: { high: null, low: 499.52 }, agricultural: { high: 49.64, low: 31.68 }, industrial: { high: 206.83, low: 132.0 }, residential_commercial: { high: 749.28, low: 475.8 }, residential: { high: 248.2, low: 158.4 } },
            { id: 10, name: 'الخوير', tourist: { high: null, low: 541.79 }, agricultural: { high: 54.0, low: 33.28 }, industrial: { high: 225.0, low: 138.67 }, residential_commercial: { high: 812.68, low: 503.73 }, residential: { high: 270.0, low: 166.4 } },
            { id: 11, name: 'مناطق رقم (25,28,33,33/1)', tourist: { high: null, low: 502.33 }, agricultural: { high: 60.28, low: 36.4 }, industrial: { high: 251.17, low: 151.67 }, residential_commercial: { high: 753.5, low: 455.0 }, residential: { high: 301.4, low: 182.0 } }
          ]
        },
        seeb: {
          name_ar: 'ولاية السيب',
          name_en: 'Seeb',
          areas: [
            { id: 1, name: 'الموالح الجنوبية', tourist: { high: null, low: 384.51 }, agricultural: { high: 35.31, low: 28.67 }, industrial: { high: 264.81, low: 120.0 }, residential_commercial: { high: 576.76, low: 375.0 }, residential: { high: 200.41, low: 108.78 } },
            { id: 2, name: 'الموالح الشمالية', tourist: { high: null, low: 300.32 }, agricultural: { high: 38.02, low: 25.38 }, industrial: { high: 285.16, low: 118.6 }, residential_commercial: { high: 450.49, low: 273.83 }, residential: { high: 200.82, low: 109.53 } },
            { id: 3, name: 'الحيل الجنوبية', tourist: { high: null, low: 334.65 }, agricultural: { high: 32.73, low: 26.31 }, industrial: { high: 245.44, low: 123.09 }, residential_commercial: { high: 501.97, low: 283.81 }, residential: { high: 213.79, low: 104.88 } },
            { id: 4, name: 'الحيل الشمالية', tourist: { high: null, low: 358.18 }, agricultural: { high: 37.44, low: 25.71 }, industrial: { high: 280.77, low: 120.21 }, residential_commercial: { high: 537.26, low: 293.73 }, residential: { high: 199.51, low: 111.36 } },
            { id: 5, name: 'الخوض', tourist: { high: null, low: 355.53 }, agricultural: { high: 28.54, low: 20.85 }, industrial: { high: 214.07, low: 96.86 }, residential_commercial: { high: 533.3, low: 319.16 }, residential: { high: 155.44, low: 123.22 } },
            { id: 6, name: 'قريبة الخوض (البلاد)', tourist: { high: null, low: null }, agricultural: { high: 38.5, low: 24.8 }, industrial: { high: 115.5, low: 49.6 }, residential_commercial: { high: 192.5, low: 155.0 }, residential: { high: 77.0, low: 62.0 } },
            { id: 7, name: 'الخوض الخامسة', tourist: { high: null, low: 252.15 }, agricultural: { high: 38.69, low: 21.5 }, industrial: { high: 232.17, low: 65.6 }, residential_commercial: { high: 378.23, low: 210.86 }, residential: { high: 154.78, low: 82.0 } },
            { id: 8, name: 'الخوض السادسة', tourist: { high: null, low: 289.43 }, agricultural: { high: 38.69, low: 21.5 }, industrial: { high: 232.17, low: 82.55 }, residential_commercial: { high: 434.15, low: 256.37 }, residential: { high: 154.78, low: 103.18 } },
            { id: 9, name: 'الخوض السابعة', tourist: { high: null, low: 282.48 }, agricultural: { high: 43.0, low: 23.89 }, industrial: { high: 258.0, low: 91.73 }, residential_commercial: { high: 423.72, low: 286.7 }, residential: { high: 172.0, low: 114.67 } },
            { id: 10, name: 'NE15', tourist: { high: null, low: 252.15 }, agricultural: { high: 38.69, low: 21.5 }, industrial: { high: 232.17, low: 65.6 }, residential_commercial: { high: 378.23, low: 210.86 }, residential: { high: 154.78, low: 82.0 } },
            { id: 11, name: 'SW14', tourist: { high: null, low: 252.15 }, agricultural: { high: 38.69, low: 21.5 }, industrial: { high: 232.17, low: 65.6 }, residential_commercial: { high: 378.23, low: 210.86 }, residential: { high: 154.78, low: 82.0 } },
            { id: 12, name: 'السيب', tourist: { high: null, low: null }, agricultural: { high: null, low: null }, industrial: { high: null, low: null }, residential_commercial: { high: null, low: null }, residential: { high: null, low: null } },
            { id: 13, name: 'الخريس', tourist: { high: null, low: 297.07 }, agricultural: { high: 33.61, low: 30.05 }, industrial: { high: 252.08, low: 96.16 }, residential_commercial: { high: 445.6, low: 262.42 }, residential: { high: 168.69, low: 105.9 } }
          ]
        },
        al_amrat: {
          name_ar: 'ولاية العامرات',
          name_en: 'Al Amrat',
          areas: [
            { id: 1, name: 'المنطقة 2-174', tourist: { high: null, low: 199.43 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 314.59, low: 132.95 }, residential: { high: 81.69, low: 52.3 } },
            { id: 2, name: 'المنطقة 4-3', tourist: { high: null, low: 161.55 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 192.5, low: 107.7 }, residential: { high: 63.96, low: 33.91 } },
            { id: 3, name: 'المنطقة 8', tourist: { high: null, low: 155.35 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 184.24, low: 103.57 }, residential: { high: 61.2, low: 32.53 } },
            { id: 4, name: 'المنطقة 7,6,5', tourist: { high: null, low: 154.86 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 148.05, low: 103.24 }, residential: { high: 58.38, low: 40.33 } },
            { id: 5, name: 'المنطقة 8/1', tourist: { high: null, low: 146.88 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 142.42, low: 97.92 }, residential: { high: 56.97, low: 39.17 } },
            { id: 6, name: 'المنطقة 9', tourist: { high: null, low: 141.07 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 134.67, low: 94.05 }, residential: { high: 37.62, low: 22.48 } },
            { id: 7, name: 'العامرات خلف مركز المملكة', tourist: { high: null, low: null }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 342.92, low: 233.32 }, residential: { high: 81.94, low: 57.02 } },
            { id: 8, name: 'المنطقة 4,3,2,1 / م2,3,4', tourist: { high: null, low: 138.95 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 208.42, low: 152.44 }, residential: { high: 83.37, low: 54.99 } },
            { id: 9, name: 'المنطقة 5/4, 5/2, 5/3, 5/1', tourist: { high: null, low: 178.03 }, agricultural: { high: 26.59, low: 16.34 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 195.83, low: 135.0 }, residential: { high: 90.47, low: 53.26 } },
            { id: 10, name: 'المنطقة 6', tourist: { high: null, low: 140.0 }, agricultural: { high: 31.63, low: 10.2 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 225.0, low: 158.13 }, residential: { high: 51.0, low: 27.67 } },
            { id: 11, name: 'المنطقة 6/1', tourist: { high: null, low: 113.89 }, agricultural: { high: 31.63, low: 10.2 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 170.83, low: 112.23 }, residential: { high: 51.0, low: 27.67 } },
            { id: 12, name: 'المنطقة 7/1 و 7/2', tourist: { high: null, low: 65.97 }, agricultural: { high: 31.63, low: 10.2 }, industrial: { high: 130.0, low: 50.52 }, residential_commercial: { high: 126.02, low: 59.97 }, residential: { high: 48.46, low: 14.43 } }
          ]
        },
        bawshar: {
          name_ar: 'ولاية بوشر',
          name_en: 'Bawshar',
          areas: [
            { id: 1, name: 'منطقة 39', tourist: { high: null, low: 426.78 }, agricultural: { high: 51.21, low: 36.4 }, industrial: { high: 213.39, low: 151.67 }, residential_commercial: { high: 640.17, low: 455.0 }, residential: { high: 256.07, low: 182.0 } },
            { id: 2, name: 'منطقة 42', tourist: { high: null, low: 518.33 }, agricultural: { high: 61.4, low: 36.4 }, industrial: { high: 255.83, low: 151.67 }, residential_commercial: { high: 777.5, low: 455.0 }, residential: { high: 307.0, low: 182.0 } },
            { id: 3, name: 'الغيرة الشمالية', tourist: { high: null, low: 373.24 }, agricultural: { high: 50.47, low: 34.48 }, industrial: { high: 210.28, low: 143.67 }, residential_commercial: { high: 559.86, low: 427.74 }, residential: { high: 252.33, low: 172.4 } },
            { id: 4, name: 'الغيرة الجنوبية', tourist: { high: null, low: 341.46 }, agricultural: { high: 45.4, low: 33.4 }, industrial: { high: 189.17, low: 139.17 }, residential_commercial: { high: 512.19, low: 416.07 }, residential: { high: 227.0, low: 167.0 } },
            { id: 5, name: 'العذبة+18+فومبر', tourist: { high: null, low: 442.93 }, agricultural: { high: 60.4, low: 40.4 }, industrial: { high: 251.67, low: 168.33 }, residential_commercial: { high: 664.4, low: 505.0 }, residential: { high: 302.0, low: 202.0 } },
            { id: 6, name: 'منطقة 35', tourist: { high: null, low: 344.24 }, agricultural: { high: 46.94, low: 23.47 }, industrial: { high: 195.59, low: 97.79 }, residential_commercial: { high: 516.36, low: 352.06 }, residential: { high: 234.71, low: 117.35 } },
            { id: 7, name: 'منطقة 36,37', tourist: { high: null, low: 326.67 }, agricultural: { high: 44.55, low: 29.7 }, industrial: { high: 185.61, low: 123.74 }, residential_commercial: { high: 490.0, low: 445.46 }, residential: { high: 222.73, low: 148.49 } },
            { id: 8, name: 'بوشر+40', tourist: { high: null, low: 325.75 }, agricultural: { high: 44.42, low: 29.61 }, industrial: { high: 185.09, low: 123.39 }, residential_commercial: { high: 488.63, low: 444.21 }, residential: { high: 222.1, low: 148.07 } },
            { id: 9, name: 'منطقة 43', tourist: { high: null, low: 301.25 }, agricultural: { high: 41.08, low: 27.39 }, industrial: { high: 171.17, low: 114.11 }, residential_commercial: { high: 451.88, low: 410.8 }, residential: { high: 205.4, low: 136.93 } },
            { id: 10, name: 'CCC', tourist: { high: null, low: 324.32 }, agricultural: { high: 44.23, low: 29.48 }, industrial: { high: 184.27, low: 122.85 }, residential_commercial: { high: 486.48, low: 442.26 }, residential: { high: 221.13, low: 147.42 } },
            { id: 11, name: 'مرتفعات بوشر', tourist: { high: null, low: 342.56 }, agricultural: { high: 46.71, low: 32.38 }, industrial: { high: 194.64, low: 134.93 }, residential_commercial: { high: 513.84, low: 485.73 }, residential: { high: 233.56, low: 161.91 } },
            { id: 12, name: 'بوشر المرحلة الأولى', tourist: { high: null, low: 326.67 }, agricultural: { high: 44.55, low: 29.7 }, industrial: { high: 185.61, low: 123.74 }, residential_commercial: { high: 490.0, low: 445.46 }, residential: { high: 222.73, low: 148.49 } },
            { id: 13, name: '2/3 مرحلة', tourist: { high: null, low: 303.6 }, agricultural: { high: 41.4, low: 27.6 }, industrial: { high: 172.5, low: 115.0 }, residential_commercial: { high: 455.4, low: 414.0 }, residential: { high: 207.0, low: 138.0 } },
            { id: 14, name: 'بوشر (المنى)', tourist: { high: null, low: 327.5 }, agricultural: { high: 44.66, low: 37.06 }, industrial: { high: 186.08, low: 154.41 }, residential_commercial: { high: 491.25, low: 407.64 }, residential: { high: 223.3, low: 185.29 } },
            { id: 15, name: 'بوشر مرحلة', tourist: { high: null, low: 259.6 }, agricultural: { high: 35.4, low: 25.29 }, industrial: { high: 147.5, low: 105.36 }, residential_commercial: { high: 389.4, low: 379.29 }, residential: { high: 177.0, low: 126.43 } },
            { id: 16, name: 'غلا الأولى', tourist: { high: null, low: 540.61 }, agricultural: { high: null, low: null }, industrial: { high: null, low: null }, residential_commercial: { high: 810.92, low: 486.23 }, residential: { high: null, low: null } },
            { id: 17, name: 'غلا الرابعة', tourist: { high: null, low: 355.5 }, agricultural: { high: null, low: null }, industrial: { high: 355.04, low: 242.74 }, residential_commercial: { high: 533.25, low: 329.08 }, residential: { high: null, low: null } },
            { id: 18, name: 'غلا بقية المراحل', tourist: { high: null, low: null }, agricultural: { high: null, low: null }, industrial: { high: null, low: null }, residential_commercial: { high: null, low: null }, residential: { high: null, low: null } },
            { id: 19, name: 'قرية غلا', tourist: { high: null, low: null }, agricultural: { high: null, low: 23.4 }, industrial: { high: null, low: null }, residential_commercial: { high: 456.0, low: 228.0 }, residential: { high: 114.0, low: 57.0 } },
            { id: 20, name: 'النصب', tourist: { high: null, low: 313.68 }, agricultural: { high: 52.28, low: 30.4 }, industrial: { high: 217.83, low: 126.67 }, residential_commercial: { high: 470.52, low: 273.6 }, residential: { high: 261.4, low: 152.0 } },
            { id: 21, name: 'صنب', tourist: { high: null, low: 136.0 }, agricultural: { high: 25.5, low: 18.0 }, industrial: { high: 153.0, low: 108.0 }, residential_commercial: { high: 204.0, low: 144.0 }, residential: { high: 102.0, low: 72.0 } },
            { id: 22, name: 'لفجار', tourist: { high: null, low: 142.67 }, agricultural: { high: 26.75, low: 20.5 }, industrial: { high: 160.5, low: 123.0 }, residential_commercial: { high: 214.0, low: 164.0 }, residential: { high: 107.0, low: 82.0 } },
            { id: 23, name: 'الحمام', tourist: { high: null, low: 136.0 }, agricultural: { high: 25.5, low: 18.0 }, industrial: { high: 153.0, low: 108.0 }, residential_commercial: { high: 204.0, low: 144.0 }, residential: { high: 102.0, low: 72.0 } },
            { id: 24, name: 'فلج الشام', tourist: { high: null, low: 176.0 }, agricultural: { high: 33.0, low: 20.5 }, industrial: { high: 198.0, low: 123.0 }, residential_commercial: { high: 264.0, low: 164.0 }, residential: { high: 132.0, low: 82.0 } },
            { id: 25, name: 'العوابي', tourist: { high: null, low: 142.67 }, agricultural: { high: 26.75, low: 18.0 }, industrial: { high: 160.5, low: 108.0 }, residential_commercial: { high: 214.0, low: 144.0 }, residential: { high: 107.0, low: 72.0 } },
            { id: 26, name: 'المسفة', tourist: { high: null, low: 82.67 }, agricultural: { high: 15.5, low: 8.0 }, industrial: { high: 93.0, low: 48.0 }, residential_commercial: { high: 124.0, low: 64.0 }, residential: { high: 62.0, low: 32.0 } },
            { id: 27, name: 'العروضان', tourist: { high: null, low: 402.67 }, agricultural: { high: 75.5, low: 63.0 }, industrial: { high: null, low: null }, residential_commercial: { high: 604.0, low: 504.0 }, residential: { high: 302.0, low: 252.0 } },
            { id: 28, name: 'حي البيضاء', tourist: { high: null, low: 294.08 }, agricultural: { high: 55.14, low: 27.57 }, industrial: { high: null, low: null }, residential_commercial: { high: 441.13, low: 220.56 }, residential: { high: 220.56, low: 110.28 } }
          ]
        },
        qurayat: {
          name_ar: 'ولاية قريات',
          name_en: 'Qurayat',
          areas: [
            { id: 1, name: 'الشهباري', tourist: { high: null, low: 61.24 }, agricultural: { high: 12.12, low: 4.97 }, industrial: { high: 68.9, low: 29.8 }, residential_commercial: { high: 91.87, low: 79.47 }, residential: { high: 45.93, low: 19.87 } },
            { id: 2, name: 'فنس', tourist: { high: null, low: 47.08 }, agricultural: { high: 16.7, low: 5.35 }, industrial: { high: 94.2, low: 32.1 }, residential_commercial: { high: 125.6, low: 42.8 }, residential: { high: 62.8, low: 21.4 } },
            { id: 3, name: 'الكريب', tourist: { high: null, low: 54.63 }, agricultural: { high: 11.62, low: 4.97 }, industrial: { high: 66.0, low: 29.8 }, residential_commercial: { high: 88.0, low: 49.67 }, residential: { high: 44.0, low: 19.87 } },
            { id: 4, name: 'دغمر', tourist: { high: null, low: 54.63 }, agricultural: { high: 8.55, low: 4.97 }, industrial: { high: 48.3, low: 29.8 }, residential_commercial: { high: 80.5, low: 49.67 }, residential: { high: 32.2, low: 19.87 } },
            { id: 5, name: 'ضباب', tourist: { high: null, low: 26.84 }, agricultural: { high: 9.18, low: 3.05 }, industrial: { high: 48.44, low: 18.3 }, residential_commercial: { high: 64.58, low: 24.4 }, residential: { high: 32.29, low: 12.2 } },
            { id: 6, name: 'الساحل', tourist: { high: null, low: 26.84 }, agricultural: { high: 5.25, low: 3.05 }, industrial: { high: 31.5, low: 18.3 }, residential_commercial: { high: 42.0, low: 24.4 }, residential: { high: 21.0, low: 12.2 } },
            { id: 7, name: 'حي الظاهر', tourist: { high: null, low: 55.0 }, agricultural: { high: 13.5, low: 8.33 }, industrial: { high: 60.75, low: 37.5 }, residential_commercial: { high: 80.39, low: 50.0 }, residential: { high: 40.5, low: 25.0 } },
            { id: 8, name: 'قريات الساحل', tourist: { high: null, low: 30.26 }, agricultural: { high: 9.92, low: 4.17 }, industrial: { high: 44.66, low: 18.78 }, residential_commercial: { high: 67.09, low: 27.51 }, residential: { high: 29.77, low: 12.52 } },
            { id: 9, name: 'الهوبيه', tourist: { high: null, low: 23.49 }, agricultural: { high: 10.63, low: 5.34 }, industrial: { high: 31.9, low: 16.02 }, residential_commercial: { high: 54.24, low: 21.36 }, residential: { high: 21.27, low: 10.68 } },
            { id: 10, name: 'صواء', tourist: { high: null, low: 25.81 }, agricultural: { high: 5.62, low: 2.67 }, industrial: { high: 31.9, low: 16.0 }, residential_commercial: { high: 46.79, low: 23.47 }, residential: { high: 21.27, low: 10.67 } },
            { id: 11, name: 'التجمعات الأخرى', tourist: { high: null, low: 12.76 }, agricultural: { high: 2.8, low: 1.45 }, industrial: { high: 16.8, low: 8.7 }, residential_commercial: { high: 22.4, low: 11.6 }, residential: { high: 11.2, low: 5.8 } }
          ]
        }
      }
    },
    north_batinah: {
      name_ar: 'محافظة شمال الباطنة',
      name_en: 'North Batinah Governorate',
      regions: {
        sohar: {
          name_ar: 'ولاية صحار',
          name_en: 'Sohar',
          areas: [
            { id: 1, name: 'مركز المدينة - الدرجة الولائية', tourist: { high: 303.87, low: 100.27 }, agricultural: { high: 28.57, low: 8.38 }, industrial: { high: 68.56, low: 40.24 }, residential_commercial: { high: 232.09, low: 100.6 }, residential: { high: 57.13, low: 33.53 } },
            { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 50.0 }, agricultural: { high: 14.28, low: 4.19 }, industrial: { high: 47.04, low: 25.36 }, residential_commercial: { high: 82.13, low: 42.27 }, residential: { high: 39.2, low: 21.13 } },
            { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 37.6 }, agricultural: { high: 7.14, low: 2.1 }, industrial: { high: 28.2, low: 11.6 }, residential_commercial: { high: 37.6, low: 18.1 }, residential: { high: 18.8, low: 5.8 } }
          ]
        },
        alharmonic: {
          name_ar: 'ولاية الخابورة',
          name_en: 'Al Harmal',
          areas: [
            { id: 1, name: 'مركز المدينة', tourist: { high: null, low: 71.4 }, agricultural: { high: 7.63, low: 5.95 }, industrial: { high: 45.8, low: 26.18 }, residential_commercial: { high: 121.08, low: 47.6 }, residential: { high: 30.53, low: 23.8 } },
            { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 15.73 }, agricultural: { high: 7.63, low: 2.29 }, industrial: { high: 45.8, low: 9.6 }, residential_commercial: { high: 121.08, low: 12.8 }, residential: { high: 30.53, low: 6.4 } },
            { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 20.2 }, agricultural: { high: 1.91, low: 1.49 }, industrial: { high: 19.03, low: 10.1 }, residential_commercial: { high: 25.38, low: 13.47 }, residential: { high: 12.69, low: 6.73 } }
          ]
        }
      }
    },
    south_batinah: {
      name_ar: 'محافظة جنوب الباطنة',
      name_en: 'South Batinah Governorate',
      regions: {
        barka: {
          name_ar: 'ولاية بركاء',
          name_en: 'Barka',
          areas: [
            { id: 1, name: 'مركز المدينة - الدرجة الأولى', tourist: { high: 200.0, low: 56.89 }, agricultural: { high: 20.13, low: 11.18 }, industrial: { high: 77.7, low: 51.28 }, residential_commercial: { high: 181.48, low: 85.53 }, residential: { high: 44.33, low: 33.53 } },
            { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 56.24 }, agricultural: { high: 10.06, low: 5.59 }, industrial: { high: 51.8, low: 34.18 }, residential_commercial: { high: 84.36, low: 42.76 }, residential: { high: 34.0, low: 19.07 } },
            { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 30.22 }, agricultural: { high: 5.03, low: 2.79 }, industrial: { high: 34.0, low: 19.07 }, residential_commercial: { high: 45.33, low: 25.42 }, residential: { high: 22.67, low: 12.71 } }
          ]
        },
        awabi: {
          name_ar: 'ولاية العوابي',
          name_en: 'Awabi',
          areas: [
            { id: 1, name: 'مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 46.93 }, agricultural: { high: 7.72, low: 6.22 }, industrial: { high: 59.68, low: 29.84 }, residential_commercial: { high: 70.4, low: 49.73 }, residential: { high: 30.87, low: 24.87 } },
            { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 27.44 }, agricultural: { high: 3.86, low: 3.11 }, industrial: { high: 30.87, low: 24.87 }, residential_commercial: { high: 41.16, low: 33.16 }, residential: { high: 20.58, low: 16.58 } },
            { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 18.29 }, agricultural: { high: 1.93, low: 1.55 }, industrial: { high: 20.58, low: 9.61 }, residential_commercial: { high: 27.44, low: 12.81 }, residential: { high: 13.72, low: 6.41 } }
          ]
        }
      }
    },
    dhofar: {
      name_ar: 'محافظة ظفار',
      name_en: 'Dhofar Governorate',
      regions: {
        salalah: {
          name_ar: 'ولاية صلالة',
          name_en: 'Salalah',
          areas: [
            { id: 1, name: 'صلالة - الدرجة الأولى - مركز المدينة', tourist: { high: 258.67, low: null }, agricultural: { high: 28.31, low: 11.15 }, industrial: { high: 138.68, low: 77.93 }, residential_commercial: { high: 383.54, low: 172.45 }, residential: { high: 129.39, low: 68.62 } },
            { id: 2, name: 'صلالة - الدرجة الثانية - ضواحي المدينة', tourist: { high: 102.25, low: null }, agricultural: { high: 16.42, low: 4.69 }, industrial: { high: 108.57, low: 42.31 }, residential_commercial: { high: 175.37, low: 68.16 }, residential: { high: 61.45, low: 28.21 } },
            { id: 3, name: 'صلالة - التجمعات الأخرى', tourist: { high: 72.59, low: null }, agricultural: { high: 3.02, low: 1.82 }, industrial: { high: 24.35, low: 12.18 }, residential_commercial: { high: 69.72, low: 36.3 }, residential: { high: 16.23, low: 8.12 } }
          ]
        },
        taqa: {
          name_ar: 'ولاية طاقة',
          name_en: 'Taqa',
          areas: [
            { id: 1, name: 'طاقة - مركز المدينة', tourist: { high: 53.66, low: null }, agricultural: { high: 6.29, low: 3.04 }, industrial: { high: 25.15, low: 16.77 }, residential_commercial: { high: 103.47, low: 44.71 }, residential: { high: 50.33, low: 24.33 } },
            { id: 2, name: 'طاقة - ضواحي المدينة', tourist: { high: 36.09, low: null }, agricultural: { high: 3.15, low: 2.05 }, industrial: { high: 19.56, low: 12.65 }, residential_commercial: { high: 51.65, low: 24.06 }, residential: { high: 25.6, low: 12.56 } },
            { id: 3, name: 'طاقة - التجمعات الأخرى', tourist: { high: 24.06, low: null }, agricultural: { high: 1.55, low: 1.02 }, industrial: { high: 16.61, low: 5.15 }, residential_commercial: { high: 25.83, low: 12.03 }, residential: { high: 12.8, low: 6.28 } }
          ]
        },
        mirbat: {
          name_ar: 'ولاية مرباط',
          name_en: 'Mirbat',
          areas: [
            { id: 1, name: 'مرباط - مركز المدينة', tourist: { high: 34.3, low: null }, agricultural: { high: 2.74, low: 1.41 }, industrial: { high: 14.91, low: 8.03 }, residential_commercial: { high: 31.18, low: 12.11 }, residential: { high: 10.94, low: 4.86 } },
            { id: 2, name: 'مرباط - ضواحي المدينة', tourist: { high: 23.39, low: null }, agricultural: { high: 1.37, low: 0.71 }, industrial: { high: 7.46, low: 4.02 }, residential_commercial: { high: 15.59, low: 6.06 }, residential: { high: 5.47, low: 2.43 } },
            { id: 3, name: 'مرباط - التجمعات الأخرى', tourist: { high: 11.69, low: null }, agricultural: { high: 0.68, low: 0.35 }, industrial: { high: 3.73, low: 2.01 }, residential_commercial: { high: 7.8, low: 3.03 }, residential: { high: 2.74, low: 1.21 } }
          ]
        }
      }
    },
    north_sharqiyah: {
      name_ar: 'محافظة شمال الشرقية',
      name_en: 'North Sharqiyah Governorate',
      areas: [
        { id: 1, name: 'مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 56.28 }, agricultural: { high: 3.91, low: 2.28 }, industrial: { high: 46.9, low: 27.4 }, residential_commercial: { high: 62.53, low: 36.53 }, residential: { high: 31.27, low: 18.27 } },
        { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 33.87 }, agricultural: { high: 2.28, low: 1.76 }, industrial: { high: 30.59, low: 21.9 }, residential_commercial: { high: 40.64, low: 28.58 }, residential: { high: 18.21, low: 14.07 } },
        { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 14.67 }, agricultural: { high: 1.14, low: 0.88 }, industrial: { high: 13.2, low: 5.3 }, residential_commercial: { high: 17.6, low: 7.07 }, residential: { high: 8.8, low: 3.53 } }
      ]
    },
    south_sharqiyah: {
      name_ar: 'محافظة جنوب الشرقية',
      name_en: 'South Sharqiyah Governorate',
      regions: {
        sur: {
          name_ar: 'ولاية صور',
          name_en: 'Sur',
          areas: [
            { id: 1, name: 'صور - مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 104.6 }, agricultural: { high: 8.99, low: 4.84 }, industrial: { high: 56.13, low: 31.04 }, residential_commercial: { high: 156.9, low: 75.98 }, residential: { high: 70.16, low: 38.8 } },
            { id: 2, name: 'صور - ضواحي المدينة', tourist: { high: null, low: 53.17 }, agricultural: { high: 4.2, low: 2.26 }, industrial: { high: 52.65, low: 25.79 }, residential_commercial: { high: 79.76, low: 43.36 }, residential: { high: 35.1, low: 17.19 } },
            { id: 3, name: 'صور - التجمعات الأخرى', tourist: { high: null, low: 26.59 }, agricultural: { high: 2.1, low: 1.13 }, industrial: { high: 26.33, low: 12.89 }, residential_commercial: { high: 39.88, low: 21.68 }, residential: { high: 17.55, low: 8.6 } }
          ]
        },
        alkab: {
          name_ar: 'ولاية الكامل والواقع',
          name_en: 'Al Kab & Al Waq',
          areas: [
            { id: 1, name: 'مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 43.46 }, agricultural: { high: 8.15, low: 4.49 }, industrial: { high: 48.89, low: 26.91 }, residential_commercial: { high: 65.18, low: 35.88 }, residential: { high: 32.59, low: 17.94 } },
            { id: 2, name: 'ضواحي المدينة', tourist: { high: null, low: 36.32 }, agricultural: { high: 4.55, low: 2.27 }, industrial: { high: 27.31, low: 13.62 }, residential_commercial: { high: 36.41, low: 18.16 }, residential: { high: 18.2, low: 9.08 } },
            { id: 3, name: 'التجمعات الأخرى', tourist: { high: null, low: 22.22 }, agricultural: { high: 2.27, low: 1.39 }, industrial: { high: 13.6, low: 8.33 }, residential_commercial: { high: 18.14, low: 11.11 }, residential: { high: 9.07, low: 5.56 } }
          ]
        }
      }
    },
    musandam: {
      name_ar: 'محافظة مسندم',
      name_en: 'Musandam Governorate',
      regions: {
        khasab: {
          name_ar: 'ولاية خصب',
          name_en: 'Khasab',
          areas: [
            { id: 1, name: 'خصب - مركز المدينة', tourist: { high: null, low: 82.44 }, agricultural: { high: 4.93, low: 2.47 }, industrial: { high: 42.4, low: 35.33 }, residential_commercial: { high: 80.13, low: 41.22 }, residential: { high: 43.0, low: 29.44 } },
            { id: 2, name: 'خصب - ضواحي المدينة', tourist: { high: null, low: 41.22 }, agricultural: { high: 2.47, low: 1.23 }, industrial: { high: 21.2, low: 17.67 }, residential_commercial: { high: 40.07, low: 20.61 }, residential: { high: 34.67, low: 19.23 } },
            { id: 3, name: 'خصب - التجمعات الأخرى', tourist: { high: null, low: 25.76 }, agricultural: { high: 1.23, low: 0.62 }, industrial: { high: 10.6, low: 8.83 }, residential_commercial: { high: 20.03, low: 10.31 }, residential: { high: 22.07, low: 14.5 } }
          ]
        },
        daba: {
          name_ar: 'ولاية دبا',
          name_en: 'Daba',
          areas: [
            { id: 1, name: 'دبا - مركز المدينة', tourist: { high: null, low: 65.73 }, agricultural: { high: 4.93, low: 2.47 }, industrial: { high: 42.0, low: 36.0 }, residential_commercial: { high: 69.8, low: 38.67 }, residential: { high: 35.0, low: 30.0 } },
            { id: 2, name: 'دبا - ضواحي المدينة', tourist: { high: null, low: 26.25 }, agricultural: { high: 4.93, low: 0.62 }, industrial: { high: 42.0, low: 9.0 }, residential_commercial: { high: 69.8, low: 10.5 }, residential: { high: 35.0, low: 14.5 } },
            { id: 3, name: 'دبا - التجمعات الأخرى', tourist: { high: null, low: 26.25 }, agricultural: { high: 1.23, low: 0.62 }, industrial: { high: 10.5, low: 9.0 }, residential_commercial: { high: 11.63, low: 10.5 }, residential: { high: 22.07, low: 14.5 } }
          ]
        },
        lima: {
          name_ar: 'ولاية ليما',
          name_en: 'Lima',
          areas: [
            { id: 1, name: 'ليما - مركز المدينة', tourist: { high: null, low: 65.73 }, agricultural: { high: 4.93, low: 2.47 }, industrial: { high: 49.33, low: 45.0 }, residential_commercial: { high: 65.78, low: 38.67 }, residential: { high: 32.89, low: 30.0 } },
            { id: 2, name: 'ليما - ضواحي المدينة', tourist: { high: null, low: 42.0 }, agricultural: { high: 2.47, low: 1.23 }, industrial: { high: 24.67, low: 22.5 }, residential_commercial: { high: 26.91, low: 21.0 }, residential: { high: 21.92, low: 20.0 } },
            { id: 3, name: 'ليما - التجمعات الأخرى', tourist: { high: null, low: 26.25 }, agricultural: { high: 1.23, low: 0.62 }, industrial: { high: 12.33, low: 11.25 }, residential_commercial: { high: 9.87, low: 10.5 }, residential: { high: 22.07, low: 14.5 } }
          ]
        }
      }
    },
    al_dhahirah: {
      name_ar: 'محافظة الظاهرة',
      name_en: 'Al Dhahirah Governorate',
      regions: {
        ibri: {
          name_ar: 'ولاية عبري',
          name_en: 'Ibri',
          areas: [
            { id: 1, name: 'عبري - مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 66.74 }, agricultural: { high: 3.02, low: 2.51 }, industrial: { high: 41.87, low: 27.92 }, residential_commercial: { high: 100.12, low: 50.06 }, residential: { high: 24.07, low: 20.06 } },
            { id: 2, name: 'عبري - ضواحي المدينة', tourist: { high: null, low: 33.37 }, agricultural: { high: 1.41, low: 1.17 }, industrial: { high: 20.94, low: 13.96 }, residential_commercial: { high: 50.06, low: 25.03 }, residential: { high: 12.03, low: 10.03 } },
            { id: 3, name: 'عبري - التجمعات الأخرى', tourist: { high: null, low: 16.69 }, agricultural: { high: 0.7, low: 0.59 }, industrial: { high: 10.47, low: 6.98 }, residential_commercial: { high: 25.03, low: 12.51 }, residential: { high: 6.02, low: 5.01 } }
          ]
        },
        dhank: {
          name_ar: 'ولاية ضنك',
          name_en: 'Dhank',
          areas: [
            { id: 1, name: 'ضنك - مركز المدينة', tourist: { high: null, low: 34.66 }, agricultural: { high: 3.7, low: 1.85 }, industrial: { high: 26.85, low: 14.92 }, residential_commercial: { high: 52.0, low: 23.94 }, residential: { high: 14.79, low: 7.39 } },
            { id: 2, name: 'ضنك - ضواحي المدينة', tourist: { high: null, low: 23.94 }, agricultural: { high: 1.85, low: 0.92 }, industrial: { high: 12.53, low: 6.96 }, residential_commercial: { high: 26.0, low: 11.97 }, residential: { high: 7.39, low: 3.7 } },
            { id: 3, name: 'ضنك - التجمعات الأخرى', tourist: { high: null, low: null }, agricultural: { high: 0.92, low: 0.46 }, industrial: { high: 6.27, low: 3.48 }, residential_commercial: { high: 13.0, low: 5.98 }, residential: { high: 3.7, low: 1.85 } }
          ]
        }
      }
    },
    al_buraimi: {
      name_ar: 'محافظة البريمي',
      name_en: 'Al Buraimi Governorate',
      areas: [
        { id: 1, name: 'البريمي - مركز المدينة', tourist: { high: null, low: 36.14 }, agricultural: { high: 4.91, low: 2.45 }, industrial: { high: 35.32, low: 19.62 }, residential_commercial: { high: 54.21, low: 26.79 }, residential: { high: 19.62, low: 9.81 } },
        { id: 2, name: 'البريمي - ضواحي المدينة', tourist: { high: null, low: 18.25 }, agricultural: { high: 2.45, low: 1.23 }, industrial: { high: 17.66, low: 9.81 }, residential_commercial: { high: 18.55, low: 9.13 }, residential: { high: 9.81, low: 4.91 } },
        { id: 3, name: 'البريمي - التجمعات الأخرى', tourist: { high: null, low: null }, agricultural: { high: 1.23, low: 0.61 }, industrial: { high: 8.83, low: 4.91 }, residential_commercial: { high: 9.28, low: 4.56 }, residential: { high: 4.91, low: 2.45 } }
      ]
    },
    central: {
      name_ar: 'محافظة الداخلية',
      name_en: 'Central Governorate',
      regions: {
        nizwa: {
          name_ar: 'ولاية نزوى',
          name_en: 'Nizwa',
          areas: [
            { id: 1, name: 'نزوى - مركز المدينة - الدرجة الأولى', tourist: { high: null, low: 61.56 }, agricultural: { high: 7.42, low: 3.69 }, industrial: { high: 46.28, low: 24.04 }, residential_commercial: { high: 92.34, low: 51.62 }, residential: { high: 30.15, low: 15.3 } },
            { id: 2, name: 'نزوى - ضواحي المدينة', tourist: { high: null, low: 24.12 }, agricultural: { high: 3.67, low: 1.93 }, industrial: { high: 32.29, low: 16.87 }, residential_commercial: { high: 36.17, low: 24.82 }, residential: { high: 20.1, low: 10.2 } },
            { id: 3, name: 'نزوى - التجمعات الأخرى', tourist: { high: null, low: 16.36 }, agricultural: { high: 1.88, low: 0.96 }, industrial: { high: 21.4, low: 11.58 }, residential_commercial: { high: 24.53, low: 18.0 }, residential: { high: 15.0, low: 8.31 } }
          ]
        },
        bahla: {
          name_ar: 'ولاية بهلاء',
          name_en: 'Bahla',
          areas: [
            { id: 1, name: 'بهلاء - مركز المدينة', tourist: { high: null, low: 50.48 }, agricultural: { high: 5.87, low: 2.14 }, industrial: { high: 17.63, low: 13.17 }, residential_commercial: { high: 41.38, low: 29.21 }, residential: { high: 11.75, low: 8.67 } },
            { id: 2, name: 'بهلاء - ضواحي المدينة', tourist: { high: null, low: 30.76 }, agricultural: { high: 3.8, low: 1.6 }, industrial: { high: 8.69, low: 6.09 }, residential_commercial: { high: 20.51, low: 14.56 }, residential: { high: 5.79, low: 4.06 } },
            { id: 3, name: 'بهلاء - التجمعات الأخرى', tourist: { high: null, low: 20.51 }, agricultural: { high: 1.0, low: 0.5 }, industrial: { high: 6.27, low: 4.5 }, residential_commercial: { high: 13.67, low: 12.59 }, residential: { high: 4.18, low: 3.0 } }
          ]
        },
        sinaw: {
          name_ar: 'ولاية السنينة',
          name_en: 'Sinaw',
          areas: [
            { id: 1, name: 'السنينة - مركز المدينة', tourist: { high: null, low: 54.05 }, agricultural: { high: 4.32, low: 2.8 }, industrial: { high: 22.2, low: 17.25 }, residential_commercial: { high: 45.05, low: 23.9 }, residential: { high: 14.8, low: 11.5 } },
            { id: 2, name: 'السنينة - ضواحي المدينة', tourist: { high: null, low: 23.4 }, agricultural: { high: 3.06, low: 0.97 }, industrial: { high: 14.63, low: 11.0 }, residential_commercial: { high: 19.5, low: 14.67 }, residential: { high: 9.75, low: 7.17 } },
            { id: 3, name: 'السنينة - التجمعات الأخرى', tourist: { high: null, low: 17.1 }, agricultural: { high: 2.0, low: 0.5 }, industrial: { high: 10.69, low: 6.09 }, residential_commercial: { high: 14.25, low: 8.12 }, residential: { high: 7.13, low: 4.06 } }
          ]
        }
      }
    }
  },
  price_summary: {
    highest_prices: {
      tourist: { value: 541.79, location: 'الخوير - محافظة مسقط', unit: 'OMR/m²' },
      agricultural: { value: 99.45, location: 'شاطئ القرم - محافظة مسقط', unit: 'OMR/m²' },
      industrial: { value: 355.04, location: 'غلا الرابعة - ولاية بوشر', unit: 'OMR/m²' },
      residential_commercial: { value: 812.68, location: 'الخوير - محافظة مسقط', unit: 'OMR/m²' },
      residential: { value: 596.7, location: 'شاطئ القرم - محافظة مسقط', unit: 'OMR/m²' }
    },
    lowest_prices: {
      tourist: { value: 12.76, location: 'التجمعات الأخرى - ولاية قريات', unit: 'OMR/m²' },
      agricultural: { value: 1.45, location: 'التجمعات الأخرى - ولاية قريات', unit: 'OMR/m²' },
      industrial: { value: 8.7, location: 'التجمعات الأخرى - ولاية قريات', unit: 'OMR/m²' },
      residential_commercial: { value: 11.6, location: 'التجمعات الأخرى - ولاية قريات', unit: 'OMR/m²' },
      residential: { value: 5.8, location: 'التجمعات الأخرى - ولاية قريات', unit: 'OMR/m²' }
    }
  },
  statistics: {
    total_governorates: 10,
    total_regions: 26,
    total_areas: 200,
    price_categories: ['tourist', 'agricultural', 'industrial', 'residential_commercial', 'residential']
  }
};

const STORAGE_KEY = 'ireo_market_prices';

function loadMarketData(): MarketData {
  if (typeof window === 'undefined') return initialMarketData;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialMarketData, ...parsed };
    }
  } catch (e) {
    console.error('Error loading market data:', e);
  }
  return initialMarketData;
}

function saveMarketData(data: MarketData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving market data:', e);
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  if (cleaned === '' || isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  direction: 'rtl',
  textAlign: 'right',
};

type ModalType = 'governorate' | 'region' | 'area' | 'edit' | 'addPrice' | null;

export default function MarketPricesPage() {
  const [marketData, setMarketData] = useState<MarketData>(loadMarketData);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('residential');
  const [editingArea, setEditingArea] = useState<{ govKey: string; regionKey: string; area: Area } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, { high: string; low: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [addForm, setAddForm] = useState({
    nameAr: '',
    nameEn: '',
    areaName: '',
    touristHigh: '',
    touristLow: '',
    agriculturalHigh: '',
    agriculturalLow: '',
    industrialHigh: '',
    industrialLow: '',
    residentialCommercialHigh: '',
    residentialCommercialLow: '',
    residentialHigh: '',
    residentialLow: '',
  });
  const [addPriceTarget, setAddPriceTarget] = useState<{
    govKey: string;
    regionKey: string;
    areaId: number;
    areaName: string;
    propertyType: PropertyTypeKey;
  } | null>(null);
  const [addPriceHigh, setAddPriceHigh] = useState('');
  const [addPriceLow, setAddPriceLow] = useState('');

  const governorates = Object.entries(marketData.governorates);
  const regions = selectedGovernorate && marketData.governorates[selectedGovernorate]?.regions
    ? Object.entries(marketData.governorates[selectedGovernorate].regions!)
    : [];

  const filteredAreas = useMemo(() => {
    if (!selectedGovernorate) return [];
    const gov = marketData.governorates[selectedGovernorate];
    if (!gov) return [];
    if (gov.regions && selectedRegion) {
      const region = gov.regions[selectedRegion];
      return region?.areas || [];
    }
    if (gov.areas) return gov.areas;
    return [];
  }, [marketData, selectedGovernorate, selectedRegion]);

  const currentPropertyType = PROPERTY_TYPES[selectedPropertyType as PropertyTypeKey];

  const recalculateSummary = useCallback((data: MarketData): MarketData => {
    const newSummary = { ...data.price_summary };
    const newHighest: typeof newSummary.highest_prices = {
      tourist: { value: 0, location: '', unit: 'OMR/m²' },
      agricultural: { value: 0, location: '', unit: 'OMR/m²' },
      industrial: { value: 0, location: '', unit: 'OMR/m²' },
      residential_commercial: { value: 0, location: '', unit: 'OMR/m²' },
      residential: { value: 0, location: '', unit: 'OMR/m²' },
    };
    const newLowest: typeof newSummary.lowest_prices = {
      tourist: { value: Infinity, location: '', unit: 'OMR/m²' },
      agricultural: { value: Infinity, location: '', unit: 'OMR/m²' },
      industrial: { value: Infinity, location: '', unit: 'OMR/m²' },
      residential_commercial: { value: Infinity, location: '', unit: 'OMR/m²' },
      residential: { value: Infinity, location: '', unit: 'OMR/m²' },
    };

    Object.entries(data.governorates).forEach(([govKey, gov]) => {
      if (gov.regions) {
        Object.entries(gov.regions).forEach(([regionKey, region]) => {
          region.areas.forEach((area) => {
            const location = `${area.name} - ${gov.name_ar}`;
            (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
              const price = area[type];
              if (price.high != null && price.high > newHighest[type].value) {
                newHighest[type] = { value: price.high, location, unit: 'OMR/m²' };
              }
              if (price.low != null && price.low < newLowest[type].value) {
                newLowest[type] = { value: price.low, location, unit: 'OMR/m²' };
              }
            });
          });
        });
      }
      if (gov.areas) {
        gov.areas.forEach((area) => {
          const location = `${area.name} - ${gov.name_ar}`;
          (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
            const price = area[type];
            if (price.high != null && price.high > newHighest[type].value) {
              newHighest[type] = { value: price.high, location, unit: 'OMR/m²' };
            }
            if (price.low != null && price.low < newLowest[type].value) {
              newLowest[type] = { value: price.low, location, unit: 'OMR/m²' };
            }
          });
        });
      }
    });

    Object.keys(PROPERTY_TYPES).forEach((type) => {
      if (newLowest[type as PropertyTypeKey].value === Infinity) {
        newLowest[type as PropertyTypeKey].value = 0;
      }
    });

    newSummary.highest_prices = newHighest;
    newSummary.lowest_prices = newLowest;
    return { ...data, price_summary: newSummary };
  }, []);

  const countAreas = (data: MarketData): number => {
    let count = 0;
    Object.values(data.governorates).forEach((gov) => {
      if (gov.regions) {
        Object.values(gov.regions).forEach((region) => {
          count += region.areas.length;
        });
      }
      if (gov.areas) {
        count += gov.areas.length;
      }
    });
    return count;
  };

  const countRegions = (data: MarketData): number => {
    let count = 0;
    Object.values(data.governorates).forEach((gov) => {
      if (gov.regions) {
        count += Object.keys(gov.regions).length;
      }
    });
    return count;
  };

  const openEditModal = (area: Area, govKey: string, regionKey: string) => {
    const form: Record<string, { high: string; low: string }> = {};
    (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
      const price = area[type];
      form[type] = {
        high: price.high != null ? String(price.high) : '',
        low: price.low != null ? String(price.low) : '',
      };
    });
    setEditForm(form);
    setEditingArea({ govKey, regionKey, area: { ...area } });
    setHasChanges(false);
    setShowModal('edit');
  };

  const handleEditChange = (type: string, field: 'high' | 'low', value: string) => {
    setEditForm(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
    setHasChanges(true);
  };

  const handleSaveEdit = () => {
    if (!editingArea) return;

    const newAreas = filteredAreas.map((area) => {
      if (area.id === editingArea.area.id && area.name === editingArea.area.name) {
        const updatedArea = { ...area };
        (Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).forEach((type) => {
          updatedArea[type] = {
            high: parseNumber(editForm[type].high),
            low: parseNumber(editForm[type].low),
          };
        });
        return updatedArea;
      }
      return area;
    });

    const newData = { ...marketData };
    if (editingArea.regionKey && newData.governorates[editingArea.govKey]?.regions?.[editingArea.regionKey]) {
      newData.governorates[editingArea.govKey].regions![editingArea.regionKey].areas = newAreas;
    } else if (newData.governorates[editingArea.govKey]?.areas) {
      newData.governorates[editingArea.govKey].areas = newAreas;
    }

    const updatedData = recalculateSummary(newData);
    setMarketData(updatedData);
    saveMarketData(updatedData);
    setEditingArea(null);
    setHasChanges(false);
    setShowModal(null);
  };

  const handleAddGovernorate = () => {
    if (!addForm.nameAr.trim()) return;

    const key = addForm.nameAr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    const newGov: Governorate = {
      name_ar: addForm.nameAr,
      name_en: addForm.nameEn,
      regions: {},
    };

    const newData = {
      ...marketData,
      governorates: {
        ...marketData.governorates,
        [key]: newGov,
      },
      statistics: {
        ...marketData.statistics,
        total_governorates: marketData.statistics.total_governorates + 1,
      },
    };

    setMarketData(newData);
    saveMarketData(newData);
    setAddForm({ nameAr: '', nameEn: '', areaName: '', touristHigh: '', touristLow: '', agriculturalHigh: '', agriculturalLow: '', industrialHigh: '', industrialLow: '', residentialCommercialHigh: '', residentialCommercialLow: '', residentialHigh: '', residentialLow: '' });
    setShowModal(null);
  };

  const handleAddRegion = () => {
    if (!selectedGovernorate || !addForm.nameAr.trim()) return;

    const key = addForm.nameAr.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    const newRegion: Region = {
      name_ar: addForm.nameAr,
      name_en: addForm.nameEn,
      areas: [],
    };

    const gov = marketData.governorates[selectedGovernorate];
    if (!gov.regions) gov.regions = {};

    const newData = {
      ...marketData,
      governorates: {
        ...marketData.governorates,
        [selectedGovernorate]: {
          ...gov,
          regions: {
            ...gov.regions,
            [key]: newRegion,
          },
        },
      },
      statistics: {
        ...marketData.statistics,
        total_regions: marketData.statistics.total_regions + 1,
      },
    };

    setMarketData(newData);
    saveMarketData(newData);
    setAddForm({ nameAr: '', nameEn: '', areaName: '', touristHigh: '', touristLow: '', agriculturalHigh: '', agriculturalLow: '', industrialHigh: '', industrialLow: '', residentialCommercialHigh: '', residentialCommercialLow: '', residentialHigh: '', residentialLow: '' });
    setShowModal(null);
  };

  const handleAddArea = () => {
    if (!selectedGovernorate || !addForm.areaName.trim()) return;

    const newArea = createEmptyArea(
      filteredAreas.length + 1,
      addForm.areaName
    );

    newArea.tourist = { high: parseNumber(addForm.touristHigh), low: parseNumber(addForm.touristLow) };
    newArea.agricultural = { high: parseNumber(addForm.agriculturalHigh), low: parseNumber(addForm.agriculturalLow) };
    newArea.industrial = { high: parseNumber(addForm.industrialHigh), low: parseNumber(addForm.industrialLow) };
    newArea.residential_commercial = { high: parseNumber(addForm.residentialCommercialHigh), low: parseNumber(addForm.residentialCommercialLow) };
    newArea.residential = { high: parseNumber(addForm.residentialHigh), low: parseNumber(addForm.residentialLow) };

    const newData = { ...marketData };
    const gov = newData.governorates[selectedGovernorate];

    if (selectedRegion && gov.regions?.[selectedRegion]) {
      gov.regions[selectedRegion].areas.push(newArea);
    } else if (gov.areas) {
      gov.areas.push(newArea);
    } else if (gov.regions && Object.keys(gov.regions).length > 0) {
      const firstRegionKey = Object.keys(gov.regions)[0];
      if (!gov.regions[firstRegionKey].areas) gov.regions[firstRegionKey].areas = [];
      gov.regions[firstRegionKey].areas.push(newArea);
    }

    const updatedData = recalculateSummary({
      ...newData,
      statistics: {
        ...newData.statistics,
        total_areas: countAreas(newData) + 1,
      },
    });

    setMarketData(updatedData);
    saveMarketData(updatedData);
    setAddForm({ nameAr: '', nameEn: '', areaName: '', touristHigh: '', touristLow: '', agriculturalHigh: '', agriculturalLow: '', industrialHigh: '', industrialLow: '', residentialCommercialHigh: '', residentialCommercialLow: '', residentialHigh: '', residentialLow: '' });
    setShowModal(null);
  };

  const handleResetToDefault = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الأسعار إلى القيم الافتراضية؟')) {
      setMarketData(initialMarketData);
      saveMarketData(initialMarketData);
    }
  };

  const resetAddForm = () => {
    setAddForm({ nameAr: '', nameEn: '', areaName: '', touristHigh: '', touristLow: '', agriculturalHigh: '', agriculturalLow: '', industrialHigh: '', industrialLow: '', residentialCommercialHigh: '', residentialCommercialLow: '', residentialHigh: '', residentialLow: '' });
  };

  const openAddPriceModal = (area: Area, govKey: string, regionKey: string, propertyType: PropertyTypeKey) => {
    setAddPriceTarget({ govKey, regionKey, areaId: area.id, areaName: area.name, propertyType });
    setAddPriceHigh('');
    setAddPriceLow('');
    setShowModal('addPrice');
  };

  const handleSaveAddPrice = () => {
    if (!addPriceTarget) return;
    const highVal = parseNumber(addPriceHigh);
    const lowVal = parseNumber(addPriceLow);
    if (highVal == null && lowVal == null) return;

    const newData = { ...marketData };
    const gov = newData.governorates[addPriceTarget.govKey];

    const updateAreaInList = (areas: Area[]) =>
      areas.map((a) => {
        if (a.id === addPriceTarget.areaId) {
          return {
            ...a,
            [addPriceTarget.propertyType]: {
              high: highVal,
              low: lowVal,
            },
          };
        }
        return a;
      });

    if (addPriceTarget.regionKey && gov?.regions?.[addPriceTarget.regionKey]) {
      gov.regions![addPriceTarget.regionKey].areas = updateAreaInList(
        gov.regions![addPriceTarget.regionKey].areas
      );
    } else if (gov?.areas) {
      gov.areas = updateAreaInList(gov.areas);
    }

    const updatedData = recalculateSummary(newData);
    setMarketData(updatedData);
    saveMarketData(updatedData);
    setAddPriceTarget(null);
    setAddPriceHigh('');
    setAddPriceLow('');
    setShowModal(null);
  };

  const totalAreas = useMemo(() => countAreas(marketData), [marketData]);
  const totalRegions = useMemo(() => countRegions(marketData), [marketData]);

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
            مؤشرات أسعار السوق العقاري
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            تحليل أسعار العقارات حسب المنطقة والنوع - الريال العماني / متر مربع
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { resetAddForm(); setShowModal('governorate'); }} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            إضافة محافظة
          </button>
          <button onClick={() => { resetAddForm(); setShowModal('region'); }} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={!selectedGovernorate}>
            <Plus size={16} />
            إضافة منطقة
          </button>
          <button onClick={() => { resetAddForm(); setShowModal('area'); }} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            إضافة مربع
          </button>
          <button onClick={handleResetToDefault} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={16} />
            إعادة تعيين
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--color-info-bg, rgba(59, 130, 246, 0.1))', padding: 12, borderRadius: 10 }}>
              <MapPin size={24} color="var(--color-info)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>المحافظات</p>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{marketData.statistics.total_governorates}</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))', padding: 12, borderRadius: 10 }}>
              <Building2 size={24} color="var(--color-success)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>المناطق</p>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{totalRegions}</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--color-surface-alt)', padding: 12, borderRadius: 10 }}>
              <Home size={24} color="var(--color-primary)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>المربعات</p>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{totalAreas}</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--color-warning-bg, rgba(245, 158, 11, 0.1))', padding: 12, borderRadius: 10 }}>
              <TrendingUp size={24} color="var(--color-warning)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>أعلى سعر</p>
              <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{formatNumber(marketData.price_summary.highest_prices.residential_commercial.value)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Filter size={20} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>تصفية البيانات</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label className="form-label">المحافظة</label>
            <select
              className="form-select"
              value={selectedGovernorate}
              onChange={(e) => { setSelectedGovernorate(e.target.value); setSelectedRegion(''); }}
            >
              <option value="">جميع المحافظات</option>
              {governorates.map(([key, gov]) => (
                <option key={key} value={key}>{gov.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">المنطقة</label>
            <select
              className="form-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={!selectedGovernorate || regions.length === 0}
            >
              <option value="">جميع المناطق</option>
              {regions.map(([key, reg]) => (
                <option key={key} value={key}>{reg.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">نوع العقار</label>
            <select
              className="form-select"
              value={selectedPropertyType}
              onChange={(e) => setSelectedPropertyType(e.target.value)}
            >
              {Object.entries(PROPERTY_TYPES).map(([key, pt]) => (
                <option key={key} value={key}>{pt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(PROPERTY_TYPES).map(([key, pt]) => (
          <div
            key={key}
            className="card"
            onClick={() => setSelectedPropertyType(key)}
            style={{
              padding: 20,
              cursor: 'pointer',
              border: selectedPropertyType === key ? `2px solid ${pt.color}` : '2px solid var(--color-border)',
              background: selectedPropertyType === key ? `${pt.color}08` : 'var(--color-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ background: `${pt.color}15`, padding: 10, borderRadius: 8 }}>
                {pt.icon}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{pt.label}</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>{pt.labelEn}</p>
              </div>
            </div>
            {marketData.price_summary.highest_prices[key] && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>الأعلى:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                  {formatNumber(marketData.price_summary.highest_prices[key].value)} OMR
                </span>
              </div>
            )}
            {marketData.price_summary.lowest_prices[key] && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>الأقل:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                  {formatNumber(marketData.price_summary.lowest_prices[key].value)} OMR
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedGovernorate && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            {marketData.governorates[selectedGovernorate]?.name_ar}
            {selectedRegion && ` - ${marketData.governorates[selectedGovernorate].regions?.[selectedRegion]?.name_ar || ''}`}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-secondary)', marginRight: 12 }}>
              ({filteredAreas.length} مربع)
            </span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>المربع</th>
                  <th>النوع</th>
                  <th>أعلى سعر (OMR/m²)</th>
                  <th>أقل سعر (OMR/m²)</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map((area, idx) => {
                  const price = area[selectedPropertyType as PropertyTypeKey] as AreaPrice;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{area.name}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: `${currentPropertyType.color}15`,
                          color: currentPropertyType.color,
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
                        }}>
                          {currentPropertyType.icon}
                          {currentPropertyType.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                        {price.high != null ? formatNumber(price.high) : '-'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                        {price.low != null ? formatNumber(price.low) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {price.high == null && price.low == null && (
                            <button
                              onClick={() => openAddPriceModal(area, selectedGovernorate, selectedRegion, selectedPropertyType as PropertyTypeKey)}
                              className="btn btn-sm"
                              style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Plus size={14} />
                              إضافة سعر
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(area, selectedGovernorate, selectedRegion)}
                            className="btn btn-sm"
                            style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit3 size={14} />
                            تعديل
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>ملخص أعلى وأدنى الأسعار</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', marginBottom: 12 }}>
              <TrendingUp size={20} />
              أعلى الأسعار
            </h4>
            {Object.entries(marketData.price_summary.highest_prices).map(([key, item]) => {
              const pt = PROPERTY_TYPES[key as PropertyTypeKey];
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--color-success-bg)', borderRadius: 8, marginBottom: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: pt.color }}>{pt.icon}</span>
                    <span style={{ fontSize: 13 }}>{pt.label}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatNumber(item.value)}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{item.location}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)', marginBottom: 12 }}>
              <TrendingDown size={20} />
              أدنى الأسعار
            </h4>
            {Object.entries(marketData.price_summary.lowest_prices).map(([key, item]) => {
              const pt = PROPERTY_TYPES[key as PropertyTypeKey];
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--color-danger-bg)', borderRadius: 8, marginBottom: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: pt.color }}>{pt.icon}</span>
                    <span style={{ fontSize: 13 }}>{pt.label}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatNumber(item.value)}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{item.location}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal === 'governorate' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%', animation: 'slideInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>إضافة محافظة جديدة</h3>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الاسم بالعربية *</label>
                <input type="text" value={addForm.nameAr} onChange={(e) => setAddForm(p => ({ ...p, nameAr: e.target.value }))} style={INPUT_STYLE} placeholder="مثال: محافظة الداخلية" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الاسم بالإنجليزية</label>
                <input type="text" value={addForm.nameEn} onChange={(e) => setAddForm(p => ({ ...p, nameEn: e.target.value }))} style={INPUT_STYLE} placeholder="Example: Interior Governorate" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setShowModal(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleAddGovernorate} className="btn btn-primary" disabled={!addForm.nameAr.trim()}>
                <Plus size={16} />
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'region' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%', animation: 'slideInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>إضافة منطقة جديدة</h3>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              المحافظة: <strong>{marketData.governorates[selectedGovernorate]?.name_ar}</strong>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الاسم بالعربية *</label>
                <input type="text" value={addForm.nameAr} onChange={(e) => setAddForm(p => ({ ...p, nameAr: e.target.value }))} style={INPUT_STYLE} placeholder="مثال: ولاية نزوى" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>الاسم بالإنجليزية</label>
                <input type="text" value={addForm.nameEn} onChange={(e) => setAddForm(p => ({ ...p, nameEn: e.target.value }))} style={INPUT_STYLE} placeholder="Example: Nizwa" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setShowModal(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleAddRegion} className="btn btn-primary" disabled={!addForm.nameAr.trim()}>
                <Plus size={16} />
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'area' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 28, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>إضافة مربع جديد</h3>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {selectedGovernorate && `المحافظة: ${marketData.governorates[selectedGovernorate]?.name_ar}`}
              {selectedRegion && ` - المنطقة: ${marketData.governorates[selectedGovernorate]?.regions?.[selectedRegion]?.name_ar}`}
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>اسم المربع *</label>
                <input type="text" value={addForm.areaName} onChange={(e) => setAddForm(p => ({ ...p, areaName: e.target.value }))} style={INPUT_STYLE} placeholder="مثال: مركز المدينة" />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'var(--color-primary)' }}>الأسعار (OMR/m²)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {Object.entries(PROPERTY_TYPES).map(([key, pt]) => (
                  <div key={key} style={{ padding: 12, borderRadius: 8, border: `1px solid ${pt.color}30`, background: `${pt.color}05` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: pt.color }}>{pt.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: pt.color }}>{pt.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2 }}>أعلى</label>
                        <input type="text" value={(addForm as any)[`${key}High`]} onChange={(e) => setAddForm(p => ({ ...p, [`${key}High`]: e.target.value }))} style={{ ...INPUT_STYLE, fontSize: 12, padding: '6px 8px' }} placeholder="0.00" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2 }}>أقل</label>
                        <input type="text" value={(addForm as any)[`${key}Low`]} onChange={(e) => setAddForm(p => ({ ...p, [`${key}Low`]: e.target.value }))} style={{ ...INPUT_STYLE, fontSize: 12, padding: '6px 8px' }} placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setShowModal(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleAddArea} className="btn btn-primary" disabled={!addForm.areaName.trim()}>
                <Plus size={16} />
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'addPrice' && addPriceTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', animation: 'slideInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>إضافة سعر</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {addPriceTarget.areaName} - {PROPERTY_TYPES[addPriceTarget.propertyType].label}
                </p>
              </div>
              <button onClick={() => { setShowModal(null); setAddPriceTarget(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>

            <div style={{
              padding: 16, borderRadius: 12, marginBottom: 20,
              border: `1px solid ${PROPERTY_TYPES[addPriceTarget.propertyType].color}30`,
              background: `${PROPERTY_TYPES[addPriceTarget.propertyType].color}05`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: `${PROPERTY_TYPES[addPriceTarget.propertyType].color}15`, padding: 8, borderRadius: 8 }}>
                  {PROPERTY_TYPES[addPriceTarget.propertyType].icon}
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: PROPERTY_TYPES[addPriceTarget.propertyType].color }}>
                    {PROPERTY_TYPES[addPriceTarget.propertyType].label}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {PROPERTY_TYPES[addPriceTarget.propertyType].labelEn}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    أعلى سعر (OMR/m²)
                  </label>
                  <input
                    type="text"
                    value={addPriceHigh}
                    onChange={(e) => setAddPriceHigh(e.target.value)}
                    placeholder="0.00"
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    أقل سعر (OMR/m²)
                  </label>
                  <input
                    type="text"
                    value={addPriceLow}
                    onChange={(e) => setAddPriceLow(e.target.value)}
                    placeholder="0.00"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-surface-alt)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {marketData.governorates[addPriceTarget.govKey]?.name_ar}
              {addPriceTarget.regionKey && ` - ${marketData.governorates[addPriceTarget.govKey]?.regions?.[addPriceTarget.regionKey]?.name_ar || ''}`}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => { setShowModal(null); setAddPriceTarget(null); }} className="btn btn-ghost">إلغاء</button>
              <button
                onClick={handleSaveAddPrice}
                className="btn btn-primary"
                disabled={!addPriceHigh.trim() && !addPriceLow.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} />
                إضافة السعر
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'edit' && editingArea && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, direction: 'rtl' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 28, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>تعديل أسعار: {editingArea.area.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {marketData.governorates[editingArea.govKey]?.name_ar}
                  {editingArea.regionKey && ` - ${marketData.governorates[editingArea.govKey]?.regions?.[editingArea.regionKey]?.name_ar || ''}`}
                </p>
              </div>
              <button onClick={() => { setShowModal(null); setEditingArea(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {(Object.keys(PROPERTY_TYPES) as PropertyTypeKey[]).map((type) => {
                const pt = PROPERTY_TYPES[type];
                const formData = editForm[type] || { high: '', low: '' };
                return (
                  <div key={type} style={{ padding: 16, borderRadius: 12, border: `1px solid ${pt.color}30`, background: `${pt.color}05` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ background: `${pt.color}15`, padding: 8, borderRadius: 8 }}>
                        {pt.icon}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: pt.color }}>{pt.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                          أعلى سعر (OMR/m²)
                        </label>
                        <input type="text" value={formData.high} onChange={(e) => handleEditChange(type, 'high', e.target.value)} placeholder="0.00" style={INPUT_STYLE} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                          أقل سعر (OMR/m²)
                        </label>
                        <input type="text" value={formData.low} onChange={(e) => handleEditChange(type, 'low', e.target.value)} placeholder="0.00" style={INPUT_STYLE} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => { setShowModal(null); setEditingArea(null); }} className="btn btn-ghost">إلغاء</button>
              <button onClick={handleSaveEdit} className="btn btn-primary" disabled={!hasChanges} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={16} />
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}