import Parser from 'rss-parser';

const parser = new Parser();

// In-memory cache
let newsCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const FEEDS = [
  { url: 'https://timesofindia.indiatimes.com/rss/4719148.cms', source: 'Times of India' },
  { url: 'https://www.hindustantimes.com/feeds/rss/education/rssfeed.xml', source: 'Hindustan Times' },
  { url: 'https://www.thehindu.com/education/feeder/default.rss', source: 'The Hindu' },
  { url: 'https://www.jagranjosh.com/rss/articles.xml', source: 'Jagran Josh' }
];

const KEYWORD_MAP = {
  "CAT": ["CAT", "IIM", "XAT", "MAT", "MBA"],
  "SSC": ["SSC", "CGL", "CHSL"],
  "Banking": ["IBPS", "SBI", "Bank", "RBI", "Clerk", "PO"],
  "GATE": ["GATE", "IIT", "MTech"],
  "UPSC": ["UPSC", "IAS", "IPS", "Civil Services"],
  "Railway": ["RRB", "NTPC", "Railway"],
  "Defence": ["CDS", "NDA", "AFCAT", "Defence", "Army", "Navy"]
};

// Simple relative time formatting
const getRelativeTime = (pubDate) => {
  if (!pubDate) return "Recently";
  const diffInMins = Math.floor((Date.now() - new Date(pubDate)) / 60000);
  if (diffInMins < 60) return `${diffInMins} min${diffInMins !== 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
};

// Categorize based on title and description
const categorize = (text) => {
  const upperText = text.toUpperCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => upperText.includes(kw.toUpperCase()))) {
      return category;
    }
  }
  return "Education"; // Fallback category
};

export const getExamNews = async (req, res) => {
  try {
    const categoryQuery = req.query.category || "All";
    const now = Date.now();

    // Serve from cache if valid
    if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      const filtered = categoryQuery === "All" 
        ? newsCache 
        : newsCache.filter(n => n.cat === categoryQuery);
      return res.status(200).json(filtered.slice(0, 10));
    }

    // Fetch and parse feeds concurrently
    const feedPromises = FEEDS.map(async (feedInfo) => {
      try {
        const feed = await parser.parseURL(feedInfo.url);
        return feed.items.map(item => ({
          ...item,
          source: feedInfo.source
        }));
      } catch (err) {
        console.error(`Failed to fetch ${feedInfo.url}:`, err.message);
        return []; // Fail gracefully for individual feeds
      }
    });

    const results = await Promise.all(feedPromises);
    let allArticles = results.flat();

    // Sort newest first
    allArticles.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    // Map to required JSON format
    const formattedNews = allArticles.map(item => {
      const fullText = `${item.title} ${item.contentSnippet || item.content || ''}`;
      
      // Clean description
      let desc = item.contentSnippet || item.content || '';
      desc = desc.replace(/<[^>]*>?/gm, '').trim(); // Remove HTML tags
      if (desc.length > 120) desc = desc.substring(0, 120) + "...";

      return {
        cat: categorize(fullText),
        title: item.title,
        desc: desc,
        source: item.source,
        url: item.link,
        time: getRelativeTime(item.pubDate)
      };
    });

    // Update cache with all fetched results
    newsCache = formattedNews;
    lastFetchTime = now;

    // Filter by requested category
    const filteredResults = categoryQuery === "All"
      ? newsCache
      : newsCache.filter(n => n.cat === categoryQuery);

    res.status(200).json(filteredResults.slice(0, 10));

  } catch (error) {
    console.error("RSS Parsing Error:", error);
    res.status(500).json({ message: "Failed to fetch exam news", error: error.message });
  }
};
