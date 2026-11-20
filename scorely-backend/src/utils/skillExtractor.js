// Yaygın programlama dilleri ve teknolojiler
const commonSkills = [
  'javascript', 'python', 'java', 'c#', 'c++', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'spring', 'laravel',
  'html', 'css', 'sass', 'less', 'typescript', 'jquery', 'bootstrap', 'tailwind',
  'aws', 'azure', 'gcp', 'firebase', 'docker', 'kubernetes', 'terraform',
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'trello', 'scrum', 'agile',
  'sql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite', 'redis',
  'rest api', 'graphql', 'oauth', 'jwt', 'authentication', 'authorization',
  'machine learning', 'ai', 'data science', 'nlp', 'computer vision',
  'testing', 'jest', 'mocha', 'selenium', 'cypress', 'tdd', 'ci/cd',
  // İşveren/işletme becerileri
  'project management', 'leadership', 'communication', 'team management',
  'problem solving', 'critical thinking', 'time management', 'negotiation',
  'presentation', 'reporting', 'analytics', 'research', 'business intelligence',
  'foreign language', 'english', 'spanish', 'french', 'german', 'turkish'
];

// CV metninden becerileri çıkar
const extractSkillsFromText = (text) => {
  if (!text) return [];
  
  // Metin ön işleme
  const lowerText = text.toLowerCase();
  
  // Bulunan becerileri saklamak için
  const foundSkills = [];
  
  // Her beceriyi kontrol et
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
};

// CV'den deneyim yıllarını tahmin et (geliştirilmiş algoritma)
const estimateExperienceYears = (text) => {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  let totalYears = 0;
  
  // 1. Deneyim yılını doğrudan belirten ifadeler
  const yearsOfExperiencePatterns = [
    /(\d+)\s+(?:years?|yıl)\s+(?:of\s+)?experience/gi,
    /deneyim\s*:?\s*(\d+)\s+(?:years?|yıl)/gi,
    /(\d+)\s+(?:years?|yıl)(?:\s+of)?\s+work(?:ing)?\s+experience/gi
  ];
  
  for (const pattern of yearsOfExperiencePatterns) {
    const matches = [...lowerText.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && !isNaN(match[1])) {
        const years = parseInt(match[1]);
        if (years > 0 && years < 50) {  // Makul bir yıl aralığı
          return years; // Doğrudan belirtilmişse, bu değeri döndür
        }
      }
    }
  }
  
  // 2. İş deneyimi tarih aralıklarından hesaplama
  const dateRangePatterns = [
    /(\d{4})\s*[-–]\s*(present|current|şimdi|günümüz|halen|devam)/gi,
    /(\d{4})\s*[-–]\s*(\d{4})/gi,
    /(\d{2})\/(\d{4})\s*[-–]\s*(present|current|şimdi|günümüz|halen|devam)/gi,
    /(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{4})/gi
  ];
  
  const currentYear = new Date().getFullYear();
  let experiencePeriods = [];
  
  for (const pattern of dateRangePatterns) {
    const matches = [...lowerText.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && !isNaN(match[1])) {
        const startYear = parseInt(match[1]);
        let endYear;
        
        if (match[2] && isNaN(match[2])) {
          // "present" gibi bir ifade varsa mevcut yılı kullan
          endYear = currentYear;
        } else if (match[2] && !isNaN(match[2])) {
          // Bitiş yılı belirtilmişse
          endYear = parseInt(match[2]);
        }
        
        if (startYear && endYear && startYear <= endYear) {
          if (startYear > 1950 && endYear <= currentYear) {
            // Tarih aralığını kaydet (daha sonra örtüşmeleri kontrol etmek için)
            experiencePeriods.push({ start: startYear, end: endYear });
          }
        }
      }
    }
  }
  
  // Örtüşen dönemleri temizle ve toplam yılı hesapla
  if (experiencePeriods.length > 0) {
    // Tarihleri sırala
    experiencePeriods.sort((a, b) => a.start - b.start);
    
    // Örtüşmeleri birleştir
    const mergedPeriods = [experiencePeriods[0]];
    
    for (let i = 1; i < experiencePeriods.length; i++) {
      const current = experiencePeriods[i];
      const previous = mergedPeriods[mergedPeriods.length - 1];
      
      if (current.start <= previous.end) {
        // Örtüşme var, dönemleri birleştir
        previous.end = Math.max(previous.end, current.end);
      } else {
        // Örtüşme yok, yeni dönem ekle
        mergedPeriods.push(current);
      }
    }
    
    // Toplam yılları hesapla
    for (const period of mergedPeriods) {
      totalYears += period.end - period.start;
    }
    
    return totalYears;
  }
  
  // 3. İş pozisyonları arama (örn: "Backend Developer", "Sr. Engineer" gibi)
  const jobPositionPatterns = [
    /senior|sr\.|lead|principal|director|manager|architect|head of|cto|vp/gi,
    /developer|engineer|programmer|software|analyst|consultant/gi
  ];
  
  let foundJobTitle = false;
  for (const pattern of jobPositionPatterns) {
    if (pattern.test(lowerText)) {
      foundJobTitle = true;
      break;
    }
  }
  
  // Pozisyon bulduk ama yıl bulamadık, varsayılan değer döndür
  if (foundJobTitle && totalYears === 0) {
    return 2; // Ortalama deneyim olarak 2 yıl varsayalım
  }
  
  return totalYears;
};

