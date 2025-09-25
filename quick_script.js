// /public/quick_script.js - Logic cho Giao diện Tra cứu Nhanh

// GHI CHÚ: Toàn bộ mã nguồn được bọc trong một hàm IIFE (Immediately Invoked Function Expression)
// để tránh làm ô nhiễm không gian tên toàn cục (window).
(() => {
    // === KHAI BÁO BIẾN VÀ DOM ELEMENTS ===
    const quickSearchInterface = document.getElementById('quick-search-interface');
    const quickSearchOldInput = document.getElementById('quick-search-old-input');
    const quickSearchNewInput = document.getElementById('quick-search-new-input');
    const oldResultsContainer = document.getElementById('quick-search-old-results');
    const newResultsContainer = document.getElementById('quick-search-new-results');
    const resultContainer = document.getElementById('result-container');
    const oldAddressDisplay = document.getElementById('old-address-display');
    const newAddressDisplay = document.getElementById('new-address-display');
    const historyDisplay = document.getElementById('history-display');
    const adminCenterActions = document.getElementById('admin-center-actions');

    // Lấy các hàm và biến cần thiết từ script.js chính (nếu chúng đã được khai báo trên window)
    // Hoặc chúng ta có thể định nghĩa lại các hàm nhỏ cần thiết ở đây.
    const t = window.translations ? (key, fallback = '') => window.translations[key] || fallback : (key, fallback) => fallback;
    const copyIconSvg = `<svg ... >...</svg>`; // Bạn có thể copy lại SVG từ script.js

    let debounceTimer;

    // === HÀM DEBOUNCE ===
    // GHI CHÚ: Hàm này dùng để trì hoãn việc gọi API. Nó sẽ chỉ thực thi
    // hàm `func` sau khi người dùng đã ngừng gõ trong `delay` mili giây.
    function debounce(func, delay = 300) {
        return function(...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // === HÀM XỬ LÝ TÌM KIẾM ===
    async function handleQuickSearch(event) {
        const input = event.target;
        const term = input.value.trim();
        const type = input.id === 'quick-search-old-input' ? 'old' : 'new';
        const resultsContainer = type === 'old' ? oldResultsContainer : newResultsContainer;
        const spinner = input.nextElementSibling;

        // Xóa kết quả cũ và ẩn đi
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('hidden');

        if (term.length < 2) {
            return; // Không tìm kiếm nếu từ khóa quá ngắn
        }

        spinner.classList.remove('hidden');

        try {
            const apiUrl = type === 'old' ? `/api/quick-search-old?term=${term}` : `/api/quick-search-new?term=${term}`;
            const response = await fetch(apiUrl);
            const results = await response.json();

            if (results.length > 0) {
                displaySearchResults(results, resultsContainer, type);
            } else {
                resultsContainer.innerHTML = `<li>${t('noResultsFound', 'Không tìm thấy kết quả.')}</li>`;
                resultsContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error(`Lỗi khi tìm kiếm ${type}:`, error);
            resultsContainer.innerHTML = `<li>${t('searchError', 'Lỗi khi tìm kiếm.')}</li>`;
            resultsContainer.classList.remove('hidden');
        } finally {
            spinner.classList.add('hidden');
        }
    }

    // === HÀM HIỂN THỊ KẾT QUẢ TÌM KIẾM ===
    function displaySearchResults(results, container, type) {
        container.innerHTML = '';
        results.forEach(result => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="result-name">${result.name}</span>
                <span class="result-context">${result.context}</span>
            `;
            // Gán dữ liệu vào element để sử dụng khi click
            li.dataset.code = result.code;
            li.dataset.type = type;
            li.addEventListener('click', handleResultClick);
            container.appendChild(li);
        });
        container.classList.remove('hidden');
    }

    // === HÀM XỬ LÝ KHI CLICK VÀO MỘT KẾT QUẢ ===
    async function handleResultClick(event) {
        const li = event.currentTarget;
        const code = li.dataset.code;
        const type = li.dataset.type;

        // Ẩn danh sách kết quả
        oldResultsContainer.classList.add('hidden');
        newResultsContainer.classList.add('hidden');

        // Hiển thị loading trong khung kết quả chính
        resultContainer.classList.remove('hidden');
        oldAddressDisplay.innerHTML = '';
        newAddressDisplay.innerHTML = `<p>${t('lookingUp')}</p>`;
        if (historyDisplay) historyDisplay.classList.add('hidden');
        if (adminCenterActions) adminCenterActions.classList.add('hidden');

        try {
            const response = await fetch(`/api/get-details?code=${code}&type=${type}`);
            const data = await response.json();

            // GHI CHÚ: Tái sử dụng logic hiển thị từ script.js
            // Đây là một ví dụ, bạn có thể tạo một hàm render chung để cả 2 script cùng gọi
            if (type === 'old') {
                // Nếu tìm theo xã cũ, kết quả sẽ là tra cứu xuôi
                // Chúng ta có thể gọi lại hàm render của `handleForwardLookup` nếu nó được đưa ra global
                // Tạm thời, chúng ta sẽ render trực tiếp ở đây
                renderForwardLookupResult(data, {code: code, label: li.querySelector('.result-name').textContent});
            } else {
                // Nếu tìm theo xã mới, kết quả là tra cứu ngược
                renderReverseLookupResult(data, {code: code, label: li.querySelector('.result-name').textContent});
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết:', error);
            newAddressDisplay.innerHTML = `<p class="error">${t('detailsError', 'Lỗi khi lấy chi tiết.')}</p>`;
        }
    }

    // === CÁC HÀM RENDER KẾT QUẢ CHI TIẾT ===
    // GHI CHÚ: Chúng ta tách logic render ra để tái sử dụng
    function renderForwardLookupResult(events, oldCommune) {
        // ... (Copy và điều chỉnh logic hiển thị từ hàm handleForwardLookup của script.js)
        // Ví dụ:
        const fullOldAddress = oldCommune.label; // Cần thêm thông tin huyện/tỉnh nếu muốn đầy đủ
        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('oldAddressLabel')}</span> ${fullOldAddress}</p></div>`;

        if (events.length === 0) {
            newAddressDisplay.innerHTML = `<p class="no-change">${t('noChangeMessage')}</p>`;
        } else if (events.length > 1 || events[0].event_type === 'SPLIT_MERGE') {
            const splitHtml = events.map(result => `<li>...</li>`).join('');
            newAddressDisplay.innerHTML = `<p class="split-case-note">${t('splitCaseNote')}</p><ul>${splitHtml}</ul>`;
        } else {
            const finalUnitData = events[0];
            const newAddress = `${finalUnitData.new_ward_name}, ${finalUnitData.new_province_name}`;
            newAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('newAddressLabel')}</span> ${newAddress}</p></div>`;
        }
    }

    function renderReverseLookupResult(events, newCommune) {
        // ... (Copy và điều chỉnh logic hiển thị từ hàm handleReverseLookup của script.js)
        const fullNewAddress = newCommune.label;
        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('newAddressLabel').replace(':','')}</span> ${fullNewAddress}</p></div>`;

        if (events.length > 0) {
            const oldUnitsHtml = events.map(record => `<li>${record.old_ward_name}, ${record.old_district_name}, ${record.old_province_name}</li>`).join('');
            newAddressDisplay.innerHTML = `<p class="label">${t('mergedFromLabel')}</p><ul>${oldUnitsHtml}</ul>`;
        } else {
            newAddressDisplay.innerHTML = `<p class="no-change">${t('noDataFoundMessage')}</p>`;
        }
    }


    // === HÀM KHỞI TẠO CHÍNH ===
    function initializeQuickSearch() {
        if (!quickSearchOldInput || !quickSearchNewInput) return;

        // Gán sự kiện 'input' với hàm debounce
        quickSearchOldInput.addEventListener('input', debounce(handleQuickSearch, 300));
        quickSearchNewInput.addEventListener('input', debounce(handleQuickSearch, 300));

        console.log("Giao diện Tra cứu Nhanh đã được khởi tạo.");
    }

    // Gán hàm khởi tạo vào window để script.js có thể gọi nó
    window.initializeQuickSearch = initializeQuickSearch;

    // Nếu giao diện đã hiển thị sẵn (trường hợp người dùng F5), tự khởi tạo
    if (quickSearchInterface && !quickSearchInterface.classList.contains('hidden')) {
        initializeQuickSearch();
    }

})();