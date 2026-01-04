// YouTube Videos Page - Fetch and display videos from YouTube channel

// YouTube API Configuration
const YOUTUBE_CONFIG = {
    channelId: 'UCfswDYyGktViLU2E2larQlg', // Replace with actual channel ID
    apiKey: 'AIzaSyCD6T8tjooW5rpL75_5GNNDD6WoXIophfE', // Replace with your YouTube Data API v3 key
    maxResults: 12,
    channelHandle: '@SeisenHub'
};

// Alternative: Use RSS feed (no API key required)
const USE_RSS_FALLBACK = true;

document.addEventListener('DOMContentLoaded', function() {
    loadYouTubeVideos();
});

async function loadYouTubeVideos() {
    const loadingEl = document.getElementById('videos-loading');
    const errorEl = document.getElementById('videos-error');
    const gridEl = document.getElementById('videos-grid');

    try {
        let videos;
        
        if (USE_RSS_FALLBACK) {
            // Use RSS feed method (no API key needed)
            videos = await fetchVideosFromRSS();
        } else {
            // Use YouTube Data API (requires API key)
            videos = await fetchVideosFromAPI();
        }

        if (videos && videos.length > 0) {
            displayVideos(videos);
            loadingEl.style.display = 'none';
            gridEl.style.display = 'grid';
        } else {
            throw new Error('No videos found');
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        document.getElementById('error-message').textContent = 
            error.message || 'Unable to load videos. Please visit our YouTube channel directly.';
    }
}

// Method 1: Fetch videos using RSS feed (recommended - no API key needed)
async function fetchVideosFromRSS() {
    const channelHandle = YOUTUBE_CONFIG.channelHandle;
    // YouTube RSS feed URL
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CONFIG.channelId}`;
    
    try {
        // Use a CORS proxy to fetch the RSS feed
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxyUrl + encodeURIComponent(rssUrl));
        
        if (!response.ok) {
            throw new Error('Failed to fetch RSS feed');
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const entries = xmlDoc.querySelectorAll('entry');
        const videos = [];

        entries.forEach((entry, index) => {
            if (index >= YOUTUBE_CONFIG.maxResults) return;

            const videoId = entry.querySelector('videoId')?.textContent;
            const title = entry.querySelector('title')?.textContent;
            const published = entry.querySelector('published')?.textContent;
            const thumbnail = entry.querySelector('thumbnail')?.getAttribute('url');
            
            if (videoId && title) {
                videos.push({
                    id: videoId,
                    title: title,
                    thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                    publishedAt: published,
                    url: `https://www.youtube.com/watch?v=${videoId}`
                });
            }
        });

        return videos;
    } catch (error) {
        console.error('RSS fetch failed:', error);
        // Return mock data as fallback
        return getMockVideos();
    }
}

// Method 2: Fetch videos using YouTube Data API v3 (requires API key)
async function fetchVideosFromAPI() {
    const { channelId, apiKey, maxResults } = YOUTUBE_CONFIG;
    
    if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY') {
        throw new Error('YouTube API key not configured');
    }

    // Fetch latest uploads
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
        `key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
        throw new Error('Failed to fetch from YouTube API');
    }

    const data = await response.json();
    
    return data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description
    }));
}

// Fallback mock data for demonstration
function getMockVideos() {
    return [
        {
            id: 'demo1',
            title: 'Getting Started with Seisen - Quick Start Guide',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+1',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        },
        {
            id: 'demo2',
            title: 'How to Use the Lua Obfuscator - Complete Tutorial',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+2',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        },
        {
            id: 'demo3',
            title: 'Premium Features Showcase - What You Get',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+3',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        },
        {
            id: 'demo4',
            title: 'Script Installation Guide - Step by Step',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+4',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        },
        {
            id: 'demo5',
            title: 'Advanced Obfuscation Techniques',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+5',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        },
        {
            id: 'demo6',
            title: 'Troubleshooting Common Issues',
            thumbnail: 'https://via.placeholder.com/480x360/1a1f2e/10b981?text=Tutorial+6',
            publishedAt: new Date().toISOString(),
            url: 'https://www.youtube.com/@SeisenHub'
        }
    ];
}

function displayVideos(videos) {
    const gridEl = document.getElementById('videos-grid');
    gridEl.innerHTML = '';

    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        gridEl.appendChild(videoCard);
    });
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const publishDate = video.publishedAt ? new Date(video.publishedAt) : new Date();
    const timeAgo = getTimeAgo(publishDate);

    card.innerHTML = `
        <a href="${video.url}" target="_blank" class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        </a>
        <div class="video-info">
            <h3 class="video-title">
                <a href="${video.url}" target="_blank">${video.title}</a>
            </h3>
            <div class="video-meta">
                <span class="video-date">
                    <i class="fas fa-clock"></i>
                    ${timeAgo}
                </span>
            </div>
        </div>
    `;

    return card;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}