// Eğitim seviyesini çıkarma
const extractEducationLevel = (text) => {
  if (!text) return { level: 'unknown', score: 0 };
  
  const lowerText = text.toLowerCase();
  
  // Eğitim seviyesi puanlama (yüksek dereceler daha yüksek puan alır)
  const educationLevels = [
    { keywords: ['doktora', 'ph.d', 'phd', 'doctor of philosophy'], level: 'doctorate', score: 100 },
    { keywords: ['yüksek lisans', 'master', 'msc', 'ma', 'mba'], level: 'masters', score: 80 },
    { keywords: ['lisans', 'bachelor', 'bs', 'ba', 'bsc', 'undergraduate'], level: 'bachelors', score: 60 },
    { keywords: ['ön lisans', 'associate', 'aa'], level: 'associate', score: 40 },
    { keywords: ['lise', 'high school', 'secondary school'], level: 'high_school', score: 20 }
  ];
  
  for (const edu of educationLevels) {
    for (const keyword of edu.keywords) {
      if (lowerText.includes(keyword)) {
        return { level: edu.level, score: edu.score };
      }
    }
  }
  
  return { level: 'unknown', score: 0 };
};

// Dil seviyesini çıkarma
const extractLanguageSkills = (text) => {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  
  // Yaygın diller ve seviye göstergeleri
  const languages = [
    'turkish', 'türkçe', 'english', 'ingilizce', 'spanish', 'ispanyolca',
    'french', 'fransızca', 'german', 'almanca', 'chinese', 'çince',
    'russian', 'rusça', 'arabic', 'arapça', 'portuguese', 'portekizce',
    'italian', 'italyanca', 'japanese', 'japonca', 'korean', 'korece'
  ];
  
  const proficiencyLevels = [
    { keywords: ['native', 'ana dil', 'anadil'], level: 'native', score: 100 },
    { keywords: ['fluent', 'akıcı', 'advanced', 'ileri', 'c2', 'c1'], level: 'advanced', score: 80 },
    { keywords: ['intermediate', 'orta', 'b2', 'b1'], level: 'intermediate', score: 60 },
    { keywords: ['basic', 'beginner', 'temel', 'başlangıç', 'a2', 'a1'], level: 'beginner', score: 40 }
  ];
  
  const foundLanguages = [];
  
  // İngilizce, Türkçe gibi dilleri içeren satırları bul
  const lines = lowerText.split('\n');
  
  for (const line of lines) {
    // Satır içinde dil var mı kontrol et
    let foundLanguage = null;
    for (const language of languages) {
      if (line.includes(language)) {
        foundLanguage = language;
        break;
      }
    }
    
    if (foundLanguage) {
      // Dil seviyesini kontrol et
      let languageLevel = { level: 'unknown', score: 30 }; // Varsayılan orta seviye
      
      for (const level of proficiencyLevels) {
        for (const keyword of level.keywords) {
          if (line.includes(keyword)) {
            languageLevel = { level: level.level, score: level.score };
            break;
          }
        }
        if (languageLevel.level !== 'unknown') break;
      }
      
      foundLanguages.push({
        language: foundLanguage,
        level: languageLevel.level,
        score: languageLevel.score
      });
    }
  }
  
  return foundLanguages;
};

// CV'den tüm skorlamaları yap
const scoreCV = (text) => {
  if (!text) return { totalScore: 0, details: {} };
  
  // Becerileri çıkar
  const skills = extractSkillsFromText(text);
  
  // Deneyim yılını hesapla
  const experienceYears = estimateExperienceYears(text);
  
  // Eğitim seviyesini belirle
  const education = extractEducationLevel(text);
  
  // Dil becerilerini belirle
  const languages = extractLanguageSkills(text);
  
  // Skorları hesapla
  const skillScore = Math.min(skills.length * 5, 100); // Her beceri 5 puan, max 100
  const experienceScore = Math.min(experienceYears * 10, 100); // Her yıl 10 puan, max 100
  const educationScore = education.score;
  
  // Dil puanı - En yüksek 2 dil puanının ortalaması
  let languageScore = 0;
  if (languages.length > 0) {
    // Puanı yüksek olan dilleri sırala
    const sortedLanguages = [...languages].sort((a, b) => b.score - a.score);
    // En iyi 2 dili al (veya daha az varsa hepsini)
    const topLanguages = sortedLanguages.slice(0, 2);
    // Ortalama puanı hesapla
    languageScore = topLanguages.reduce((sum, lang) => sum + lang.score, 0) / topLanguages.length;
  }
  
  // Toplam puanı hesapla (her kategori eşit ağırlıkta)
  const totalScore = (skillScore + experienceScore + educationScore + languageScore) / 4;
  
  return {
    totalScore: Math.round(totalScore),
    details: {
      skillScore,
      skillCount: skills.length,
      experienceScore,
      experienceYears,
      educationScore,
      educationLevel: education.level,
      languageScore,
      languages
    }
  };
};

module.exports = {
  extractSkillsFromText,
  estimateExperienceYears,
  extractEducationLevel,
  extractLanguageSkills,
  scoreCV
};