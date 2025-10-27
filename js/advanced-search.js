// 고급 검색 및 필터링 시스템

class AdvancedSearchManager {
    constructor(app) {
        this.app = app;
        this.searchHistory = [];
        this.savedSearches = [];
        this.searchFilters = {};
        this.init();
    }

    init() {
        this.loadSearchHistory();
        this.setupGlobalSearch();
        this.setupAdvancedFilters();
    }

    loadSearchHistory() {
        this.searchHistory = StorageUtils.get('cswind_search_history', []);
        this.savedSearches = StorageUtils.get('cswind_saved_searches', []);
    }

    setupGlobalSearch() {
        // 전역 검색 바를 헤더에 추가
        this.addGlobalSearchBar();
    }

    addGlobalSearchBar() {
        const header = document.querySelector('header .container');
        if (!header) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'hidden lg:block absolute left-1/2 transform -translate-x-1/2';
        
        searchContainer.innerHTML = `
            <div class="relative">
                <div class="search-container">
                    <i class="search-icon fas fa-search"></i>
                    <input type="text" 
                           id="global-search-input" 
                           class="search-input form-input w-80" 
                           placeholder="전체 검색... (Ctrl+K)"
                           autocomplete="off">
                    <button id="advanced-search-btn" 
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="고급 검색">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                </div>
                
                <!-- 검색 결과 드롭다운 -->
                <div id="search-results-dropdown" 
                     class="hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    <!-- 검색 결과가 여기에 표시됩니다 -->
                </div>
            </div>
        `;
        
        header.appendChild(searchContainer);
        
        this.setupGlobalSearchEvents();
    }

