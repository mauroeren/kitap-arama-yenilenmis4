const resultDiv = document.getElementById('results');
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Sayfa ilk açıldığında çalışacaklar
function init() {
    loadTheme();
    updateFavCount();
    renderFavorites();
}

function searchBooksFromInput() {
    const query = document.getElementById('search').value;
    if (!query) {
        showToast("Lütfen bir kitap adı girin!", "error");
        return;
    }

    resultDiv.innerHTML = '';
    // Skeleton Loading
    for (let i = 0; i < 4; i++) {
        resultDiv.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton sk-img"></div>
                <div class="skeleton sk-title"></div>
                <div class="skeleton sk-text"></div>
            </div>
        `;
    }

    fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`)
        .then(response => response.json())
        .then(data => {
            resultDiv.innerHTML = '';

            if (data.totalItems === 0) {
                resultDiv.innerHTML = '<p style="text-align:center; width:100%;">😔 Aradığınız kitap bulunamadı.</p>';
                return;
            }

            data.items.forEach(item => {
                const title = item.volumeInfo.title || 'Başlıksız';
                const authors = item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Yazar Bilinmiyor';
                const img = item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://via.placeholder.com/128x192.png?text=No+Cover';
                const description = item.volumeInfo.description || 'Açıklama bulunmuyor.';
                const link = item.volumeInfo.previewLink;
                const id = item.id;

                // Bu kitap favorilerde var mı kontrol et
                const isFav = favorites.some(fav => fav.id === id);
                const heartClass = isFav ? 'active' : '';
                const heartIcon = isFav ? 'fas fa-heart' : 'far fa-heart';

                const bookEl = document.createElement('div');
                bookEl.className = 'book';
                // 3D Tilt Efekti Ayarları
                bookEl.setAttribute('data-tilt', '');
                bookEl.setAttribute('data-tilt-max', '15');
                bookEl.setAttribute('data-tilt-speed', '400');
                bookEl.setAttribute('data-tilt-glare', '');
                bookEl.setAttribute('data-tilt-max-glare', '0.3');

                // Tırnak işaretleri hatasını önlemek için encodeURIComponent kullanıyoruz
                const safeTitle = encodeURIComponent(title);
                const safeAuthor = encodeURIComponent(authors);
                const safeDesc = encodeURIComponent(description);
                
                bookEl.innerHTML = `
                    <button class="add-fav-btn ${heartClass}" onclick="toggleFavorite(event, '${id}', '${safeTitle}', '${safeAuthor}', '${img}')">
                        <i class="${heartIcon}"></i>
                    </button>
                    <div class="book-content" onclick="openModal('${safeTitle}', '${safeAuthor}', '${img}', '${safeDesc}', '${link}')">
                        <img src="${img}" alt="${title}">
                        <div class="book-info">
                            <h3>${title}</h3>
                            <p>${authors}</p>
                        </div>
                    </div>
                `;
                resultDiv.appendChild(bookEl);
            });

            VanillaTilt.init(document.querySelectorAll(".book"));
        })
        .catch(error => {
            console.error(error);
            resultDiv.innerHTML = '<p>Bir hata oluştu.</p>';
        });
}

// --- FAVORİ İŞLEMLERİ ---

function toggleFavorite(e, id, title, author, img) {
    e.stopPropagation(); // Kartın tıklanmasını engelle (Modal açılmasın)
    
    // Güvenli stringleri geri çevir
    title = decodeURIComponent(title);
    author = decodeURIComponent(author);

    const index = favorites.findIndex(f => f.id === id);
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');

    if (index === -1) {
        // Favoriye Ekle
        favorites.push({ id, title, author, img });
        btn.classList.add('active');
        icon.className = 'fas fa-heart';
        showToast("Favorilere eklendi ❤️", "success");
    } else {
        // Favoriden Çıkar
        favorites.splice(index, 1);
        btn.classList.remove('active');
        icon.className = 'far fa-heart';
        showToast("Favorilerden çıkarıldı 💔", "error");
    }

    saveFavorites();
}

function removeFavorite(id) {
    favorites = favorites.filter(f => f.id !== id);
    saveFavorites();
    // Eğer o an ekranda o kitap varsa kalbini boşalt
    searchBooksFromInput(); 
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavCount();
    renderFavorites();
}

function updateFavCount() {
    document.getElementById('fav-count').innerText = favorites.length;
}

function renderFavorites() {
    const container = document.getElementById('fav-list-container');
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Henüz favori kitap yok.</p>';
        return;
    }

    favorites.forEach(fav => {
        container.innerHTML += `
            <div class="fav-item">
                <img src="${fav.img}" alt="cover">
                <div class="fav-info">
                    <h4>${fav.title}</h4>
                    <p>${fav.author}</p>
                </div>
                <button class="remove-fav" onclick="removeFavorite('${fav.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('fav-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }
}

// --- DİĞER FONKSİYONLAR (Modal, Tema, Toast) ---

function openModal(title, author, img, desc, link) {
    document.getElementById('m-title').innerText = decodeURIComponent(title);
    document.getElementById('m-author').innerText = decodeURIComponent(author);
    document.getElementById('m-img').src = img;
    
    let description = decodeURIComponent(desc);
    description = description.length > 400 ? description.substring(0, 400) + '...' : description;
    document.getElementById('m-desc').innerText = description;
    
    document.getElementById('m-link').href = link;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(e) {
    if(!e || e.target.id === 'modal-overlay' || e.target.className === 'modal-close') {
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

function showToast(message, type) {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toast-msg");
    const icon = toast.querySelector('i');
    
    msg.innerText = message;
    toast.className = "show";
    
    if (type === 'error') {
        toast.style.backgroundColor = "#ff4757"; // Kırmızı
        icon.className = "fas fa-trash-alt";
    } else {
        toast.style.backgroundColor = "#2ed573"; // Yeşil
        icon.className = "fas fa-check-circle";
    }

    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

// Tema İşlemleri
function setTheme(theme) {
    const body = document.body;
    const lightBtn = document.getElementById('light-btn');
    const darkBtn = document.getElementById('dark-btn');
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        darkBtn.classList.add('active'); lightBtn.classList.remove('active');
        localStorage.setItem('selectedTheme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        lightBtn.classList.add('active'); darkBtn.classList.remove('active');
        localStorage.setItem('selectedTheme', 'light');
    }
}
function loadTheme() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved === 'dark') setTheme('dark'); else setTheme('light');
}
