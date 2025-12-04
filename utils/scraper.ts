
/**
 * Fetches article content from a given URL using a CORS proxy and extracts the main text.
 */
export const fetchArticleFromUrl = async (url: string): Promise<string> => {
  // 1. URL Validation & Cleanup
  let cleanUrl = url.trim();
  
  // Add protocol if missing
  if (!cleanUrl.match(/^https?:\/\//i)) {
      if (cleanUrl.match(/^www\./i) || cleanUrl.includes('.')) {
          cleanUrl = 'https://' + cleanUrl;
      } else {
          throw new Error("Please enter a valid URL starting with http:// or https://");
      }
  }

  try {
    new URL(cleanUrl);
  } catch {
    throw new Error("The URL provided is invalid. Please double-check the address.");
  }

  // 2. Fetching via CORS Proxy with Timeout
  let html = '';
  const controller = new AbortController();
  // Set a 15-second timeout for the fetch request
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // api.allorigins.win returns a JSON object with a 'contents' string containing the raw HTML.
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
    
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`The proxy service is unavailable (Status: ${response.status}). Please try again later.`);
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error("Received an invalid response from the proxy service.");
    }

    // Check if the proxy reported an HTTP error from the target site
    if (data.status && data.status.http_code) {
         if (data.status.http_code === 404) {
             throw new Error("Page not found (404). Please check that the URL is correct.");
         }
         if (data.status.http_code === 403) {
             throw new Error("Access forbidden (403). The website blocks external access.");
         }
         if (data.status.http_code >= 400) {
             throw new Error(`The website returned an error (Status: ${data.status.http_code}). The article may not exist or is restricted.`);
         }
    }

    html = data.contents;

    if (!html) {
      throw new Error("The website returned no content. It might be empty or blocking access.");
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
        throw new Error("The request timed out. The website is taking too long to respond.");
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
         throw new Error("Network error. Please check your internet connection.");
    }
    // Rethrow specific errors generated above
    throw error;
  }

  // 3. Parse HTML and extract text
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove non-content elements that clutter the text
    const noiseSelectors = [
      'script', 'style', 'noscript', 'iframe', 'svg',
      'header', 'footer', 'nav', 'aside', 
      '.ad', '.advertisement', '#sidebar', '.menu',
      '.cookie-banner', '#cookie-consent',
      '[role="alert"]', '[role="banner"]', '[role="navigation"]',
      'button', 'input', 'textarea', 'form'
    ];
    
    noiseSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Attempt to find the main content container
    // Common tags for article bodies: <article>, <main>, or falling back to <body>
    const article = doc.querySelector('article');
    const main = doc.querySelector('main');
    const body = doc.body;

    // Prefer article, then main, then body
    const root = article || main || body;

    if (!root) {
         throw new Error("Could not identify the main content of the page.");
    }

    // Get text content
    let text = root.innerText || root.textContent || "";

    // 4. Cleanup whitespace
    // Replace multiple spaces/newlines with a single space
    text = text.replace(/\s+/g, " ").trim();

    // 5. Content Quality Check
    if (text.length < 200) {
      const lowerText = text.toLowerCase();
      
      // Check for common blocking messages
      if (lowerText.includes('captcha') || lowerText.includes('robot') || lowerText.includes('human verification')) {
          throw new Error("Access denied: This website requires a security check (CAPTCHA) that we cannot bypass.");
      }
      
      if (lowerText.includes('subscribe') || lowerText.includes('sign in') || lowerText.includes('log in') || lowerText.includes('paywall') || lowerText.includes('member-only')) {
           throw new Error("Content Access Error: This article appears to be behind a paywall or login.");
      }
      
      if (lowerText.includes('enable javascript') || lowerText.includes('browser is not supported')) {
           throw new Error("Technical Limitation: This site uses complex JavaScript that cannot be processed by our reader.");
      }
      
      if (lowerText.includes('403 forbidden') || lowerText.includes('access denied')) {
          throw new Error("Access Forbidden: The website has blocked our request.");
      }

      throw new Error("Extraction Failed: We couldn't find enough readable text. The page might be empty, video-based, or heavily protected.");
    }

    return text;

  } catch (error: any) {
    // If it's one of our specific errors from step 5, rethrow it
    if (error.message.includes(':') || error.message.includes('Extraction Failed') || error.message.includes('Page not found')) {
        throw error;
    }
    
    console.error("Scraper Extraction Error:", error);
    throw new Error("Failed to process the page structure. The website layout might be too complex.");
  }
};
