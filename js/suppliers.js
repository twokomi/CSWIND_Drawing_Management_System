// 서플라이어 관리 및 자재 분류 시스템

class SupplierManager {
    constructor(app) {
        this.app = app;
        this.currentSuppliers = [];
        this.materialCategories = {
            '철판': {
                subcategories: ['일반구조용강재', '고장력강재', '스테인리스강재', '내후성강재'],
                physicalProperties: ['두께', '폭', '길이', '중량', '항복강도', '인장강도']
            },
            '플레이트류': {
                subcategories: ['후판', '중판', '박판', '형강', '각재'],
                physicalProperties: ['치수', '두께', '중량', '표면처리', '곡률반경']
            },
            '도료': {
                subcategories: ['프라이머', '중도도료', '상도도료', '특수도료'],
                physicalProperties: ['점도', '건조시간', '도막두께', '내구성', '색상']
            },
            '전기제품': {
                subcategories: ['케이블', '커넥터', '센서', '제어장치', '조명'],
                physicalProperties: ['전압', '전류', '소비전력', '크기', '무게', '방수등급']
            },
            '모듈조립품': {
                subcategories: ['허브', '나셀', '로터', '타워모듈', '기초부품'],
                physicalProperties: ['길이', '폭', '높이', '총중량', '조립복잡도', '운송방식']
            }
        };
        
        this.setupSupplierEvents();
    }

    setupSupplierEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.app.loadSuppliersList = () => this.loadSuppliersList();
        });
    }

    async loadSuppliersList() {
        const container = document.getElementById('tab-suppliers');
        if (!container) return;

        try {
            // 서플라이어 관리 UI 렌더링
            container.innerHTML = this.renderSupplierManagementUI();
            await this.loadSuppliersData();
            this.attachSupplierEvents();

        } catch (error) {
            console.error('서플라이어 목록 로드 실패:', error);
            container.innerHTML = '<div class="p-8 text-center text-red-500">서플라이어 목록을 불러올 수 없습니다.</div>';
        }
    }

    renderSupplierManagementUI() {
        return `
            <div class="space-y-6">
                <!-- 서플라이어 등록 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-truck-loading text-blue-600 mr-2"></i>
                        새 서플라이어 등록
                    </h3>
                    <form id="add-supplier-form" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label class="form-label">서플라이어명 *</label>
                            <input type="text" name="supplier_name" class="form-input" placeholder="예: 포스코강판" required>
                        </div>
                        <div>
                            <label class="form-label">연락처</label>
                            <input type="text" name="contact_info" class="form-input" placeholder="전화번호 또는 이메일">
                        </div>
                        <div>
                            <label class="form-label">전문 분야 *</label>
                            <select name="specialization" class="form-select" required multiple>
                                <option value="철판">철판</option>
                                <option value="플레이트류">플레이트류</option>
                                <option value="도료">도료</option>
                                <option value="전기제품">전기제품</option>
                                <option value="모듈조립품">모듈조립품</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">처리 가능 사이즈</label>
                            <input type="text" name="size_capacity" class="form-input" placeholder="예: 20m x 3m">
                        </div>
                        <div>
                            <label class="form-label">최대 처리 중량 (kg)</label>
                            <input type="number" name="weight_capacity" class="form-input" placeholder="50000">
                        </div>
                        <div class="flex items-end">
                            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
                                <i class="fas fa-plus mr-2"></i>서플라이어 등록
                            </button>
                        </div>
                    </form>
                </div>

                <!-- 자재 분류 시스템 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-tags text-green-600 mr-2"></i>
                        자재 분류 시스템
                    </h3>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- 1차 분류: 자재 성격 -->
                        <div>
                            <h4 class="font-medium mb-3">1차 분류: 자재 성격별</h4>
                            <div id="material-categories" class="space-y-3">
                                ${Object.keys(this.materialCategories).map(category => `
                                    <div class="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition duration-200"
                                         onclick="supplierManager.showCategoryDetails('${category}')">
                                        <div class="flex justify-between items-center">
                                            <span class="font-medium">${category}</span>
                                            <div class="flex items-center space-x-2">
                                                <span class="text-sm text-gray-500">${this.materialCategories[category].subcategories.length}개 하위분류</span>
                                                <i class="fas fa-chevron-right text-gray-400"></i>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 2차 분류: 물리적 특성 -->
                        <div>
                            <h4 class="font-medium mb-3">2차 분류: 물리적 특성</h4>
                            <div id="selected-category-details" class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p class="text-gray-500 text-center">왼쪽에서 자재 분류를 선택하세요</p>
                            </div>
                        </div>
                    </div>

                    <!-- 자동 분류 도구 -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <h4 class="font-medium mb-3">자동 분류 도구</h4>
                        <div class="flex flex-wrap gap-3">
                            <button id="auto-classify-btn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                                <i class="fas fa-magic mr-2"></i>BOM 자동 분류
                            </button>
                            <button id="suggest-suppliers-btn" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200">
                                <i class="fas fa-lightbulb mr-2"></i>서플라이어 추천
                            </button>
                            <button id="classification-rules-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
                                <i class="fas fa-cogs mr-2"></i>분류 규칙 관리
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 서플라이어 목록 -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">등록된 서플라이어</h3>
                            <div class="flex space-x-3">
                                <div class="search-container">
                                    <i class="search-icon fas fa-search"></i>
                                    <input type="text" id="supplier-search" class="search-input form-input" placeholder="서플라이어 검색...">
                                </div>
                                <select id="supplier-specialization-filter" class="form-select">
                                    <option value="">모든 전문분야</option>
                                    <option value="철판">철판</option>
                                    <option value="플레이트류">플레이트류</option>
                                    <option value="도료">도료</option>
                                    <option value="전기제품">전기제품</option>
                                    <option value="모듈조립품">모듈조립품</option>
                                </select>
                                <button id="export-suppliers-btn" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200">
                                    <i class="fas fa-download mr-2"></i>내보내기
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="table-header">
                                <tr>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">서플라이어명</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">연락처</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">전문분야</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">처리능력</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">평가</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">상태</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">작업</th>
                                </tr>
                            </thead>
                            <tbody id="suppliers-table-body">
                                <!-- 서플라이어 데이터가 여기에 표시됩니다 -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 자재-서플라이어 매칭 현황 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-network-wired text-orange-600 mr-2"></i>
                        자재-서플라이어 매칭 현황
                    </h3>
                    <div id="material-supplier-matrix" class="overflow-x-auto">
                        <!-- 매칭 현황 매트릭스가 여기에 표시됩니다 -->
                    </div>
                </div>
            </div>
        `;
    }

    async loadSuppliersData() {
        try {
            this.app.showLoading(true);
            
            const suppliersData = await this.app.fetchTableData('suppliers');
            this.currentSuppliers = suppliersData.data || [];
            
            this.renderSuppliersTable(this.currentSuppliers);
            this.renderMaterialSupplierMatrix();

        } catch (error) {
            console.error('서플라이어 데이터 로드 실패:', error);
            this.app.showToast('서플라이어 데이터를 불러올 수 없습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    attachSupplierEvents() {
        // 서플라이어 등록 폼
        const addSupplierForm = document.getElementById('add-supplier-form');
        if (addSupplierForm) {
            addSupplierForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSupplier(new FormData(e.target));
            });
        }

        // 검색 및 필터링
        this.setupSupplierFilters();

        // 자동 분류 버튼들
        const autoClassifyBtn = document.getElementById('auto-classify-btn');
        if (autoClassifyBtn) {
            autoClassifyBtn.addEventListener('click', () => this.autoClassifyBOM());
        }

        const suggestSuppliersBtn = document.getElementById('suggest-suppliers-btn');
        if (suggestSuppliersBtn) {
            suggestSuppliersBtn.addEventListener('click', () => this.suggestSuppliers());
        }

        const classificationRulesBtn = document.getElementById('classification-rules-btn');
        if (classificationRulesBtn) {
            classificationRulesBtn.addEventListener('click', () => this.showClassificationRules());
        }

        // 내보내기 버튼
        const exportBtn = document.getElementById('export-suppliers-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSuppliers());
        }
    }

    setupSupplierFilters() {
        const searchInput = document.getElementById('supplier-search');
        const specializationFilter = document.getElementById('supplier-specialization-filter');

        const applyFilters = () => {
            let filtered = [...this.currentSuppliers];

            // 검색 필터
            const searchTerm = searchInput?.value?.toLowerCase() || '';
            if (searchTerm) {
                filtered = filtered.filter(supplier => 
                    supplier.supplier_name?.toLowerCase().includes(searchTerm) ||
                    supplier.contact_info?.toLowerCase().includes(searchTerm)
                );
            }

            // 전문분야 필터
            const specialization = specializationFilter?.value || '';
            if (specialization) {
                filtered = filtered.filter(supplier => 
                    supplier.specialization && supplier.specialization.includes(specialization)
                );
            }

            this.renderSuppliersTable(filtered);
        };

        if (searchInput) {
            searchInput.addEventListener('input', SearchUtils.debounce(applyFilters, 300));
        }
        if (specializationFilter) {
            specializationFilter.addEventListener('change', applyFilters);
        }
    }

    async addSupplier(formData) {
        try {
            this.app.showLoading(true);

            // 전문분야 배열 처리
            const specialization = [];
            const selectElement = document.querySelector('[name="specialization"]');
            for (const option of selectElement.selectedOptions) {
                specialization.push(option.value);
            }

            if (specialization.length === 0) {
                this.app.showToast('최소 하나의 전문분야를 선택해주세요.', 'warning');
                return;
            }

            const supplierData = {
                supplier_name: formData.get('supplier_name'),
                contact_info: formData.get('contact_info') || '',
                specialization: specialization,
                size_capacity: formData.get('size_capacity') || '',
                weight_capacity: NumberUtils.parseNumber(formData.get('weight_capacity')) || 0,
                rating: 3, // 기본 평가 3점
                status: '활성'
            };

            const createdSupplier = await this.app.createRecord('suppliers', supplierData);
            this.currentSuppliers.push(createdSupplier);
            
            // 폼 초기화
            document.getElementById('add-supplier-form').reset();
            
            // 테이블 새로고침
            this.renderSuppliersTable(this.currentSuppliers);
            this.renderMaterialSupplierMatrix();
            this.app.updateDashboardStats();
            
            this.app.addRecentActivity(`새 서플라이어 등록: ${createdSupplier.supplier_name}`, 'success');
            this.app.showToast('서플라이어가 성공적으로 등록되었습니다.', 'success');

        } catch (error) {
            console.error('서플라이어 등록 실패:', error);
            this.app.showToast('서플라이어 등록 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    renderSuppliersTable(suppliers) {
        const tbody = document.getElementById('suppliers-table-body');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-truck text-3xl mb-2 block"></i>
                        등록된 서플라이어가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = suppliers.map(supplier => this.renderSupplierRow(supplier)).join('');
    }

    renderSupplierRow(supplier) {
        const specializations = Array.isArray(supplier.specialization) 
            ? supplier.specialization.map(spec => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">${spec}</span>`).join('')
            : '';
        
        const rating = supplier.rating || 0;
        const stars = Array(5).fill().map((_, i) => 
            `<i class="fas fa-star ${i < rating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
        ).join('');

        const statusClass = supplier.status === '활성' ? 'status-completed' : 'status-pending';
        const weightCapacity = NumberUtils.formatWeight(supplier.weight_capacity || 0);

        return `
            <tr class="table-row">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${supplier.supplier_name}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${supplier.contact_info || '-'}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap">${specializations}</div>
                </td>
                <td class="px-6 py-4 text-sm">
                    <div>${supplier.size_capacity || '-'}</div>
                    <div class="text-xs text-gray-500">최대 ${weightCapacity}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-1">
                        ${stars}
                        <span class="text-sm text-gray-600 ml-2">(${rating}/5)</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="status-badge ${statusClass}">${supplier.status}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="supplierManager.editSupplier('${supplier.id}')" 
                                class="text-blue-600 hover:text-blue-800" title="편집">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="supplierManager.viewSupplierDetails('${supplier.id}')" 
                                class="text-green-600 hover:text-green-800" title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="supplierManager.deleteSupplier('${supplier.id}')" 
                                class="text-red-600 hover:text-red-800" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderMaterialSupplierMatrix() {
        const container = document.getElementById('material-supplier-matrix');
        if (!container || this.currentSuppliers.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">서플라이어 데이터가 없습니다.</p>';
            return;
        }

        // 자재 유형별 서플라이어 분포 계산
        const materialTypes = Object.keys(this.materialCategories);
        const matrix = {};

        materialTypes.forEach(material => {
            matrix[material] = this.currentSuppliers.filter(supplier => 
                supplier.specialization && supplier.specialization.includes(material)
            );
        });

        const matrixHTML = `
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-4 py-2 text-left font-medium text-gray-700">자재 유형</th>
                        <th class="px-4 py-2 text-center font-medium text-gray-700">서플라이어 수</th>
                        <th class="px-4 py-2 text-left font-medium text-gray-700">주요 서플라이어</th>
                        <th class="px-4 py-2 text-center font-medium text-gray-700">커버리지</th>
                    </tr>
                </thead>
                <tbody>
                    ${materialTypes.map(material => {
                        const suppliers = matrix[material];
                        const supplierNames = suppliers.slice(0, 3).map(s => s.supplier_name).join(', ');
                        const moreCount = suppliers.length > 3 ? ` 외 ${suppliers.length - 3}곳` : '';
                        const coverage = suppliers.length > 0 ? '좋음' : '부족';
                        const coverageClass = suppliers.length > 0 ? 'text-green-600' : 'text-red-600';
                        
                        return `
                            <tr class="border-b border-gray-200">
                                <td class="px-4 py-3 font-medium">${material}</td>
                                <td class="px-4 py-3 text-center">
                                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        ${suppliers.length}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-gray-600">
                                    ${suppliers.length > 0 ? supplierNames + moreCount : '-'}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="${coverageClass} font-medium">${coverage}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = matrixHTML;
    }

    showCategoryDetails(category) {
        const details = this.materialCategories[category];
        if (!details) return;

        const container = document.getElementById('selected-category-details');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-4">
                <h5 class="font-medium text-gray-800">${category}</h5>
                
                <div>
                    <h6 class="text-sm font-medium text-gray-700 mb-2">하위 분류</h6>
                    <div class="flex flex-wrap gap-2">
                        ${details.subcategories.map(sub => 
                            `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${sub}</span>`
                        ).join('')}
                    </div>
                </div>
                
                <div>
                    <h6 class="text-sm font-medium text-gray-700 mb-2">물리적 특성</h6>
                    <div class="flex flex-wrap gap-2">
                        ${details.physicalProperties.map(prop => 
                            `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">${prop}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        // 모든 카테고리 카드의 선택 상태 초기화
        document.querySelectorAll('#material-categories > div').forEach(card => {
            card.classList.remove('bg-blue-50', 'border-blue-300');
        });

        // 선택된 카테고리 하이라이트
        event.target.closest('div').classList.add('bg-blue-50', 'border-blue-300');
    }

    async autoClassifyBOM() {
        try {
            this.app.showLoading(true);
            
            // 현재 프로젝트의 BOM 아이템들 가져오기
            const bomData = await this.app.fetchTableData('bom_items', { limit: 1000 });
            const bomItems = bomData.data || [];
            
            if (bomItems.length === 0) {
                this.app.showToast('분류할 BOM 아이템이 없습니다.', 'warning');
                return;
            }

            let classifiedCount = 0;
            
            for (const item of bomItems) {
                // 이미 분류된 아이템은 건너뛰기
                if (item.material_type && item.material_type !== '기타') {
                    continue;
                }

                // 아이템명과 사양을 기반으로 자동 분류
                const classifiedType = this.classifyMaterial(item.item_name, item.specifications);
                
                if (classifiedType !== '기타') {
                    try {
                        await this.app.updateRecord('bom_items', item.id, {
                            material_type: classifiedType,
                            supplier_category: this.suggestSupplierCategory(classifiedType, item)
                        });
                        classifiedCount++;
                    } catch (error) {
                        console.error(`아이템 ${item.id} 분류 업데이트 실패:`, error);
                    }
                }
            }

            this.app.addRecentActivity(`BOM 자동 분류 완료: ${classifiedCount}개 아이템`, 'success');
            this.app.showToast(`${classifiedCount}개의 BOM 아이템이 자동 분류되었습니다.`, 'success');

        } catch (error) {
            console.error('BOM 자동 분류 실패:', error);
            this.app.showToast('BOM 자동 분류 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    suggestSuppliers() {
        // 서플라이어 추천 로직
        this.app.showToast('서플라이어 추천 기능을 실행합니다.', 'info');
        
        // BOM 아이템별로 적합한 서플라이어 추천
        const recommendations = this.generateSupplierRecommendations();
        this.showRecommendationsModal(recommendations);
    }

    showClassificationRules() {
        // 분류 규칙 관리 모달
        this.app.showToast('분류 규칙 관리 기능은 추후 구현 예정입니다.', 'info');
    }

    classifyMaterial(itemName, specifications) {
        const name = (itemName || '').toLowerCase();
        const specs = (specifications || '').toLowerCase();
        const combined = name + ' ' + specs;

        // 철판 관련 키워드
        if (combined.match(/(철판|강판|steel|plate|ss400|sm490|sm520)/)) {
            return '철판';
        }
        
        // 플레이트류 키워드
        if (combined.match(/(플레이트|후판|중판|박판|형강|각재|beam|channel|angle)/)) {
            return '플레이트류';
        }
        
        // 도료 관련 키워드
        if (combined.match(/(도료|페인트|프라이머|코팅|paint|primer|coating)/)) {
            return '도료';
        }
        
        // 전기제품 키워드
        if (combined.match(/(케이블|전선|센서|제어|전기|cable|sensor|control|electric)/)) {
            return '전기제품';
        }
        
        // 모듈조립품 키워드
        if (combined.match(/(허브|나셀|로터|모듈|조립|assembly|hub|nacelle|rotor)/)) {
            return '모듈조립품';
        }

        return '기타';
    }

    suggestSupplierCategory(materialType, bomItem) {
        // BOM 아이템의 특성을 고려한 서플라이어 카테고리 제안
        const weight = bomItem.weight || 0;
        const dimensions = bomItem.dimensions || '';

        if (weight > 10000) { // 10톤 초과
            return '대형중량물전문';
        } else if (weight > 1000) { // 1톤 초과
            return '중량물전문';
        } else {
            return '일반공급업체';
        }
    }

    generateSupplierRecommendations() {
        // 서플라이어 추천 로직 구현
        return {
            철판: this.currentSuppliers.filter(s => s.specialization?.includes('철판')),
            플레이트류: this.currentSuppliers.filter(s => s.specialization?.includes('플레이트류')),
            도료: this.currentSuppliers.filter(s => s.specialization?.includes('도료')),
            전기제품: this.currentSuppliers.filter(s => s.specialization?.includes('전기제품')),
            모듈조립품: this.currentSuppliers.filter(s => s.specialization?.includes('모듈조립품'))
        };
    }

    showRecommendationsModal(recommendations) {
        // 추천 결과를 모달로 표시
        console.log('서플라이어 추천:', recommendations);
    }

    exportSuppliers() {
        if (this.currentSuppliers.length === 0) {
            this.app.showToast('내보낼 서플라이어가 없습니다.', 'warning');
            return;
        }

        const exportData = this.currentSuppliers.map(supplier => ({
            '서플라이어명': supplier.supplier_name,
            '연락처': supplier.contact_info || '',
            '전문분야': Array.isArray(supplier.specialization) ? supplier.specialization.join(', ') : '',
            '처리가능사이즈': supplier.size_capacity || '',
            '최대처리중량': supplier.weight_capacity || 0,
            '평가점수': supplier.rating || 0,
            '상태': supplier.status
        }));

        const filename = `CS_Wind_Suppliers_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.addRecentActivity(`서플라이어 데이터 내보내기: ${this.currentSuppliers.length}건`, 'info');
        this.app.showToast('서플라이어 데이터가 성공적으로 내보내졌습니다.', 'success');
    }

    async editSupplier(supplierId) {
        // 서플라이어 편집 기능
        this.app.showToast('서플라이어 편집 기능은 추후 구현 예정입니다.', 'info');
    }

    async viewSupplierDetails(supplierId) {
        // 서플라이어 상세보기 기능
        this.app.showToast('서플라이어 상세보기 기능은 추후 구현 예정입니다.', 'info');
    }

    async deleteSupplier(supplierId) {
        const supplier = this.currentSuppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        if (!confirm(`서플라이어 "${supplier.supplier_name}"를 정말 삭제하시겠습니까?`)) {
            return;
        }

        try {
            this.app.showLoading(true);
            
            await this.app.deleteRecord('suppliers', supplierId);
            
            // 로컬 데이터에서 제거
            this.currentSuppliers = this.currentSuppliers.filter(s => s.id !== supplierId);
            
            // UI 새로고침
            this.renderSuppliersTable(this.currentSuppliers);
            this.renderMaterialSupplierMatrix();
            this.app.updateDashboardStats();
            
            this.app.addRecentActivity(`서플라이어 삭제: ${supplier.supplier_name}`, 'warning');
            this.app.showToast('서플라이어가 성공적으로 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('서플라이어 삭제 실패:', error);
            this.app.showToast('서플라이어 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.supplierManager = new SupplierManager(window.csWindApp);
        }
    }, 100);
});