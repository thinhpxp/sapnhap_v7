document.addEventListener('DOMContentLoaded', () => {
    // === PHÁT HIỆN NGÔN NGỮ HIỆN TẠI ===
    const currentLang = document.documentElement.lang || 'vi';
    const translations = window.translations || {};
    const t = (key, fallback = '') => translations[key] || fallback;

    // === KHÓA API (CHỈ DÀNH CHO MYSTERY BOX) ===
    const UNSPLASH_ACCESS_KEY = 'Ln1_SF9l3ee_fsc320rUZjfB5fgSVCZlMg2JbSdh_XY';

    // === DOM Elements ===
    const lookupBtn = document.getElementById('lookup-btn');
    const resultContainer = document.getElementById('result-container');
    const oldAddressDisplay = document.getElementById('old-address-display');
    const newAddressDisplay = document.getElementById('new-address-display');
    const notificationArea = document.getElementById('notification-area');
    const mysteryBox = document.getElementById('mystery-box');
    const spinner = mysteryBox ? mysteryBox.querySelector('.loading-spinner') : null;
    const modeToggle = document.getElementById('mode-toggle');
    const lookupDescription = document.getElementById('lookup-description');
    const provinceSelectEl = document.getElementById('province-select');
    const districtSelectEl = document.getElementById('district-select');
    const communeSelectEl = document.getElementById('commune-select');
    const newProvinceSelectEl = document.getElementById('new-province-select');
    const newCommuneSelectEl = document.getElementById('new-commune-select');
    // Element cho switch accent
    const accentToggleContainer = document.getElementById('accent-toggle-container');
    const accentToggle = document.getElementById('accent-toggle');
    const forwardControls = document.getElementById('forward-controls');
    const reverseControls = document.getElementById('reverse-controls');
     // THÊM MỚI: Các element cho nút và modal để xem địa chỉ hành chính
    const adminCenterActions = document.getElementById('admin-center-actions');
    const showAdminCentersBtn = document.getElementById('show-admin-centers-btn');
    const adminCenterModal = document.getElementById('admin-center-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBody = document.getElementById('modal-body');
    // Khung góp ý
    const feedbackInput = document.getElementById('feedback-input');
    const feedbackSendBtn = document.getElementById('feedback-send-btn');
    const feedbackMessage = document.getElementById('feedback-message');
    // Lịch sử sáp nhập
    const historyDisplay = document.getElementById('history-display');

    // === BIỂU TƯỢNG SVG ===
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
    const copiedIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;

    // === QUẢN LÝ TRẠNG THÁI ===
    let allProvincesData = [];
    let isReverseMode = false;
    let newWardCodeForModal = null; // THÊM MỚI: Biến để lưu mã xã mới cho modal
    let newProvinceCodeForModal = null;  // THÊM MỚI: Biến để lưu mã tỉnh mới cho modal
    let removeAccents = false; // Mặc định là TẮT (hiển thị có dấu)
    let provinceChoices, districtChoices, communeChoices;
    let newProvinceChoices, newCommuneChoices;

    // === CÁC HÀM TIỆN ÍCH ===
    function toNormalizedString(str) {
        if (!str) return '';
        str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function showNotification(message, type = 'loading') {
        if (notificationArea) {
            notificationArea.textContent = message;
            notificationArea.className = type;
            notificationArea.classList.remove('hidden');
        }
    }
    function hideNotification() {
        if (notificationArea) {
            notificationArea.classList.add('hidden');
            notificationArea.textContent = '';
        }
    }
    function updateChoices(choicesInstance, placeholder, data, valueKey = 'code', labelKey = 'name') {
        choicesInstance.clearStore();
        choicesInstance.setChoices(
            [{ value: '', label: placeholder, selected: true, disabled: true }, ...data.map(item => ({ value: item[valueKey], label: item[labelKey] }))],
            'value', 'label', false
        );
    }
    function resetChoice(choicesInstance, placeholder) {
        choicesInstance.clearStore();
        choicesInstance.setChoices([{ value: '', label: placeholder, selected: true, disabled: true }], 'value', 'label', false);
        choicesInstance.disable();
    }

    // === HÀM DỊCH THUẬT & BẢN ĐỊA HÓA ===
    function applyTranslations() {
        // Dịch nội dung text (innerHTML)
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            el.innerHTML = t(key, el.innerHTML);
        });

        // === THÊM MỚI: Dịch các thuộc tính placeholder ===
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = t(key);
            if (translation) {
                el.setAttribute('placeholder', translation);
            }
        });

        // Cập nhật các thuộc tính meta và title
        document.title = t('pageTitle', "Tra Cứu Sáp Nhập");
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl) descEl.setAttribute('content', t('pageDescription'));
    }

    // Hàm quyết định hiển thị tên nào dựa trên ngôn ngữ và trạng thái switch
    function localize(name, en_name) {
        if (currentLang === 'en') {
            return removeAccents ? (en_name || toNormalizedString(name)) : name;
        }
        return name;
    }

    // === CÁC HÀM KHỞI TẠO & GIAO DIỆN ===
    function initialize() {
        applyTranslations();

        if (currentLang === 'en' && accentToggleContainer && accentToggle) {
            accentToggleContainer.classList.remove('hidden');
            accentToggle.checked = removeAccents; // Cập nhật trạng thái switch
        }

        const choicesConfig = { searchEnabled: true, itemSelectText: t('selectChoice', 'Chọn'), removeItemButton: true };

        // Hủy các instance cũ nếu có để tránh lỗi "already initialised"
        if(provinceChoices) provinceChoices.destroy();
        if(districtChoices) districtChoices.destroy();
        if(communeChoices) communeChoices.destroy();
        if(newProvinceChoices) newProvinceChoices.destroy();
        if(newCommuneChoices) newCommuneChoices.destroy();
        // Xử lý lịch sử
        if (window.allProvincesData && window.allProvincesData.length > 0) {
            updateChoices(provinceChoices, t('oldProvincePlaceholder'), localizedOldData);
        } else {
            showNotification(t('errorLoadOldData'), "error");
        }

        provinceChoices = new Choices(provinceSelectEl, { ...choicesConfig });
        districtChoices = new Choices(districtSelectEl, { ...choicesConfig });
        communeChoices = new Choices(communeSelectEl, { ...choicesConfig });
        newProvinceChoices = new Choices(newProvinceSelectEl, { ...choicesConfig });
        newCommuneChoices = new Choices(newCommuneSelectEl, { ...choicesConfig });

        resetChoice(districtChoices, t('oldDistrictPlaceholder'));
        resetChoice(communeChoices, t('oldCommunePlaceholder'));
        resetChoice(newCommuneChoices, t('newCommunePlaceholder'));

        addEventListeners();
        loadOldDataDropdowns(); //Gọi địa chỉ mới
        loadNewProvincesDropdown(); //Gọi địa chỉ cũ
        // gọi hàm hiển thị lượt tra cứu GOOGLE ANALYTICS
        displayEventCount();
        setInterval(displayEventCount, 30000);
        // GỌI HÀM HIỂN THỊ GOOGLE REAL TIME
        displayRealtimeLocations(); // Hàm mới
        // Tự động làm mới sau mỗi 60 giây
        setInterval(displayRealtimeLocations, 75000);
        setTimeout(() => {
            loadInitialData();
        }, 0);
    }

     // THÊM MỚI: Hàm riêng để tải dữ liệu ban đầu
    function loadInitialData() {
        if (window.allProvincesData && window.allProvincesData.length > 0) {
            window.allProvincesData.sort((a, b) => a.code - b.code);
            updateChoices(provinceChoices, t('oldProvincePlaceholder'), window.allProvincesData);
        } else {
            showNotification(t('errorLoadOldData', "Lỗi tải dữ liệu cũ."), "error");
        }

        resetChoice(districtChoices, t('oldDistrictPlaceholder'));
        resetChoice(communeChoices, t('oldCommunePlaceholder'));
        resetChoice(newCommuneChoices, t('newCommunePlaceholder'));

        loadNewProvincesDropdown();
        displayEventCount();
        displayRealtimeLocations();
        setInterval(displayRealtimeLocations, 90000);
    }
    // THÊM MỚI: Hàm tải dữ liệu cho dropdown Cũ
    async function loadOldDataDropdowns() {
        resetChoice(provinceChoices, t('oldProvinceLoading', 'Đang tải tỉnh/thành...'));
        try {
            const response = await fetch('/api/get-old-data');
            if(!response.ok) throw new Error(t('errorLoadOldData'));

            allProvincesData = await response.json(); // Lưu dữ liệu vào biến cục bộ

            const localizedOldData = allProvincesData.map(province => ({
                ...province,
                name: localize(province.name, null),
                districts: province.districts.map(district => ({
                    ...district,
                    name: localize(district.name, null),
                    wards: district.wards.map(ward => ({ ...ward, name: localize(ward.name, null) }))
                }))
            }));

            updateChoices(provinceChoices, t('oldProvincePlaceholder'), localizedOldData);
            provinceChoices.enable();

        } catch (error) {
            console.error(error);
            resetChoice(provinceChoices, t('errorLoadOldData'));
            showNotification(error.message, 'error');
        }
    }


    async function loadNewProvincesDropdown() {
        resetChoice(newProvinceChoices, t('newProvinceLoading'));
        try {
            const response = await fetch('/api/get-new-provinces');
            if(!response.ok) throw new Error(t('errorFetchNewProvinces'));
            let data = await response.json();
            const localizedData = data.map(province => ({
                ...province,
                name: localize(province.name, province.en_name)
            }));
            updateChoices(newProvinceChoices, t('newProvincePlaceholder'), localizedData, 'province_code', 'name');
            newProvinceChoices.enable();
        } catch (error) {
            console.error(error);
            resetChoice(newProvinceChoices, t('newProvinceError'));
        }
    }

    function toggleLookupUI() {
        isReverseMode = modeToggle.checked;
        forwardControls.classList.toggle('hidden', isReverseMode);
        reverseControls.classList.toggle('hidden', !isReverseMode);
        resultContainer.classList.add('hidden');
        lookupBtn.disabled = true;
        lookupDescription.textContent = isReverseMode
            ? t('lookupDescriptionNewToOld')
            : t('lookupDescriptionOldToNew');
    }

    // === LẮNG NGHE SỰ KIỆN ===
    function addEventListeners() {
        if(modeToggle) modeToggle.addEventListener('change', toggleLookupUI);
        if(lookupBtn) lookupBtn.addEventListener('click', () => {
            if (isReverseMode) handleReverseLookup();
            else handleForwardLookup();
        });
        if (mysteryBox) mysteryBox.addEventListener('click', fetchRandomImage);
        if(resultContainer) resultContainer.addEventListener('click', handleCopy);

        if (accentToggle) {
            accentToggle.addEventListener('change', () => {
                removeAccents = accentToggle.checked;
                initialize(); // Khởi tạo lại toàn bộ giao diện
            });
        }

        if(provinceSelectEl) provinceSelectEl.addEventListener('choice', (event) => {
            const selectedProvince = allProvincesData.find(p => p.code == event.detail.value);
            if (selectedProvince && selectedProvince.districts) {
                const localizedDistricts = selectedProvince.districts.map(d => ({...d, name: localize(d.name, null)}));
                updateChoices(districtChoices, t('oldDistrictPlaceholder'), localizedDistricts);
            }
            districtChoices.enable();
            resetChoice(communeChoices, t('oldCommunePlaceholder'));
            lookupBtn.disabled = true;
        });
        if(districtSelectEl) districtSelectEl.addEventListener('choice', (event) => {
            const provinceCode = provinceChoices.getValue(true);
            const selectedProvince = allProvincesData.find(p => p.code == provinceCode);
            const selectedDistrict = selectedProvince?.districts.find(d => d.code == event.detail.value);
            if (selectedDistrict && selectedDistrict.wards) {
                const localizedWards = selectedDistrict.wards.map(w => ({...w, name: localize(w.name, null)}));
                updateChoices(communeChoices, t('oldCommunePlaceholder'), localizedWards);
            }
            communeChoices.enable();
            lookupBtn.disabled = true;
        });
        if(communeSelectEl) communeSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });

        if(newProvinceSelectEl) newProvinceSelectEl.addEventListener('choice', async (event) => {
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            resetChoice(newCommuneChoices, t('newCommuneLoading'));
            lookupBtn.disabled = true;
            try {
                const response = await fetch(`/api/get-new-wards?province_code=${provinceCode}`);
                if(!response.ok) throw new Error(t('newCommuneError'));
                let data = await response.json();
                const localizedData = data.map(ward => ({
                    ...ward,
                    name: localize(ward.name, ward.en_name)
                }));
                updateChoices(newCommuneChoices, t('newCommunePlaceholder'), localizedData, 'ward_code', 'name');
                newCommuneChoices.enable();
            } catch (error) {
                console.error(error);
                resetChoice(newCommuneChoices, t('newCommuneError'));
                showNotification(error.message, 'error');
            }
        });
        if(newCommuneSelectEl) newCommuneSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });

        // === THÊM MỚI: Các sự kiện cho nút và modal ===
        if (showAdminCentersBtn) {
            showAdminCentersBtn.addEventListener('click', handleShowAdminCenters);
        }
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }
        if (adminCenterModal) {
            // Đóng modal khi click vào lớp phủ bên ngoài
            adminCenterModal.addEventListener('click', (event) => {
                if (event.target === adminCenterModal) {
                    closeModal();
                }
            });
        }
         // === THÊM MỚI: Lắng nghe sự kiện cho form Góp ý ===
        if (feedbackSendBtn) {
            feedbackSendBtn.addEventListener('click', handleSubmitFeedback);
        }
        if (feedbackInput) {
            // Cho phép gửi bằng phím Enter
            feedbackInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    handleSubmitFeedback();
                }
            });
        }
    }

   // === LOGIC TRA CỨU CHÍNH ===
     async function handleForwardLookup() {
     // === KHAI BÁO BIẾN ===
        const selectedProvince = provinceChoices.getValue(true);
        const selectedDistrict = districtChoices.getValue(true);
        const selectedCommune = communeChoices.getValue(true);
        const selectedCommune = communeChoices.getValue();
        // =================================================
        if (!selectedCommune || !selectedCommune.value) {
            alert(t('alertSelectOldCommune'));
            return;
        }

        const initialOldWardCode = selectedCommune.value;
        const fullOldAddress = `${selectedCommune.label}, ${districtChoices.getValue().label}, ${provinceChoices.getValue().label}`;
         // === GHI CHÚ THAY ĐỔI: Hiển thị mã code cũ ngay từ đầu ===
        const oldCodes = `${selectedCommune}, ${selectedDistrict}, ${selectedProvince}`;
        let oldAddressHtml = `<div class="address-line"><p><span class="label">${t('oldAddressLabel')}</span> ${fullOldAddress}</p></div>
            <div class="address-codes"><span class="label">Old Code:</span> ${oldCodes}</div>`;

        // Dọn dẹp giao diện
        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('oldAddressLabel')}</span> ${fullOldAddress}</p></div>`;
        newAddressDisplay.innerHTML = `<p>${t('lookingUp')}</p>`;
        if (historyDisplay) historyDisplay.classList.add('hidden');
        if (adminCenterActions) adminCenterActions.classList.add('hidden');
        resultContainer.classList.remove('hidden');

        // GHI CHÚ CỐT LÕI: Bắt đầu quá trình "truy vết" lịch sử
        try {
            let historyChain = [];
            let currentCode = initialOldWardCode;
            let finalResults = [];
            let finalUnitData = null; // Dùng để lưu thông tin đơn vị cuối cùng

            // Vòng lặp để đi theo chuỗi sáp nhập (ví dụ: A -> AA -> AAA)
            while (true) {
                const response = await fetch(`/api/lookup-forward?code=${currentCode}`);
                const events = await response.json();
                if (!response.ok) throw new Error(events.error || 'Server error');

                // Điều kiện dừng 1: Không còn sự kiện nào
                if (events.length === 0) {
                    if (historyChain.length > 0) {
                        finalUnitData = historyChain[historyChain.length - 1];
                    }
                    break;
                }

                const event = events[0];

                // Điều kiện dừng 2: Gặp sự kiện chia tách
                if (event.event_type === 'SPLIT_MERGE') {
                    finalResults = events;
                    break;
                }

                // === GHI CHÚ SỬA LỖI: Điều kiện dừng 3 - Chống kẹt vòng lặp ===
                // Nếu mã mới trả về giống hệt mã hiện tại, có nghĩa là đã đến điểm cuối.
                if (event.new_ward_code === currentCode) {
                    finalUnitData = event;
                    break;
                }
                // ==========================================================

                // Nếu là sáp nhập đơn giản, thêm vào chuỗi lịch sử và tiếp tục
                historyChain.push(event);
                currentCode = event.new_ward_code;
            }

            // GHI CHÚ: Bắt đầu hiển thị kết quả dựa trên những gì đã tìm được
            // 1. Hiển thị Lịch sử (nếu có)
            if (historyChain.length > 0) {
                const historyHtml = historyChain.map(event => {
                    const date = event.change_date ? new Date(event.change_date).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US') : 'N/A';
                    return `<li>${t('historyEntry').replace('{date}', date).replace('{from}', event.old_ward_name).replace('{to}', event.new_ward_name)}</li>`;
                }).join('');
                historyDisplay.innerHTML = `<h4>${t('historyTitle')}</h4><ul>${historyHtml}</ul>`;
                historyDisplay.classList.remove('hidden');
            }

            // 2. Hiển thị Kết quả Cuối cùng
            if (finalResults.length > 0) {
                // Trường hợp CHIA TÁCH
                const splitHtml = finalResults.map(result => {
                    const newAddress = `${result.new_ward_name}, ${result.new_province_name}`;
                    // === GHI CHÚ THAY ĐỔI: Thêm mã code mới cho từng phần chia tách ===
                    const newCodes = `${result.new_ward_code}, ${result.new_province_code}`;
                    return `
                        <li>
                            <b>${result.split_description}:</b> ${t('mergedInto')} <b>${newAddress}</b>
                            <div class="address-codes"><span class="label">New Code:</span> ${newCodes}</div>
                        </li>`;
                }).join('');
                newAddressDisplay.innerHTML = `<p class="split-case-note">${t('splitCaseNote')}</p><ul class="split-results-list">${splitHtml}</ul>`;
            } else if (finalUnitData) {
                // Trường hợp sáp nhập có ĐÍCH ĐẾN
                const newAddressForDisplay = `${finalUnitData.new_ward_name}, ${finalUnitData.new_province_name}`;
                // === GHI CHÚ THAY ĐỔI: Hiển thị mã code mới ===
                const newCodes = `${finalUnitData.new_ward_code}, ${finalUnitData.new_province_code}`;
                const newAddressForCopy = `${newAddressForDisplay} (Codes: ${newCodes})`;
                let resultsHtml = `
                    <div class="address-line">
                        <p><span class="label">${t('newAddressLabel')}</span> ${newAddressForDisplay}</p>
                        <button class="copy-btn" title="Copy" data-copy-text="${newAddressForCopy}">${copyIconSvg}</button>
                    </div>
                    <div class="address-codes"><span class="label">New Code:</span> ${newCodes}</div>`;
                newAddressDisplay.innerHTML = resultsHtml;
                // Kích hoạt nút xem địa chỉ TTHC
                newWardCodeForModal = finalUnitData.new_ward_code;
                newProvinceCodeForModal = finalUnitData.new_province_code;
                if (adminCenterActions) adminCenterActions.classList.remove('hidden');
            } else {
                // Trường hợp KHÔNG THAY ĐỔI
                newAddressDisplay.innerHTML = `<p class="no-change">${t('noChangeMessage')}</p>`;
            }
          }
            catch (error) {
            console.error('Lỗi khi tra cứu xuôi:', error);
            newAddressDisplay.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function handleReverseLookup() {
        const selectedNewProvince = newProvinceChoices.getValue();
        const selectedNewCommune = newCommuneChoices.getValue();
        if (!selectedNewCommune || !selectedNewCommune.value) {
             alert(t('alertSelectNewCommune'));
             return;
        }
        const newWardCode = selectedNewCommune.value;
        const fullNewAddress = `${selectedNewCommune.label}, ${selectedNewProvince.label}`;

        oldAddressDisplay.innerHTML = '';
        newAddressDisplay.innerHTML = `<p>${t('lookingUp')}</p>`;
        if (historyDisplay) historyDisplay.classList.add('hidden'); // Ẩn lịch sử cũ
        if (adminCenterActions) adminCenterActions.classList.add('hidden'); // Ẩn nút hành chính
        resultContainer.classList.remove('hidden');
        // Reset biến trạng thái
        newWardCodeForModal = null;
        newProvinceCodeForModal = null;

        try {
            const response = await fetch(`/api/lookup-reverse?code=${newWardCode}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error');

            if (data.length > 0) {
                // Hiển thị thông tin địa chỉ mới (phần trên)
                const newCodesReverse = `${data[0].new_ward_code}, ${data[0].new_province_code}`;
                const newAddressForCopy = `${fullNewAddress} (Codes: ${newCodesReverse})`;
                let newAddressHtml = `
                    <div class="address-line">
                        <p><span class="label">${t('newAddressLabel').replace(':', '')}</span> ${fullNewAddress}</p>
                        <button class="copy-btn" title="Copy" data-copy-text="${newAddressForCopy}">${copyIconSvg}</button>
                    </div>
                    <div class="address-codes"><span class="label">New Code:</span> ${newCodesReverse}</div>`;
                oldAddressDisplay.innerHTML = newAddressHtml;

                // Xây dựng danh sách các đơn vị cũ
                const oldUnitsFullAddresses = data.map(record => {
                    // GHI CHÚ: Logic hiển thị giờ đây đơn giản hơn.
                    // Chúng ta chỉ cần hiển thị thông tin từ bản ghi sự kiện.
                    let noteHtml = '';
                    if (record.event_type === 'SPLIT_MERGE' && record.split_description) {
                         noteHtml = `<div class="split-context-note">${record.split_description}</div>`;
                    }
                    const ward = record.old_ward_name;
                    const district = record.old_district_name;
                    const province = record.old_province_name;
                    // === GHI CHÚ THAY ĐỔI: Hiển thị mã code cũ ===
                    const oldCodes = `${record.old_ward_code}, ${record.old_district_code}, ${record.old_province_code}`;
                    return `
                        <li>
                            ${ward}, ${district}, ${province}
                            <div class="address-codes"><span class="label">Old Code:</span> ${oldCodes}</div>
                            ${noteHtml}
                        </li>`;
                }).join('');
                newAddressDisplay.innerHTML = `<p class="label">${t('mergedFromLabel')}</p><ul class="old-units-list">${oldUnitsFullAddresses}</ul>`;
                newWardCodeForModal = data[0].new_ward_code;
                newProvinceCodeForModal = data[0].new_province_code;
                if (adminCenterActions) adminCenterActions.classList.remove('hidden');
            } else {
                oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('newAddressLabel').replace(':', '')}</span> ${fullNewAddress}</p></div>`;
                newAddressDisplay.innerHTML = `<p class="no-change">${t('noDataFoundMessage')}</p>`;
            }
        } catch (error) {
             console.error('Lỗi khi tra cứu ngược:', error);
             oldAddressDisplay.innerHTML = '';
             newAddressDisplay.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    // === THÊM MỚI: Hàm xử lý gửi Góp ý ===
    async function handleSubmitFeedback() {
        if (!feedbackInput || !feedbackSendBtn || !feedbackMessage) return;

        const message = feedbackInput.value.trim();
        if (message.length === 0) {
            return; // Không làm gì nếu input rỗng
        }
        // GHI CHÚ THAY ĐỔI: Bắt đầu thu thập ngữ cảnh
        const context = {};

        // Xác định chế độ tra cứu hiện tại
        context.mode = isReverseMode ? 'Tra cứu ngược' : 'Tra cứu xuôi';

        // Lấy thông tin từ các dropdown đang được chọn
        if (isReverseMode) {
            const newProvince = newProvinceChoices.getValue();
            if (newProvince) {
                context.province = { code: newProvince.value, name: newProvince.label };
            }
        } else {
            const oldProvince = provinceChoices.getValue();
            if (oldProvince) {
                context.province = { code: oldProvince.value, name: oldProvince.label };
            }
            const oldDistrict = districtChoices.getValue();
            if (oldDistrict) {
                context.district = { code: oldDistrict.value, name: oldDistrict.label };
            }
        }// Kết thúc thu thập ngữ cảnh
        // Vô hiệu hóa form để tránh gửi nhiều lần
        feedbackSendBtn.disabled = true;
        feedbackInput.disabled = true;
        feedbackSendBtn.textContent = '...';

        try {
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message, context: context }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Lỗi không xác định');
            }

            // Hiển thị thông báo thành công
            feedbackMessage.textContent = t('feedbackSuccess', 'Gửi thành công!');
            feedbackMessage.className = 'success';
            feedbackMessage.classList.remove('hidden');
            feedbackInput.value = ''; // Xóa nội dung input

        } catch (error) {
            console.error('Lỗi khi gửi góp ý:', error);
            // Hiển thị thông báo lỗi
            feedbackMessage.textContent = t('feedbackError', 'Gửi thất bại.');
            feedbackMessage.className = 'error';
            feedbackMessage.classList.remove('hidden');
        } finally {
            setTimeout(() => {
                feedbackSendBtn.disabled = false;
                feedbackInput.disabled = false;
                feedbackSendBtn.textContent = t('feedbackSendBtn', 'Gửi');
                feedbackMessage.classList.add('hidden');
            }, 4000);
        }
    }

    // === HÀM PHỤ TRỢ KHÁC ===
    function handleCopy(event) {
        const button = event.target.closest('.copy-btn');
        if (!button) return;
        const textToCopy = button.dataset.copyText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.innerHTML = copiedIconSvg;
            button.classList.add('copied');
            button.disabled = true;
            setTimeout(() => {
                button.innerHTML = copyIconSvg;
                button.classList.remove('copied');
                button.disabled = false;
            }, 2000);
        }).catch(err => { console.error('Lỗi khi copy: ', err); });
    }
    // Tải ảnh ngẩu nhiên từ unsplash và hiển thị trong mysteryBox ở giao diện tiếng Anh
    async function fetchRandomImage() {
        if (!mysteryBox || !spinner) return;
        spinner.classList.remove('hidden');
        mysteryBox.classList.add('loading-state');
        const oldImg = mysteryBox.querySelector('img');
        if (oldImg) oldImg.style.opacity = '0.3';

        const apiUrl = `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}&query=vietnam&orientation=portrait`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Unsplash API error');
            const data = await response.json();
            const newImage = new Image();
            newImage.src = data.urls.regular;
            newImage.alt = data.alt_description || "Random image from Unsplash";
            newImage.style.opacity = '0';
            newImage.onload = () => {
                mysteryBox.innerHTML = '';
                mysteryBox.appendChild(newImage);
                setTimeout(() => { newImage.style.opacity = '1'; }, 50);
                mysteryBox.classList.remove('loading-state');
            };
            newImage.onerror = () => { throw new Error("Could not load image file."); }
        } catch (error) {
            console.error("Error fetching image:", error);
            mysteryBox.innerHTML = `<p style="color: red; font-size: 0.9em;">Could not load image.</p>`;
        }
    }
    // Hiển thị lượt tra cứu từ GOOGLE ANALYTICS
    async function displayEventCount() {
        const counterElement = document.getElementById('event-counter');
        if (!counterElement) return;

        try {
            const response = await fetch('/api/get-event-count');
            if (!response.ok) throw new Error('Failed to fetch event count');
            const data = await response.json();

            if (data.totalClicks) {
                // Sử dụng toLocaleString để định dạng số cho đẹp
                const formattedCount = data.totalClicks.toLocaleString(currentLang === 'vi' ? 'vi-VN' : 'en-US');
                // Kết hợp số và nhãn đã dịch
                counterElement.textContent = `${formattedCount} ${t('realtimeTotalLookups', 'lượt tra cứu')}`;
            }
        } catch (error) {
            console.error("Không thể hiển thị số lượt tra cứu:", error);
            counterElement.textContent = `N/A ${t('realtimeTotalLookups', 'lượt tra cứu')}`;
        }
    }

    // Lấy và hiển thị dữ liệu người truy cập thời gian thực GOOGLE ANALYTICS
    async function displayRealtimeLocations() {
        const listElement = document.getElementById('realtime-locations-list');
        const totalUsersElement = document.getElementById('realtime-total-users');
        if (!listElement || !totalUsersElement) return;

        const oldContent = listElement.innerHTML;
        // Chỉ hiển thị "Đang tải..." lần đầu tiên
        if (listElement.children.length === 0 || !listElement.textContent.includes(t('realtimeLoading', 'Đang tải...'))) {
            listElement.innerHTML = `<li>${t('realtimeLoading', 'Đang tải...')}</li>`;
        }

        try {
            const response = await fetch('/api/get-realtime-locations');
            if (!response.ok) throw new Error('Failed to fetch realtime locations');
            const data = await response.json();

            if (data.totalActiveUsers !== undefined) {
                const formattedTotal = data.totalActiveUsers.toLocaleString(currentLang === 'vi' ? 'vi-VN' : 'en-US');
                totalUsersElement.textContent = `${formattedTotal} ${t('realtimeTotalUsers', 'người dùng trực tuyến')}`;
            }

            if (data.activeLocations && data.activeLocations.length > 0) {
                listElement.innerHTML = '';
                data.activeLocations.forEach(location => {
                    const li = document.createElement('li');
                    const translatedCity = t(`city_${location.city.toLowerCase().replace(/ /g, '_')}`, location.city);
                    let locationDisplay = translatedCity;
                    if (location.country && location.country !== 'Vietnam') {
                        const translatedCountry = t(`country_${location.country.toLowerCase().replace(/ /g, '_')}`, location.country);
                        locationDisplay = `${translatedCity} - ${translatedCountry}`;
                    }
                    const userText = t('realtimeUserFrom', '{count} người dùng từ').replace('{count}', location.count);
                    li.innerHTML = `${userText} <strong>${locationDisplay}</strong>`;
                    listElement.appendChild(li);
                });
            } else {
                listElement.innerHTML = `<li>${t('realtimeNoActivity', 'Chưa có hoạt động nào gần đây.')}</li>`;
            }
        } catch (error) {
            console.error("Không thể hiển thị hoạt động thời gian thực:", error);
            listElement.innerHTML = oldContent || `<li>${t('realtimeError', 'Không thể tải dữ liệu.')}</li>`;
        }
    }

    //Các hàm chức năng Xem địa chỉ hành chính
    function openModal() {
        if (adminCenterModal) {
            adminCenterModal.classList.remove('hidden');
        }
    }

    function closeModal() {
        if (adminCenterModal) {
            adminCenterModal.classList.add('hidden');
        }
    }

    async function handleShowAdminCenters() {
         // GHI CHÚ THAY ĐỔI: Kiểm tra cả hai mã code cần thiết trước khi tiếp tục.
        // Biến newWardCodeForModal và newProvinceCodeForModal sẽ được gán trong các hàm tra cứu.
        if (!newWardCodeForModal || !newProvinceCodeForModal) {
            console.error("Thiếu mã xã hoặc tỉnh để tra cứu trung tâm hành chính.");
            return;
        }

        openModal();
        modalBody.innerHTML = `<p>${t('loading', 'Đang tải...')}</p>`;

        try {
            // GHI CHÚ THAY ĐỔI: Gọi API với cả hai tham số ward_code và province_code.
            const response = await fetch(`/api/get-admin-centers?ward_code=${newWardCodeForModal}&province_code=${newProvinceCodeForModal}`);

            if (!response.ok) throw new Error('Could not fetch administrative centers.');
            const data = await response.json();

            if (data.length > 0) {
                    const listHtml = data.map(item => {
                    // === GHI CHÚ THAY ĐỔI: Sử dụng hàm t() để dịch agency_type ===
                    // 1. Xây dựng khóa dịch, ví dụ: "agency_ubnd"
                    const translationKey = `agency_${item.agency_type.toLowerCase()}`;
                    // 2. Dùng hàm t() để lấy bản dịch.
                    //    Nếu không có, dùng lại giá trị gốc và viết hoa chữ cái đầu.
                    const fallbackName = item.agency_type.charAt(0).toUpperCase() + item.agency_type.slice(1);
                    const agencyName = t(translationKey, fallbackName);
                    // ==========================================================
                    return `
                        <li>
                            <span class="agency-type">${agencyName}</span>
                            <span class="agency-address">${item.address}</span>
                        </li>
                    `;
                }).join('');
                modalBody.innerHTML = `<ul>${listHtml}</ul>`;
            } else {
                modalBody.innerHTML = `<p>${t('noAdminCenterData', 'Không có dữ liệu.')}</p>`;
            }

        } catch (error) {
            console.error("Lỗi khi lấy địa chỉ TTHC:", error);
            modalBody.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    // --- KHỞI CHẠY ỨNG DỤNG ---
    initialize();
});