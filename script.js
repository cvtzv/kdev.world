const API_KEY = 'e89a2a3d9499981daad0e9cfed58ec3f';
const USERNAME = 'whocvt';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const CUSTOM_AVATAR = './avatar.jpg';


const elements = {
    userAvatar: document.getElementById('userAvatar'),
    userAvatarImg: document.getElementById('userAvatarImg'),
    avatarInitial: document.getElementById('avatarInitial'),
    userName: document.getElementById('userName'),
    userStats: document.getElementById('userStats'),
    albumArt: document.getElementById('albumArt'),
    trackName: document.getElementById('trackName'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),
    statusText: document.getElementById('statusText'),
    trackPlaycount: document.getElementById('trackPlaycount'),
    trackListeners: document.getElementById('trackListeners'),
    recentTracks: document.getElementById('recentTracks'),
    refreshBtn: document.getElementById('refreshBtn'),
    playingAnimation: document.getElementById('playingAnimation'),
    albumArtGlow: document.querySelector('.album-art-glow'),
    nowPlaying: document.getElementById('nowPlaying')
};

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
    if (diff < 604800) return Math.floor(diff / 86400) + ' д назад';
    return Math.floor(diff / 604800) + ' нед назад';
}

function setAlbumArtGlow(imageUrl) {
    if (imageUrl && imageUrl !== 'https://via.placeholder.com/300?text=No+Track') {
        elements.albumArtGlow.style.backgroundImage = `url(${imageUrl})`;
        elements.albumArtGlow.style.opacity = '0.5';
    } else {
        elements.albumArtGlow.style.opacity = '0';
    }
}

async function fetchAPI(params) {
    const url = new URL(API_BASE);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function getUserInfo() {
    const data = await fetchAPI({
        method: 'user.getInfo',
        user: USERNAME
    });
    
    if (data && data.user) {
        const user = data.user;
        
        if (user.realname && user.realname.trim() !== '') {
            elements.avatarInitial.textContent = user.realname.charAt(0).toUpperCase();
        } else {
            elements.avatarInitial.textContent = USERNAME.charAt(0).toUpperCase();
        }
        
        if (CUSTOM_AVATAR && CUSTOM_AVATAR.trim() !== '') {
            const img = new Image();
            img.onload = () => {
                elements.userAvatarImg.src = CUSTOM_AVATAR;
                elements.userAvatarImg.style.display = 'block';
            };
            img.onerror = () => {
                elements.userAvatarImg.style.display = 'none';
            };
            img.src = CUSTOM_AVATAR;
        } else if (user.image && user.image.length > 0) {
            const avatarUrl = user.image.find(img => img.size === 'extralarge')?.['#text'] 
                           || user.image[user.image.length - 1]['#text'];
            
            if (avatarUrl && avatarUrl.trim() !== '' && !avatarUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                const img = new Image();
                img.onload = () => {
                    elements.userAvatarImg.src = avatarUrl;
                    elements.userAvatarImg.style.display = 'block';
                };
                img.onerror = () => {
                    elements.userAvatarImg.style.display = 'none';
                };
                img.src = avatarUrl;
            }
        }
        
        const playcount = formatNumber(parseInt(user.playcount));
        elements.userStats.textContent = `${playcount} прослушиваний`;
    }
}

async function getRecentTracks() {
    const data = await fetchAPI({
        method: 'user.getRecentTracks',
        user: USERNAME,
        limit: 10
    });
    
    if (data && data.recenttracks && data.recenttracks.track) {
        const tracks = data.recenttracks.track;
        
        if (tracks.length > 0) {
            const currentTrack = tracks[0];
            const isNowPlaying = currentTrack['@attr'] && currentTrack['@attr'].nowplaying === 'true';
            
            await updateCurrentTrack(currentTrack, isNowPlaying);
            
            const recentList = isNowPlaying ? tracks.slice(1, 6) : tracks.slice(0, 5);
            updateRecentTracksList(recentList);
        }
    }
}

async function updateCurrentTrack(track, isNowPlaying) {
    elements.trackName.textContent = track.name || '-';
    elements.artistName.textContent = track.artist['#text'] || track.artist.name || '-';
    elements.albumName.textContent = track.album['#text'] || '-';
    
    let albumArtUrl = 'https://via.placeholder.com/300?text=No+Track';
    if (track.image && track.image.length > 0) {
        const largeImage = track.image[track.image.length - 1]['#text'];
        if (largeImage) albumArtUrl = largeImage;
    }
    elements.albumArt.src = albumArtUrl;
    setAlbumArtGlow(albumArtUrl);
    
    if (isNowPlaying) {
        elements.statusText.textContent = 'Сейчас играет';
        elements.playingAnimation.classList.add('active');
    } else {
        const timestamp = track.date ? parseInt(track.date.uts) : Math.floor(Date.now() / 1000);
        elements.statusText.textContent = getTimeAgo(timestamp);
        elements.playingAnimation.classList.remove('active');
    }
    
    await getTrackInfo(track.name, track.artist['#text'] || track.artist.name);
}

async function getTrackInfo(trackName, artistName) {
    const data = await fetchAPI({
        method: 'track.getInfo',
        track: trackName,
        artist: artistName,
        username: USERNAME
    });
    
    if (data && data.track) {
        const track = data.track;
        
        if (track.playcount) {
            elements.trackPlaycount.textContent = formatNumber(parseInt(track.playcount));
        }
        
        if (track.listeners) {
            elements.trackListeners.textContent = formatNumber(parseInt(track.listeners));
        }
    }
}

function updateRecentTracksList(tracks) {
    elements.recentTracks.innerHTML = '';
    
    tracks.forEach(track => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        
        let albumArtUrl = 'https://via.placeholder.com/50?text=?';
        if (track.image && track.image.length > 0) {
            const mediumImage = track.image[1]['#text'];
            if (mediumImage) albumArtUrl = mediumImage;
        }
        
        const timeAgo = track.date ? getTimeAgo(parseInt(track.date.uts)) : '';
        
        trackItem.innerHTML = `
            <img src="${albumArtUrl}" alt="Album" class="track-item-art">
            <div class="track-item-info">
                <div class="track-item-name">${track.name}</div>
                <div class="track-item-artist">${track.artist['#text'] || track.artist.name}</div>
            </div>
            <div class="track-item-time">${timeAgo}</div>
        `;
        
        trackItem.addEventListener('click', () => {
            updateCurrentTrack(track, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        elements.recentTracks.appendChild(trackItem);
    });
}

async function loadAllData() {
    elements.nowPlaying.classList.add('loading');
    
    try {
        await Promise.all([
            getUserInfo(),
            getRecentTracks()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        elements.statusText.textContent = 'Ошибка загрузки';
    } finally {
        elements.nowPlaying.classList.remove('loading');
    }
}

function setupRefreshButton() {
    elements.refreshBtn.addEventListener('click', async () => {
        elements.refreshBtn.style.pointerEvents = 'none';
        await loadAllData();
        setTimeout(() => {
            elements.refreshBtn.style.pointerEvents = 'auto';
        }, 2000);
    });
}

function startAutoRefresh() {
    setInterval(async () => {
        await getRecentTracks();
    }, 30000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupRefreshButton();
    startAutoRefresh();
});


