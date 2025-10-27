// MTO (Material Take Off) 패키징 및 관리 시스템

class MTOManager {
    constructor(app) {
        this.app = app;
        this.currentProject = null;
        this.currentMTOPackages = [];
        this.availableBOMItems = [];
        this.selectedBOMItems = [];
        this.setupMTOEvents();
    }

    setupMTOEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.app.loadMTOList = () => this.loadMTOList();
        });
    }

    async loadMTOList() {
        const container = document.getElementById('tab-mto');
        if (!container) return;

        try {
            // MTO 관리 UI 렌더링
            container.innerHTML = this.renderMTOManagementUI();
            await this.loadMTOData();
            this.attachMTOEvents();

        } catch (error) {
            console.error('MTO 목록 로드 실패:', error);
            container.innerHTML = '<div class="p-8 text-center text-red-500">MTO 목록을 불러올 수 없습니다.</div>';
        }
    }

    renderMTOManagementUI() {
        return `
            <div class="space-y-6">
                <!-- MTO 생성 마법사 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-magic text-blue-600 mr-2"></i>
                        MTO 생성 마법사
                    </h3>
                    
                    <!-- 단계별 진행 표시 -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-700">단계 진행</span>
                            <span id="wizard-progress-text" class="text-sm text-gray-500">1/4 단계</span>
                        </div>
                        <div class="progress-bar">
                            <div id="wizard-progress-fill" class="progress-fill" style="width: 25%"></div>
                        </div>
                    </div>

                    <!-- 단계별 컨텐츠 -->
                    <div id="mto-wizard">
                        <!-- 1단계: 프로젝트 선택 -->
                        <div id="step-1" class="wizard-step">
                            <h4 class="font-medium mb-3">1단계: 프로젝트 선택</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="form-label">프로젝트 선택 *</label>
                                    <select id="mto-project-select" class="form-select">
                                        <option value="">프로젝트를 선택하세요</option>
                                    </select>
                                </div>
                                <div id="project-info" class="bg-gray-50 p-4 rounded-lg hidden">
                                    <h5 class="font-medium mb-2">선택된 프로젝트 정보</h5>
                                    <div id="project-details"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2단계: BOM 아이템 선택 -->
                        <div id="step-2" class="wizard-step hidden">
                            <h4 class="font-medium mb-3">2단계: MTO 대상 BOM 아이템 선택</h4>
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center space-x-4">
                                        <span class="text-sm text-gray-600">총 <span id="total-bom-count">0</span>개 아이템 중 <span id="mto-ready-count">0</span>개 MTO 대상</span>
                                        <button id="select-all-mto-items" class="text-blue-600 hover:text-blue-800 text-sm">
                                            <i class="fas fa-check-square mr-1"></i>MTO 아이템 전체 선택
                                        </button>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button id="filter-actual-drawings" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                            실물도면만
                                        </button>
                                        <button id="filter-classified-items" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                            분류완료만
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="bom-items-grid" class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                    <!-- BOM 아이템 목록이 여기에 표시됩니다 -->
                                </div>
                            </div>
                        </div>

                        <!-- 3단계: 서플라이어별 그룹화 -->
                        <div id="step-3" class="wizard-step hidden">
                            <h4 class="font-medium mb-3">3단계: 서플라이어별 그룹화</h4>
                            <div class="space-y-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600">선택된 <span id="selected-items-count">0</span>개 아이템을 자재 유형별로 그룹화합니다.</span>
                                    <button id="auto-group-btn" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                                        <i class="fas fa-magic mr-2"></i>자동 그룹화
                                    </button>
                                </div>
                                
                                <div id="material-groups" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <!-- 자재별 그룹이 여기에 표시됩니다 -->
                                </div>
                            </div>
                        </div>

                        <!-- 4단계: MTO 패키지 설정 -->
                        <div id="step-4" class="wizard-step hidden">
                            <h4 class="font-medium mb-3">4단계: MTO 패키지 설정 및 완료</h4>
                            <div id="mto-packages-preview" class="space-y-4">
                                <!-- MTO 패키지 미리보기가 여기에 표시됩니다 -->
                            </div>
                        </div>
                    </div>

                    <!-- 네비게이션 버튼 -->
                    <div class="flex justify-between mt-6 pt-6 border-t border-gray-200">
                        <button id="wizard-prev-btn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
                            <i class="fas fa-chevron-left mr-2"></i>이전
                        </button>
                        <button id="wizard-next-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled>
                            다음<i class="fas fa-chevron-right ml-2"></i>
                        </button>
                        <button id="wizard-finish-btn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 hidden">
                            <i class="fas fa-check mr-2"></i>MTO 생성 완료
                        </button>
                    </div>
                </div>

                <!-- 생성된 MTO 패키지 목록 -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold">생성된 MTO 패키지</h3>
                            <div class="flex space-x-2">
                                <select id="mto-project-filter" class="form-select">
                                    <option value="">모든 프로젝트</option>
                                </select>
                                <select id="mto-status-filter" class="form-select">
                                    <option value="">모든 상태</option>
                                    <option value="작성중">작성중</option>
                                    <option value="완료">완료</option>
                                    <option value="전송완료">전송완료</option>
                                </select>
                                <button id="export-all-mto-btn" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                                    <i class="fas fa-download mr-2"></i>전체 내보내기
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="mto-packages-list" class="divide-y divide-gray-200">
                        <!-- MTO 패키지 목록이 여기에 표시됩니다 -->
                    </div>
                </div>

                <!-- MTO 상세보기 모달 -->
                <div id="mto-detail-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <!-- 모달 내용이 동적으로 생성됩니다 -->
                </div>
            </div>
        `;
    }

    async loadMTOData() {
        try {
            this.app.showLoading(true);
            
            // 프로젝트 목록 로드
            await this.loadProjectsForMTO();
            
            // MTO 패키지 목록 로드
            const mtoData = await this.app.fetchTableData('mto_packages');
            this.currentMTOPackages = mtoData.data || [];
            
            this.renderMTOPackagesList(this.currentMTOPackages);

        } catch (error) {
            console.error('MTO 데이터 로드 실패:', error);
            this.app.showToast('MTO 데이터를 불러올 수 없습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    async loadProjectsForMTO() {
        const projectSelect = document.getElementById('mto-project-select');
        const projectFilter = document.getElementById('mto-project-filter');
        
        if (projectSelect) {
            // 마법사용 프로젝트 선택
            this.app.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.project_name;
                projectSelect.appendChild(option);
            });
        }
        
        if (projectFilter) {
            // 필터용 프로젝트 선택
            this.app.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.project_name;
                projectFilter.appendChild(option);
            });
        }
    }

    attachMTOEvents() {
        this.setupMTOWizard();
        this.setupMTOFilters();
        this.setupMTOActions();
    }

    setupMTOWizard() {
        let currentStep = 1;
        const totalSteps = 4;

        const updateProgress = () => {
            const progress = (currentStep / totalSteps) * 100;
            document.getElementById('wizard-progress-fill').style.width = `${progress}%`;
            document.getElementById('wizard-progress-text').textContent = `${currentStep}/${totalSteps} 단계`;
        };

        const showStep = (stepNumber) => {
            // 모든 단계 숨기기
            document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));
            
            // 현재 단계 표시
            const currentStepElement = document.getElementById(`step-${stepNumber}`);
            if (currentStepElement) {
                currentStepElement.classList.remove('hidden');
            }
            
            // 버튼 상태 업데이트
            const prevBtn = document.getElementById('wizard-prev-btn');
            const nextBtn = document.getElementById('wizard-next-btn');
            const finishBtn = document.getElementById('wizard-finish-btn');
            
            prevBtn.disabled = stepNumber === 1;
            
            if (stepNumber === totalSteps) {
                nextBtn.classList.add('hidden');
                finishBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                finishBtn.classList.add('hidden');
            }
            
            updateProgress();
        };

        // 프로젝트 선택 이벤트
        const projectSelect = document.getElementById('mto-project-select');
        if (projectSelect) {
            projectSelect.addEventListener('change', async (e) => {
                const projectId = e.target.value;
                if (projectId) {
                    this.currentProject = this.app.projects.find(p => p.id === projectId);
                    await this.loadProjectBOMForMTO(projectId);
                    this.showProjectInfo(this.currentProject);
                    document.getElementById('wizard-next-btn').disabled = false;
                } else {
                    this.currentProject = null;
                    document.getElementById('project-info').classList.add('hidden');
                    document.getElementById('wizard-next-btn').disabled = true;
                }
            });
        }

        // 네비게이션 버튼
        const prevBtn = document.getElementById('wizard-prev-btn');
        const nextBtn = document.getElementById('wizard-next-btn');
        const finishBtn = document.getElementById('wizard-finish-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    showStep(currentStep);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.validateCurrentStep(currentStep)) {
                    currentStep++;
                    showStep(currentStep);
                    this.loadStepContent(currentStep);
                }
            });
        }

        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                this.createMTOPackages();
            });
        }

        // 2단계 이벤트
        const selectAllBtn = document.getElementById('select-all-mto-items');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('input[name="bom-item-mto"]');
                checkboxes.forEach(cb => cb.checked = true);
                this.updateSelectedItems();
            });
        }

        // 필터 버튼
        const filterActualBtn = document.getElementById('filter-actual-drawings');
        if (filterActualBtn) {
            filterActualBtn.addEventListener('click', () => {
                this.filterBOMItems('actual-drawings');
            });
        }

        const filterClassifiedBtn = document.getElementById('filter-classified-items');
        if (filterClassifiedBtn) {
            filterClassifiedBtn.addEventListener('click', () => {
                this.filterBOMItems('classified');
            });
        }

        // 3단계 자동 그룹화
        const autoGroupBtn = document.getElementById('auto-group-btn');
        if (autoGroupBtn) {
            autoGroupBtn.addEventListener('click', () => {
                this.autoGroupItems();
            });
        }

        // 초기 단계 설정
        showStep(currentStep);
    }

    showProjectInfo(project) {
        const container = document.getElementById('project-info');
        const details = document.getElementById('project-details');
        
        if (container && details && project) {
            details.innerHTML = `
                <div class="text-sm space-y-1">
                    <div><span class="font-medium">고객사:</span> ${project.customer_name}</div>
                    <div><span class="font-medium">타워모델:</span> ${project.tower_model}</div>
                    <div><span class="font-medium">상태:</span> <span class="status-badge status-progress">${project.status}</span></div>
                </div>
            `;
            container.classList.remove('hidden');
        }
    }

    async loadProjectBOMForMTO(projectId) {
        try {
            const bomData = await this.app.fetchTableData('bom_items', {
                search: projectId,
                limit: 1000
            });
            
            this.availableBOMItems = bomData.data || [];
            
            // 통계 업데이트
            const totalCount = this.availableBOMItems.length;
            const mtoReadyCount = this.availableBOMItems.filter(item => item.is_mto_item).length;
            
            document.getElementById('total-bom-count').textContent = totalCount;
            document.getElementById('mto-ready-count').textContent = mtoReadyCount;
            
        } catch (error) {
            console.error('프로젝트 BOM 로드 실패:', error);
            this.app.showToast('BOM 데이터를 불러올 수 없습니다.', 'error');
        }
    }

    validateCurrentStep(step) {
        switch (step) {
            case 1:
                if (!this.currentProject) {
                    this.app.showToast('프로젝트를 선택해주세요.', 'warning');
                    return false;
                }
                return true;
            case 2:
                this.updateSelectedItems();
                if (this.selectedBOMItems.length === 0) {
                    this.app.showToast('최소 하나의 BOM 아이템을 선택해주세요.', 'warning');
                    return false;
                }
                return true;
            case 3:
                return true;
            default:
                return true;
        }
    }

    loadStepContent(step) {
        switch (step) {
            case 2:
                this.renderBOMItemsGrid();
                break;
            case 3:
                this.renderMaterialGroups();
                break;
            case 4:
                this.renderMTOPackagesPreview();
                break;
        }
    }

    renderBOMItemsGrid() {
        const container = document.getElementById('bom-items-grid');
        if (!container || this.availableBOMItems.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">사용 가능한 BOM 아이템이 없습니다.</div>';
            return;
        }

        const itemsHTML = this.availableBOMItems.map(item => `
            <div class="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50">
                <input type="checkbox" name="bom-item-mto" value="${item.id}" 
                       ${item.is_mto_item ? 'checked' : ''} 
                       onchange="mtoManager.updateSelectedItems()"
                       class="rounded mr-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <div class="font-medium text-gray-800">${item.item_name}</div>
                        <div class="flex space-x-2">
                            <span class="status-badge ${this.getDrawingTypeClass(item.drawing_type)}">${item.drawing_type}</span>
                            <span class="status-badge ${this.getMaterialTypeClass(item.material_type)}">${item.material_type || '미분류'}</span>
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        도면번호: ${item.drawing_number} | 
                        수량: ${NumberUtils.format(item.quantity)} | 
                        중량: ${NumberUtils.formatWeight(item.weight)}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = itemsHTML;
    }

    updateSelectedItems() {
        const checkboxes = document.querySelectorAll('input[name="bom-item-mto"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        this.selectedBOMItems = this.availableBOMItems.filter(item => selectedIds.includes(item.id));
        
        // 선택된 아이템 수 업데이트
        const countElement = document.getElementById('selected-items-count');
        if (countElement) {
            countElement.textContent = this.selectedBOMItems.length;
        }
    }

    filterBOMItems(filterType) {
        let filteredItems = [...this.availableBOMItems];
        
        switch (filterType) {
            case 'actual-drawings':
                filteredItems = filteredItems.filter(item => item.drawing_type === '실물도면');
                break;
            case 'classified':
                filteredItems = filteredItems.filter(item => item.material_type && item.material_type !== '기타');
                break;
        }
        
        this.availableBOMItems = filteredItems;
        this.renderBOMItemsGrid();
    }

    renderMaterialGroups() {
        if (this.selectedBOMItems.length === 0) return;
        
        // 자재 유형별로 그룹화
        const groups = ArrayUtils.groupBy(this.selectedBOMItems, 'material_type');
        
        const container = document.getElementById('material-groups');
        if (!container) return;

        const groupsHTML = Object.entries(groups).map(([materialType, items]) => {
            const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
            const totalItems = items.length;
            
            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h5 class="font-medium">${materialType || '미분류'}</h5>
                        <span class="text-sm text-gray-500">${totalItems}개 아이템</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-3">
                        총 중량: ${NumberUtils.formatWeight(totalWeight)}
                    </div>
                    <div class="space-y-2">
                        ${items.slice(0, 3).map(item => `
                            <div class="text-sm">
                                <span class="font-medium">${item.item_name}</span>
                                <span class="text-gray-500"> - ${NumberUtils.formatWeight(item.weight)}</span>
                            </div>
                        `).join('')}
                        ${items.length > 3 ? `<div class="text-sm text-gray-500">외 ${items.length - 3}개 아이템...</div>` : ''}
                    </div>
                    <div class="mt-3">
                        <select class="form-select text-sm" data-material-type="${materialType}">
                            <option value="">서플라이어 선택</option>
                            ${this.getAvailableSuppliers(materialType).map(supplier => 
                                `<option value="${supplier.id}">${supplier.supplier_name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = groupsHTML;
    }

    autoGroupItems() {
        // 자재 유형별 최적 서플라이어 자동 선택
        const selects = document.querySelectorAll('#material-groups select');
        
        selects.forEach(select => {
            const materialType = select.dataset.materialType;
            const suppliers = this.getAvailableSuppliers(materialType);
            
            if (suppliers.length > 0) {
                // 평가가 가장 높은 서플라이어 선택
                const bestSupplier = suppliers.reduce((prev, current) => 
                    (current.rating > prev.rating) ? current : prev
                );
                select.value = bestSupplier.id;
            }
        });
        
        this.app.showToast('자재별 최적 서플라이어가 자동 선택되었습니다.', 'success');
    }

    getAvailableSuppliers(materialType) {
        return this.app.suppliers.filter(supplier => 
            supplier.specialization && supplier.specialization.includes(materialType) && supplier.status === '활성'
        );
    }

    renderMTOPackagesPreview() {
        // 그룹별 서플라이어 선택 정보 수집
        const groups = ArrayUtils.groupBy(this.selectedBOMItems, 'material_type');
        const selects = document.querySelectorAll('#material-groups select');
        
        const mtoPackages = [];
        
        selects.forEach(select => {
            const materialType = select.dataset.materialType;
            const supplierId = select.value;
            
            if (supplierId && groups[materialType]) {
                const supplier = this.app.suppliers.find(s => s.id === supplierId);
                const items = groups[materialType];
                
                mtoPackages.push({
                    materialType,
                    supplier,
                    items,
                    totalWeight: items.reduce((sum, item) => sum + (item.weight || 0), 0),
                    totalItems: items.length
                });
            }
        });
        
        const container = document.getElementById('mto-packages-preview');
        if (!container) return;

        const packagesHTML = mtoPackages.map((pkg, index) => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center mb-3">
                    <h5 class="font-medium">MTO 패키지 #${index + 1}</h5>
                    <span class="status-badge status-progress">생성 예정</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-medium">서플라이어:</span> ${pkg.supplier.supplier_name}
                    </div>
                    <div>
                        <span class="font-medium">자재 유형:</span> ${pkg.materialType}
                    </div>
                    <div>
                        <span class="font-medium">아이템 수:</span> ${pkg.totalItems}개
                    </div>
                    <div>
                        <span class="font-medium">총 중량:</span> ${NumberUtils.formatWeight(pkg.totalWeight)}
                    </div>
                </div>
                <div class="mt-3">
                    <label class="form-label">패키지명</label>
                    <input type="text" class="form-input" 
                           value="${this.currentProject.project_name}_${pkg.materialType}_${pkg.supplier.supplier_name}"
                           data-package-index="${index}">
                </div>
            </div>
        `).join('');

        container.innerHTML = packagesHTML;
        
        // 패키지 정보 저장
        this.mtoPackagesToCreate = mtoPackages;
    }

    async createMTOPackages() {
        if (!this.mtoPackagesToCreate || this.mtoPackagesToCreate.length === 0) {
            this.app.showToast('생성할 MTO 패키지가 없습니다.', 'warning');
            return;
        }

        try {
            this.app.showLoading(true);
            
            const createdPackages = [];
            
            for (let i = 0; i < this.mtoPackagesToCreate.length; i++) {
                const pkg = this.mtoPackagesToCreate[i];
                const nameInput = document.querySelector(`input[data-package-index="${i}"]`);
                const packageName = nameInput ? nameInput.value : `${this.currentProject.project_name}_${pkg.materialType}`;
                
                const mtoData = {
                    project_id: this.currentProject.id,
                    supplier_id: pkg.supplier.id,
                    package_name: packageName,
                    bom_items: pkg.items.map(item => item.id),
                    status: '작성중',
                    created_date: DateUtils.getCurrentDateTime(),
                    total_weight: pkg.totalWeight,
                    total_items: pkg.totalItems
                };
                
                const createdPackage = await this.app.createRecord('mto_packages', mtoData);
                createdPackages.push(createdPackage);
                
                // BOM 아이템들의 supplier_category 업데이트
                for (const item of pkg.items) {
                    try {
                        await this.app.updateRecord('bom_items', item.id, {
                            supplier_category: pkg.supplier.supplier_name
                        });
                    } catch (error) {
                        console.error(`BOM 아이템 ${item.id} 업데이트 실패:`, error);
                    }
                }
            }
            
            this.currentMTOPackages.push(...createdPackages);
            
            // UI 새로고침
            this.renderMTOPackagesList(this.currentMTOPackages);
            this.app.updateDashboardStats();
            
            // 마법사 초기화
            this.resetWizard();
            
            this.app.addRecentActivity(`MTO 패키지 생성: ${createdPackages.length}개 패키지`, 'success');
            this.app.showToast(`${createdPackages.length}개의 MTO 패키지가 성공적으로 생성되었습니다.`, 'success');
            
        } catch (error) {
            console.error('MTO 패키지 생성 실패:', error);
            this.app.showToast('MTO 패키지 생성 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    resetWizard() {
        // 마법사 상태 초기화
        document.getElementById('mto-project-select').value = '';
        document.getElementById('project-info').classList.add('hidden');
        document.getElementById('wizard-next-btn').disabled = true;
        
        // 1단계로 돌아가기
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));
        document.getElementById('step-1').classList.remove('hidden');
        
        // 진행률 초기화
        document.getElementById('wizard-progress-fill').style.width = '25%';
        document.getElementById('wizard-progress-text').textContent = '1/4 단계';
        
        // 데이터 초기화
        this.currentProject = null;
        this.availableBOMItems = [];
        this.selectedBOMItems = [];
        this.mtoPackagesToCreate = [];
    }

    renderMTOPackagesList(packages) {
        const container = document.getElementById('mto-packages-list');
        if (!container) return;

        if (packages.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-box-open text-3xl mb-2 block"></i>
                    생성된 MTO 패키지가 없습니다.
                </div>
            `;
            return;
        }

        container.innerHTML = packages.map(pkg => this.renderMTOPackageCard(pkg)).join('');
    }

    renderMTOPackageCard(mtoPackage) {
        const project = this.app.projects.find(p => p.id === mtoPackage.project_id);
        const supplier = this.app.suppliers.find(s => s.id === mtoPackage.supplier_id);
        const statusClass = this.getMTOStatusClass(mtoPackage.status);
        const createdDate = DateUtils.formatRelative(mtoPackage.created_date);

        return `
            <div class="p-6 hover:bg-gray-50 transition duration-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-800 mb-1">${mtoPackage.package_name}</h4>
                        <div class="text-sm text-gray-600">
                            ${project ? project.project_name : '알 수 없는 프로젝트'} → 
                            ${supplier ? supplier.supplier_name : '알 수 없는 서플라이어'}
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">${mtoPackage.status}</span>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                        <span class="font-medium">아이템 수:</span> ${NumberUtils.format(mtoPackage.total_items)}개
                    </div>
                    <div>
                        <span class="font-medium">총 중량:</span> ${NumberUtils.formatWeight(mtoPackage.total_weight)}
                    </div>
                    <div>
                        <span class="font-medium">생성일:</span> ${createdDate}
                    </div>
                    <div>
                        <span class="font-medium">상태:</span> ${mtoPackage.status}
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                        ${Array.isArray(mtoPackage.bom_items) ? mtoPackage.bom_items.length : 0}개 BOM 아이템 포함
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="mtoManager.viewMTODetail('${mtoPackage.id}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm">
                            <i class="fas fa-eye mr-1"></i>상세보기
                        </button>
                        <button onclick="mtoManager.downloadMTO('${mtoPackage.id}')" 
                                class="text-green-600 hover:text-green-800 text-sm">
                            <i class="fas fa-download mr-1"></i>다운로드
                        </button>
                        <button onclick="mtoManager.sendMTO('${mtoPackage.id}')" 
                                class="text-purple-600 hover:text-purple-800 text-sm">
                            <i class="fas fa-paper-plane mr-1"></i>전송
                        </button>
                        <button onclick="mtoManager.deleteMTO('${mtoPackage.id}')" 
                                class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupMTOFilters() {
        // MTO 필터링 기능 구현
        const projectFilter = document.getElementById('mto-project-filter');
        const statusFilter = document.getElementById('mto-status-filter');
        
        const applyFilters = () => {
            let filtered = [...this.currentMTOPackages];
            
            const projectId = projectFilter?.value || '';
            if (projectId) {
                filtered = filtered.filter(pkg => pkg.project_id === projectId);
            }
            
            const status = statusFilter?.value || '';
            if (status) {
                filtered = filtered.filter(pkg => pkg.status === status);
            }
            
            this.renderMTOPackagesList(filtered);
        };
        
        if (projectFilter) {
            projectFilter.addEventListener('change', applyFilters);
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }
    }

    setupMTOActions() {
        // 전체 내보내기 버튼
        const exportAllBtn = document.getElementById('export-all-mto-btn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportAllMTO());
        }
    }

    // MTO 관련 액션 메서드들
    async viewMTODetail(mtoId) {
        // MTO 상세보기 모달 표시
        this.app.showToast('MTO 상세보기 기능은 추후 구현 예정입니다.', 'info');
    }

    async downloadMTO(mtoId) {
        const mtoPackage = this.currentMTOPackages.find(pkg => pkg.id === mtoId);
        if (!mtoPackage) return;

        // BOM 아이템 상세 정보 가져오기
        const bomItemIds = Array.isArray(mtoPackage.bom_items) ? mtoPackage.bom_items : [];
        const bomItems = [];
        
        for (const itemId of bomItemIds) {
            try {
                const response = await fetch(`tables/bom_items/${itemId}`);
                if (response.ok) {
                    const item = await response.json();
                    bomItems.push(item);
                }
            } catch (error) {
                console.error(`BOM 아이템 ${itemId} 로드 실패:`, error);
            }
        }

        const exportData = bomItems.map(item => ({
            '도면번호': item.drawing_number,
            '아이템명': item.item_name,
            '아이템코드': item.item_code,
            '자재유형': item.material_type || '',
            '사양': item.specifications || '',
            '치수': item.dimensions || '',
            '무게(kg)': item.weight || 0,
            '수량': item.quantity || 1,
            '비고': item.notes || ''
        }));

        const filename = `MTO_${mtoPackage.package_name}_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.showToast('MTO 패키지가 다운로드되었습니다.', 'success');
    }

    async sendMTO(mtoId) {
        // MTO 전송 기능
        this.app.showToast('MTO 전송 기능은 추후 구현 예정입니다.', 'info');
    }

    async deleteMTO(mtoId) {
        const mtoPackage = this.currentMTOPackages.find(pkg => pkg.id === mtoId);
        if (!mtoPackage) return;

        if (!confirm(`MTO 패키지 "${mtoPackage.package_name}"를 정말 삭제하시겠습니까?`)) {
            return;
        }

        try {
            this.app.showLoading(true);
            
            await this.app.deleteRecord('mto_packages', mtoId);
            
            // 로컬 데이터에서 제거
            this.currentMTOPackages = this.currentMTOPackages.filter(pkg => pkg.id !== mtoId);
            
            // UI 새로고침
            this.renderMTOPackagesList(this.currentMTOPackages);
            this.app.updateDashboardStats();
            
            this.app.addRecentActivity(`MTO 패키지 삭제: ${mtoPackage.package_name}`, 'warning');
            this.app.showToast('MTO 패키지가 삭제되었습니다.', 'success');
            
        } catch (error) {
            console.error('MTO 패키지 삭제 실패:', error);
            this.app.showToast('MTO 패키지 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    exportAllMTO() {
        if (this.currentMTOPackages.length === 0) {
            this.app.showToast('내보낼 MTO 패키지가 없습니다.', 'warning');
            return;
        }

        const exportData = this.currentMTOPackages.map(pkg => {
            const project = this.app.projects.find(p => p.id === pkg.project_id);
            const supplier = this.app.suppliers.find(s => s.id === pkg.supplier_id);
            
            return {
                'MTO패키지명': pkg.package_name,
                '프로젝트': project ? project.project_name : '',
                '서플라이어': supplier ? supplier.supplier_name : '',
                '아이템수': pkg.total_items,
                '총중량(kg)': pkg.total_weight,
                '상태': pkg.status,
                '생성일': DateUtils.formatKorean(pkg.created_date)
            };
        });

        const filename = `CS_Wind_MTO_Packages_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.addRecentActivity(`MTO 패키지 전체 내보내기: ${this.currentMTOPackages.length}건`, 'info');
        this.app.showToast('MTO 패키지 목록이 내보내졌습니다.', 'success');
    }

    // 유틸리티 메서드들
    getDrawingTypeClass(type) {
        switch (type) {
            case '실물도면': return 'drawing-type-actual';
            case '스펙도면': return 'drawing-type-spec';
            case '퀄리티도면': return 'drawing-type-quality';
            case '워크인스트럭션': return 'drawing-type-instruction';
            default: return 'status-pending';
        }
    }

    getMaterialTypeClass(type) {
        switch (type) {
            case '철판': return 'material-steel';
            case '플레이트류': return 'material-plate';
            case '도료': return 'material-paint';
            case '전기제품': return 'material-electric';
            case '모듈조립품': return 'material-module';
            default: return 'status-pending';
        }
    }

    getMTOStatusClass(status) {
        switch (status) {
            case '작성중': return 'status-progress';
            case '완료': return 'status-completed';
            case '전송완료': return 'status-completed';
            default: return 'status-pending';
        }
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.mtoManager = new MTOManager(window.csWindApp);
        }
    }, 100);
});