    setupGlobalSearchEvents() {
        const searchInput = document.getElementById('global-search-input');
        const resultsDropdown = document.getElementById('search-results-dropdown');
        const advancedBtn = document.getElementById('advanced-search-btn');
        
        if (!searchInput) return;

        // 전역 검색 단축키 (Ctrl+K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });

        // 실시간 검색
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                resultsDropdown.classList.add('hidden');
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(query);
            }, 300);
        });

        // 검색 입력창 포커스/블러 이벤트
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                resultsDropdown.classList.remove('hidden');
            }
        });

        searchInput.addEventListener('blur', () => {
            // 잠시 후에 숨기기 (결과 클릭을 위해)
            setTimeout(() => {
                resultsDropdown.classList.add('hidden');
            }, 200);
        });

        // 키보드 네비게이션
        searchInput.addEventListener('keydown', (e) => {
            const results = resultsDropdown.querySelectorAll('.search-result-item');
            const activeIndex = Array.from(results).findIndex(item => 
                item.classList.contains('active')
            );

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateSearchResults(results, activeIndex + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateSearchResults(results, activeIndex - 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const activeItem = results[activeIndex];
                    if (activeItem) {
                        activeItem.click();
                    }
                    break;
                case 'Escape':
                    resultsDropdown.classList.add('hidden');
                    searchInput.blur();
                    break;
            }
        });

        // 고급 검색 버튼
        if (advancedBtn) {
            advancedBtn.addEventListener('click', () => {
                this.showAdvancedSearchModal();
            });
        }
    }

    async performGlobalSearch(query) {
        const results = {
            projects: [],
            bomItems: [],
            suppliers: [],
            mtoPackages: []
        };

        // 프로젝트 검색
        results.projects = this.app.projects.filter(project => 
            this.matchesQuery(project, query, ['project_name', 'customer_name', 'tower_model'])
        ).slice(0, 5);

        // BOM 아이템 검색
        results.bomItems = this.app.bomItems.filter(item => 
            this.matchesQuery(item, query, ['drawing_number', 'item_name', 'item_code', 'material_type'])
        ).slice(0, 5);

        // 서플라이어 검색
        results.suppliers = this.app.suppliers.filter(supplier => 
            this.matchesQuery(supplier, query, ['supplier_name', 'contact_info']) ||
            (supplier.specialization && supplier.specialization.some(spec => 
                spec.toLowerCase().includes(query.toLowerCase())
            ))
        ).slice(0, 5);

        // MTO 패키지 검색
        results.mtoPackages = this.app.mtoPackages.filter(mto => 
            this.matchesQuery(mto, query, ['package_name'])
        ).slice(0, 5);

        this.displaySearchResults(query, results);
        this.addToSearchHistory(query);
    }

    matchesQuery(item, query, fields) {
        const lowerQuery = query.toLowerCase();
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(lowerQuery);
        });
    }

    displaySearchResults(query, results) {
        const dropdown = document.getElementById('search-results-dropdown');
        if (!dropdown) return;

        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        
        if (totalResults === 0) {
            dropdown.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-search text-2xl mb-2 block"></i>
                    <p>"${query}"에 대한 검색 결과가 없습니다.</p>
                </div>
            `;
        } else {
            dropdown.innerHTML = `
                <div class="p-3 border-b border-gray-100 bg-gray-50">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-700">검색 결과 (${totalResults}개)</span>
                        <button onclick="advancedSearchManager.saveCurrentSearch('${query}')" 
                                class="text-xs text-blue-600 hover:text-blue-800">
                            <i class="fas fa-bookmark mr-1"></i>저장
                        </button>
                    </div>
                </div>
                ${this.renderSearchResultSection('프로젝트', 'projects', results.projects, 'folder')}
                ${this.renderSearchResultSection('BOM 아이템', 'bom', results.bomItems, 'list')}
                ${this.renderSearchResultSection('서플라이어', 'suppliers', results.suppliers, 'truck')}
                ${this.renderSearchResultSection('MTO 패키지', 'mto', results.mtoPackages, 'box')}
            `;
        }
        
        dropdown.classList.remove('hidden');
    }

    renderSearchResultSection(title, type, items, icon) {
        if (items.length === 0) return '';
        
        return `
            <div class="search-result-section">
                <div class="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <h4 class="text-sm font-medium text-gray-700 flex items-center">
                        <i class="fas fa-${icon} mr-2"></i>${title}
                    </h4>
                </div>
                ${items.map(item => this.renderSearchResultItem(type, item)).join('')}
            </div>
        `;
    }

    renderSearchResultItem(type, item) {
        let primaryText, secondaryText, action;
        
        switch (type) {
            case 'projects':
                primaryText = item.project_name;
                secondaryText = `${item.customer_name} • ${item.status}`;
                action = `advancedSearchManager.goToProject('${item.id}')`;
                break;
            case 'bom':
                primaryText = item.item_name;
                secondaryText = `${item.drawing_number} • ${item.material_type || '미분류'}`;
                action = `advancedSearchManager.goToBOMItem('${item.id}')`;
                break;
            case 'suppliers':
                primaryText = item.supplier_name;
                secondaryText = `${item.contact_info} • ${item.status}`;
                action = `advancedSearchManager.goToSupplier('${item.id}')`;
                break;
            case 'mto':
                primaryText = item.package_name;
                secondaryText = `${item.total_items}개 아이템 • ${item.status}`;
                action = `advancedSearchManager.goToMTO('${item.id}')`;
                break;
        }
        
        return `
            <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50" 
                 onclick="${action}">
                <div class="font-medium text-gray-800 text-sm">${primaryText}</div>
                <div class="text-xs text-gray-500">${secondaryText}</div>
            </div>
        `;
    }

    navigateSearchResults(results, newIndex) {
        if (results.length === 0) return;
        
        // 이전 활성화된 항목 제거
        results.forEach(item => item.classList.remove('active'));
        
        // 새로운 인덱스 계산
        let targetIndex = newIndex;
        if (targetIndex < 0) targetIndex = results.length - 1;
        if (targetIndex >= results.length) targetIndex = 0;
        
        // 새로운 항목 활성화
        if (results[targetIndex]) {
            results[targetIndex].classList.add('active');
            results[targetIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // 네비게이션 액션들
    goToProject(projectId) {
        this.app.switchTab('projects');
        // 프로젝트 상세 보기 로직 추가
        this.hideSearchResults();
    }

    goToBOMItem(bomItemId) {
        this.app.switchTab('bom');
        // BOM 아이템 상세 보기 로직 추가
        this.hideSearchResults();
    }

    goToSupplier(supplierId) {
        this.app.switchTab('suppliers');
        // 서플라이어 상세 보기 로직 추가
        this.hideSearchResults();
    }

    goToMTO(mtoId) {
        this.app.switchTab('mto');
        // MTO 패키지 상세 보기 로직 추가
        this.hideSearchResults();
    }

    hideSearchResults() {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    // 고급 검색 모달
    showAdvancedSearchModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-hidden modal-content">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold flex items-center">
                            <i class="fas fa-search text-blue-600 mr-2"></i>
                            고급 검색
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- 검색 조건 -->
                        <div class="lg:col-span-2">
                            <h4 class="font-medium mb-4">검색 조건</h4>
                            
                            <div class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="form-label">검색 범위</label>
                                        <select id="search-scope" class="form-select">
                                            <option value="all">전체</option>
                                            <option value="projects">프로젝트만</option>
                                            <option value="bom">BOM 아이템만</option>
                                            <option value="suppliers">서플라이어만</option>
                                            <option value="mto">MTO 패키지만</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">정렬 방식</label>
                                        <select id="search-sort" class="form-select">
                                            <option value="relevance">관련도순</option>
                                            <option value="date_desc">최신순</option>
                                            <option value="date_asc">오래된순</option>
                                            <option value="name_asc">이름순</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="form-label">키워드</label>
                                    <input type="text" id="advanced-search-keywords" 
                                           class="form-input" 
                                           placeholder="검색할 키워드를 입력하세요">
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="form-label">생성일 범위</label>
                                        <div class="grid grid-cols-2 gap-2">
                                            <input type="date" id="date-from" class="form-input">
                                            <input type="date" id="date-to" class="form-input">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="form-label">상태</label>
                                        <select id="status-filter" class="form-select">
                                            <option value="">모든 상태</option>
                                            <option value="진행중">진행중</option>
                                            <option value="완료">완료</option>
                                            <option value="보류">보류</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="form-label">자재 유형</label>
                                        <select id="material-type-filter" class="form-select">
                                            <option value="">모든 유형</option>
                                            <option value="철판">철판</option>
                                            <option value="플레이트류">플레이트류</option>
                                            <option value="도료">도료</option>
                                            <option value="전기제품">전기제품</option>
                                            <option value="모듈조립품">모듈조립품</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="form-label">도면 유형</label>
                                        <select id="drawing-type-filter" class="form-select">
                                            <option value="">모든 유형</option>
                                            <option value="실물도면">실물도면</option>
                                            <option value="스펙도면">스펙도면</option>
                                            <option value="퀄리티도면">퀄리티도면</option>
                                            <option value="워크인스트럭션">워크인스트럭션</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex space-x-3 mt-6">
                                <button onclick="advancedSearchManager.executeAdvancedSearch()" 
                                        class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                                    <i class="fas fa-search mr-2"></i>검색 실행
                                </button>
                                <button onclick="advancedSearchManager.resetAdvancedSearch()" 
                                        class="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400">
                                    <i class="fas fa-undo mr-2"></i>초기화
                                </button>
                                <button onclick="advancedSearchManager.saveAdvancedSearch()" 
                                        class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                                    <i class="fas fa-bookmark mr-2"></i>검색 저장
                                </button>
                            </div>
                        </div>
                        
                        <!-- 저장된 검색 & 히스토리 -->
                        <div>
                            <div class="space-y-6">
                                <div>
                                    <h4 class="font-medium mb-3">저장된 검색</h4>
                                    <div id="saved-searches-list" class="space-y-2">
                                        ${this.renderSavedSearches()}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 class="font-medium mb-3">최근 검색</h4>
                                    <div id="search-history-list" class="space-y-2">
                                        ${this.renderSearchHistory()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="max-h-96 overflow-y-auto border-t border-gray-200">
                    <div id="advanced-search-results" class="p-6">
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-search text-3xl mb-2 block"></i>
                            <p>검색 조건을 설정하고 검색을 실행하세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    renderSavedSearches() {
        if (this.savedSearches.length === 0) {
            return '<p class="text-sm text-gray-500">저장된 검색이 없습니다.</p>';
        }
        
        return this.savedSearches.map(search => `
            <div class="saved-search-item p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" 
                 onclick="advancedSearchManager.loadSavedSearch('${search.id}')">
                <div class="font-medium text-sm">${search.name}</div>
                <div class="text-xs text-gray-500">${search.description}</div>
            </div>
        `).join('');
    }

    renderSearchHistory() {
        if (this.searchHistory.length === 0) {
            return '<p class="text-sm text-gray-500">최근 검색 기록이 없습니다.</p>';
        }
        
        return this.searchHistory.slice(0, 10).map(query => `
            <div class="search-history-item p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center" 
                 onclick="advancedSearchManager.useHistorySearch('${query}')">
                <span class="text-sm">${query}</span>
                <button onclick="event.stopPropagation(); advancedSearchManager.removeFromHistory('${query}')" 
                        class="text-gray-400 hover:text-red-600">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `).join('');
    }

    executeAdvancedSearch() {
        // 고급 검색 실행 로직
        const conditions = this.collectSearchConditions();
        const results = this.performAdvancedSearch(conditions);
        this.displayAdvancedSearchResults(results);
    }

    collectSearchConditions() {
        return {
            scope: document.getElementById('search-scope')?.value || 'all',
            sort: document.getElementById('search-sort')?.value || 'relevance',
            keywords: document.getElementById('advanced-search-keywords')?.value || '',
            dateFrom: document.getElementById('date-from')?.value || '',
            dateTo: document.getElementById('date-to')?.value || '',
            status: document.getElementById('status-filter')?.value || '',
            materialType: document.getElementById('material-type-filter')?.value || '',
            drawingType: document.getElementById('drawing-type-filter')?.value || ''
        };
    }

    performAdvancedSearch(conditions) {
        // 고급 검색 로직 구현
        let results = [];
        
        // 범위에 따른 데이터 선택
        const datasets = {
            all: [...this.app.projects, ...this.app.bomItems, ...this.app.suppliers, ...this.app.mtoPackages],
            projects: this.app.projects,
            bom: this.app.bomItems,
            suppliers: this.app.suppliers,
            mto: this.app.mtoPackages
        };
        
        const data = datasets[conditions.scope] || datasets.all;
        
        // 필터링 적용
        results = data.filter(item => {
            // 키워드 검색
            if (conditions.keywords) {
                const keywords = conditions.keywords.toLowerCase().split(' ');
                const itemText = JSON.stringify(item).toLowerCase();
                if (!keywords.every(keyword => itemText.includes(keyword))) {
                    return false;
                }
            }
            
            // 날짜 범위 검색
            if (conditions.dateFrom || conditions.dateTo) {
                const itemDate = new Date(item.created_date || item.created_at);
                if (conditions.dateFrom && itemDate < new Date(conditions.dateFrom)) return false;
                if (conditions.dateTo && itemDate > new Date(conditions.dateTo)) return false;
            }
            
            // 상태 필터
            if (conditions.status && item.status !== conditions.status) return false;
            
            // 자재 유형 필터
            if (conditions.materialType && item.material_type !== conditions.materialType) return false;
            
            // 도면 유형 필터
            if (conditions.drawingType && item.drawing_type !== conditions.drawingType) return false;
            
            return true;
        });
        
        // 정렬 적용
        this.sortSearchResults(results, conditions.sort);
        
        return results;
    }

    sortSearchResults(results, sortType) {
        switch (sortType) {
            case 'date_desc':
                results.sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));
                break;
            case 'date_asc':
                results.sort((a, b) => new Date(a.created_date || a.created_at) - new Date(b.created_date || b.created_at));
                break;
            case 'name_asc':
                results.sort((a, b) => {
                    const aName = a.project_name || a.item_name || a.supplier_name || a.package_name || '';
                    const bName = b.project_name || b.item_name || b.supplier_name || b.package_name || '';
                    return aName.localeCompare(bName);
                });
                break;
            // relevance는 기본 순서 유지
        }
    }

    displayAdvancedSearchResults(results) {
        const container = document.getElementById('advanced-search-results');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-search-minus text-3xl mb-2 block"></i>
                    <p>검색 조건에 맞는 결과가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="mb-4">
                <h4 class="font-medium">검색 결과 (${results.length}개)</h4>
                <button onclick="advancedSearchManager.exportSearchResults()" 
                        class="text-sm text-blue-600 hover:text-blue-800 mt-2">
                    <i class="fas fa-download mr-1"></i>결과 내보내기
                </button>
            </div>
            <div class="space-y-3">
                ${results.slice(0, 50).map(item => this.renderAdvancedSearchResultItem(item)).join('')}
                ${results.length > 50 ? `<div class="text-sm text-gray-500 text-center py-2">... 더 많은 결과가 있습니다 (총 ${results.length}개)</div>` : ''}
            </div>
        `;
        
        this.currentSearchResults = results;
    }

    renderAdvancedSearchResultItem(item) {
        let type, title, subtitle, icon;
        
        if (item.project_name) {
            type = 'project';
            title = item.project_name;
            subtitle = `${item.customer_name} • ${item.status}`;
            icon = 'folder';
        } else if (item.drawing_number) {
            type = 'bom';
            title = item.item_name;
            subtitle = `${item.drawing_number} • ${item.material_type || '미분류'}`;
            icon = 'list';
        } else if (item.supplier_name) {
            type = 'supplier';
            title = item.supplier_name;
            subtitle = `${item.contact_info} • ${item.status}`;
            icon = 'truck';
        } else if (item.package_name) {
            type = 'mto';
            title = item.package_name;
            subtitle = `${item.total_items}개 아이템 • ${item.status}`;
            icon = 'box';
        }
        
        return `
            <div class="advanced-search-result-item p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer" 
                 onclick="advancedSearchManager.goTo${type.charAt(0).toUpperCase() + type.slice(1)}('${item.id}')">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <i class="fas fa-${icon} text-gray-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800">${title}</div>
                        <div class="text-sm text-gray-500">${subtitle}</div>
                        <div class="text-xs text-gray-400 mt-1">
                            ${DateUtils.formatRelative(item.created_date || item.created_at)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    addToSearchHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;
        
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        
        StorageUtils.set('cswind_search_history', this.searchHistory);
    }

    saveCurrentSearch(query) {
        // 현재 검색을 저장된 검색에 추가
        const search = {
            id: StringUtils.generateId(),
            name: query,
            description: `"${query}"에 대한 검색`,
            query: query,
            timestamp: new Date().toISOString()
        };
        
        this.savedSearches.unshift(search);
        StorageUtils.set('cswind_saved_searches', this.savedSearches);
        
        this.app.showToast('검색이 저장되었습니다.', 'success');
    }

    exportSearchResults() {
        if (!this.currentSearchResults || this.currentSearchResults.length === 0) {
            this.app.showToast('내보낼 검색 결과가 없습니다.', 'warning');
            return;
        }
        
        const exportData = this.currentSearchResults.map(item => {
            const baseData = {
                '유형': item.project_name ? '프로젝트' : item.drawing_number ? 'BOM' : item.supplier_name ? '서플라이어' : 'MTO',
                '생성일': DateUtils.formatKorean(item.created_date || item.created_at)
            };
            
            if (item.project_name) {
                return { ...baseData, '이름': item.project_name, '고객사': item.customer_name, '상태': item.status };
            } else if (item.drawing_number) {
                return { ...baseData, '이름': item.item_name, '도면번호': item.drawing_number, '자재유형': item.material_type || '' };
            } else if (item.supplier_name) {
                return { ...baseData, '이름': item.supplier_name, '연락처': item.contact_info, '상태': item.status };
            } else if (item.package_name) {
                return { ...baseData, '이름': item.package_name, '아이템수': item.total_items, '상태': item.status };
            }
        });
        
        const filename = `CS_Wind_검색결과_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.showToast('검색 결과가 내보내졌습니다.', 'success');
    }

    resetAdvancedSearch() {
        document.getElementById('search-scope').value = 'all';
        document.getElementById('search-sort').value = 'relevance';
        document.getElementById('advanced-search-keywords').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('material-type-filter').value = '';
        document.getElementById('drawing-type-filter').value = '';
        
        const resultsContainer = document.getElementById('advanced-search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-search text-3xl mb-2 block"></i>
                    <p>검색 조건을 설정하고 검색을 실행하세요.</p>
                </div>
            `;
        }
    }

    setupAdvancedFilters() {
        // 각 탭별 고급 필터 설정
        this.setupProjectFilters();
        this.setupBOMFilters();
        this.setupSupplierFilters();
        this.setupMTOFilters();
    }

    setupProjectFilters() {
        // 프로젝트 탭 고급 필터 구현
    }

    setupBOMFilters() {
        // BOM 탭 고급 필터 구현
    }

    setupSupplierFilters() {
        // 서플라이어 탭 고급 필터 구현
    }

    setupMTOFilters() {
        // MTO 탭 고급 필터 구현
    }
}

// 검색 관련 CSS 추가
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    .search-result-item.active {
        background-color: #dbeafe !important;
    }
    
    .search-result-section {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .advanced-search-result-item {
        transition: all 0.2s ease;
    }
    
    .saved-search-item, .search-history-item {
        transition: background-color 0.2s ease;
    }
    
    #global-search-input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .search-results-dropdown {
        box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
`;
document.head.appendChild(searchStyles);

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.advancedSearchManager = new AdvancedSearchManager(window.csWindApp);
        }
    }, 300);
});