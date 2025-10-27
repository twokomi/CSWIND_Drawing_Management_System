// 메인 애플리케이션 스크립트

class CSWindApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.projects = [];
        this.bomItems = [];
        this.suppliers = [];
        this.mtoPackages = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateDashboardStats();
        
        // 초기 샘플 데이터 로드
        await this.loadSampleData();
    }

    setupEventListeners() {
        // 탭 네비게이션
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.id.replace('nav-', '');
                this.switchTab(tabId);
            });
        });

        // 새 프로젝트 폼
        const newProjectForm = document.getElementById('new-project-form');
        if (newProjectForm) {
            newProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewProject();
            });
        }

        // 차트 새로고침 버튼
        setTimeout(() => {
            const refreshChartsBtn = document.getElementById('refresh-charts-btn');
            if (refreshChartsBtn) {
                refreshChartsBtn.addEventListener('click', () => {
                    if (window.chartManager) {
                        window.chartManager.updateCharts();
                        this.showToast('차트가 새로고침되었습니다.', 'success');
                    }
                });
            }

            // 드롭다운 메뉴 이벤트
            const dropdownBtns = document.querySelectorAll('.dropdown > button');
            dropdownBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdown = btn.parentElement;
                    
                    // 다른 드롭다운 닫기
                    document.querySelectorAll('.dropdown.open').forEach(d => {
                        if (d !== dropdown) d.classList.remove('open');
                    });
                    
                    dropdown.classList.toggle('open');
                });
            });

            // 문서 클릭시 드롭다운 닫기
            document.addEventListener('click', () => {
                document.querySelectorAll('.dropdown.open').forEach(d => {
                    d.classList.remove('open');
                });
            });
        }, 1000);
    }

    switchTab(tabName) {
        // 모든 탭 비활성화
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.classList.add('text-gray-500');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // 선택된 탭 활성화
        const activeTab = document.getElementById(`nav-${tabName}`);
        const activeContent = document.getElementById(`tab-${tabName}`);
        
        if (activeTab && activeContent) {
            activeTab.classList.add('active');
            activeTab.classList.remove('text-gray-500');
            activeContent.classList.remove('hidden');
            
            this.currentTab = tabName;
            
            // 탭별 특별한 로딩 로직
            switch(tabName) {
                case 'projects':
                    this.loadProjectsList();
                    break;
                case 'bom':
                    this.loadBOMAnalysis();
                    break;
                case 'suppliers':
                    this.loadSuppliersList();
                    break;
                case 'mto':
                    this.loadMTOList();
                    break;
            }
        }
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // API를 통해 초기 데이터 로드
            const [projects, bomItems, suppliers, mtoPackages] = await Promise.all([
                this.fetchTableData('projects'),
                this.fetchTableData('bom_items'),
                this.fetchTableData('suppliers'),
                this.fetchTableData('mto_packages')
            ]);
            
            this.projects = projects.data || [];
            this.bomItems = bomItems.data || [];
            this.suppliers = suppliers.data || [];
            this.mtoPackages = mtoPackages.data || [];
            
        } catch (error) {
            console.error('초기 데이터 로드 실패:', error);
            this.showToast('데이터 로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadSampleData() {
        // 샘플 프로젝트 데이터가 없다면 생성
        if (this.projects.length === 0) {
            const sampleProjects = [
                {
                    project_name: '현대중공업-HVS-112-5.0MW',
                    customer_name: '현대중공업',
                    tower_model: 'HVS-112-5.0MW',
                    project_description: '5MW급 풍력타워 제조 프로젝트 - 울산 신규 단지',
                    status: '진행중',
                    created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    project_name: '두산에너빌리티-DS-140-6.0MW',
                    customer_name: '두산에너빌리티',
                    tower_model: 'DS-140-6.0MW',
                    project_description: '6MW급 해상풍력타워 제조 - 제주 해상풍력단지',
                    status: '진행중',
                    created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    project_name: 'KEPCO-KW-90-3.5MW',
                    customer_name: '한국전력공사',
                    tower_model: 'KW-90-3.5MW',
                    project_description: '3.5MW급 육상풍력타워 - 강원도 풍력단지',
                    status: '완료',
                    created_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];

            for (const project of sampleProjects) {
                try {
                    const response = await fetch('tables/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(project)
                    });
                    const createdProject = await response.json();
                    this.projects.push(createdProject);
                } catch (error) {
                    console.error('샘플 프로젝트 생성 실패:', error);
                }
            }
        }

        // 샘플 BOM 데이터
        if (this.bomItems.length === 0 && this.projects.length > 0) {
            const firstProject = this.projects[0];
            const sampleBOMItems = [
                // LLT - 고강도 강재
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-001-BASE',
                    drawing_type: '실물도면',
                    item_name: '타워 베이스 플레이트',
                    item_code: 'CSW-BP-001',
                    material_type: '고강도 강재',
                    specifications: 'S690QL, t=50mm',
                    dimensions: '4000x4000x50',
                    weight: 6280,
                    quantity: 4,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '베이스 연결용 주요 구조물'
                },
                // LLT - 플랜지류
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-002-FLANGE',
                    drawing_type: '실물도면',
                    item_name: '연결 플랜지',
                    item_code: 'CSW-FL-001',
                    material_type: '플랜지류',
                    specifications: 'SM520, CNC 가공',
                    dimensions: '2500x2500x80',
                    weight: 3920,
                    quantity: 6,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '타워 구간 연결용'
                },
                // LLT - 일반 구조강재
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-003-TOWER',
                    drawing_type: '실물도면',
                    item_name: '타워 몸체 원통형 쉘',
                    item_code: 'CSW-TS-001',
                    material_type: '구조용강',
                    specifications: 'S355JR, t=25mm',
                    dimensions: '4200x12000x25',
                    weight: 8945,
                    quantity: 3,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '타워 주 구조체'
                },
                // 모듈단위 조립품 - 플랫폼 조립체
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-004-PLATFORM',
                    drawing_type: '조립도면',
                    item_name: '서비스 플랫폼 조립체',
                    item_code: 'CSW-PL-001',
                    material_type: '조립품',
                    specifications: 'SS400 + 안전난간 + 계단',
                    dimensions: '3000x2000x1200',
                    weight: 450,
                    quantity: 2,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '타워 내부 접근용 플랫폼'
                },
                // Large Parts - 사다리
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-005-LADDER',
                    drawing_type: '실물도면',
                    item_name: '접근 사다리',
                    item_code: 'CSW-LD-001',
                    material_type: '구조물',
                    specifications: 'SS400, 아연도금',
                    dimensions: '600x15000x300',
                    weight: 180,
                    quantity: 1,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '타워 상부 접근용'
                },
                // Small Parts - 브라켓
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-006-BRACKET',
                    drawing_type: '실물도면',
                    item_name: '케이블 브라켓',
                    item_code: 'CSW-BR-001',
                    material_type: '소형부품',
                    specifications: 'SS400, t=6mm',
                    dimensions: '200x150x100',
                    weight: 2.5,
                    quantity: 24,
                    supplier_category: '',
                    is_mto_item: false,
                    notes: '케이블 고정용 브라켓'
                },
                // Small Parts - 볼트/너트
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-007-BOLT',
                    drawing_type: '규격도면',
                    item_name: 'M20 고장력 볼트 세트',
                    item_code: 'CSW-BT-001',
                    material_type: '체결부품',
                    specifications: 'SCM435, 10.9급, 아연도금',
                    dimensions: 'M20x80',
                    weight: 0.35,
                    quantity: 200,
                    supplier_category: '',
                    is_mto_item: false,
                    notes: '주요 구조 체결용'
                },
                // 전장품 - 케이블
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-008-CABLE',
                    drawing_type: '실물도면',
                    item_name: '전력 케이블',
                    item_code: 'CSW-CB-001',
                    material_type: '전기제품',
                    specifications: '22.9kV, XLPE, 3C-240mm²',
                    dimensions: '길이 120m',
                    weight: 850,
                    quantity: 1,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '타워 내부 전력 전송용'
                },
                // 전장품 - 조명
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-009-LIGHT',
                    drawing_type: '실물도면',
                    item_name: 'LED 항공등',
                    item_code: 'CSW-LT-001',
                    material_type: '조명설비',
                    specifications: 'LED, IP65, 빨간색 점멸',
                    dimensions: '300x300x150',
                    weight: 8.2,
                    quantity: 4,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '항공 안전용 경고등'
                },
                // 전장품 - 접속함
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-010-JUNCTION',
                    drawing_type: '실물도면',
                    item_name: '전력 접속함',
                    item_code: 'CSW-JB-001',
                    material_type: '전기함체',
                    specifications: 'SS400, IP54, 분전반',
                    dimensions: '800x600x300',
                    weight: 45,
                    quantity: 2,
                    supplier_category: '',
                    is_mto_item: true,
                    notes: '전력 분배 및 제어용'
                },
                // 기타 - 도료
                {
                    project_id: firstProject.id,
                    drawing_number: 'DWG-011-PAINT',
                    drawing_type: '스펙도면',
                    item_name: '방식 도료 시스템',
                    item_code: 'CSW-PT-001',
                    material_type: '도료',
                    specifications: '아연 프라이머 + 에폭시 중도 + 폴리우레탄 상도',
                    dimensions: 'N/A',
                    weight: 0,
                    quantity: 1,
                    supplier_category: '',
                    is_mto_item: false,
                    notes: '도장 사양서'
                }
            ];

            for (const bomItem of sampleBOMItems) {
                try {
                    const response = await fetch('tables/bom_items', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bomItem)
                    });
                    const createdItem = await response.json();
                    this.bomItems.push(createdItem);
                } catch (error) {
                    console.error('샘플 BOM 아이템 생성 실패:', error);
                }
            }
        }

        // 샘플 서플라이어 데이터
        if (this.suppliers.length === 0) {
            const sampleSuppliers = [
                {
                    supplier_name: '포스코강판',
                    contact_info: '02-3457-0114',
                    specialization: ['철판', '플레이트류'],
                    size_capacity: '20m x 3m',
                    weight_capacity: 50000,
                    rating: 5,
                    status: '활성'
                },
                {
                    supplier_name: '효성중공업',
                    contact_info: '052-230-4000',
                    specialization: ['전기제품', '모듈조립품'],
                    size_capacity: '10m x 2m',
                    weight_capacity: 10000,
                    rating: 4,
                    status: '활성'
                },
                {
                    supplier_name: '제일도료공업',
                    contact_info: '031-499-7700',
                    specialization: ['도료'],
                    size_capacity: 'N/A',
                    weight_capacity: 1000,
                    rating: 4,
                    status: '활성'
                }
            ];

            for (const supplier of sampleSuppliers) {
                try {
                    const response = await fetch('tables/suppliers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(supplier)
                    });
                    const createdSupplier = await response.json();
                    this.suppliers.push(createdSupplier);
                } catch (error) {
                    console.error('샘플 서플라이어 생성 실패:', error);
                }
            }
        }
    }

    async fetchTableData(tableName, params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await fetch(`tables/${tableName}?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`테이블 데이터 로드 실패 (${tableName}):`, error);
            return { data: [], total: 0 };
        }
    }

    async createRecord(tableName, data) {
        try {
            const response = await fetch(`tables/${tableName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`레코드 생성 실패 (${tableName}):`, error);
            throw error;
        }
    }

    async updateRecord(tableName, recordId, data) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`레코드 업데이트 실패 (${tableName}):`, error);
            throw error;
        }
    }

    async deleteRecord(tableName, recordId) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error(`레코드 삭제 실패 (${tableName}):`, error);
            throw error;
        }
    }

    async createNewProject() {
        const customerName = document.getElementById('customer-name').value;
        const towerModel = document.getElementById('tower-model').value;
        const projectDescription = document.getElementById('project-description').value;

        if (!customerName || !towerModel) {
            this.showToast('고객사명과 타워 모델은 필수 입력 항목입니다.', 'error');
            return;
        }

        const projectData = {
            project_name: `${customerName}-${towerModel}`,
            customer_name: customerName,
            tower_model: towerModel,
            project_description: projectDescription,
            status: '진행중',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        };

        try {
            this.showLoading(true);
            const createdProject = await this.createRecord('projects', projectData);
            this.projects.push(createdProject);
            
            // 폼 초기화
            document.getElementById('new-project-form').reset();
            
            // 통계 업데이트
            this.updateDashboardStats();
            
            // 활동 로그 추가
            this.addRecentActivity(`새 프로젝트 생성: ${createdProject.project_name}`, 'success');
            
            this.showToast('프로젝트가 성공적으로 생성되었습니다.', 'success');
            
        } catch (error) {
            console.error('프로젝트 생성 실패:', error);
            this.showToast('프로젝트 생성 중 오류가 발생했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats() {
        document.getElementById('stat-projects').textContent = this.projects.length;
        document.getElementById('stat-bom-items').textContent = this.bomItems.length;
        document.getElementById('stat-suppliers').textContent = this.suppliers.length;
        document.getElementById('stat-mtos').textContent = this.mtoPackages.length;
    }

    addRecentActivity(message, type = 'info') {
        const container = document.getElementById('recent-activities');
        const timestamp = new Date().toLocaleString('ko-KR');
        
        // 빈 상태 메시지 제거
        const emptyState = container.querySelector('.text-gray-500');
        if (emptyState) {
            emptyState.remove();
        }
        
        const iconClass = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            info: 'fas fa-info-circle text-blue-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500'
        }[type] || 'fas fa-info-circle text-blue-500';
        
        const activityElement = document.createElement('div');
        activityElement.className = 'flex items-start space-x-3 p-3 bg-gray-50 rounded-lg';
        activityElement.innerHTML = `
            <i class="${iconClass}"></i>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800">${message}</p>
                <p class="text-xs text-gray-500">${timestamp}</p>
            </div>
        `;
        
        container.insertBefore(activityElement, container.firstChild);
        
        // 최대 10개 활동만 유지
        const activities = container.children;
        if (activities.length > 10) {
            container.removeChild(activities[activities.length - 1]);
        }
    }

    loadProjectsList() {
        // projects.js에서 구현될 예정
        console.log('프로젝트 목록 로드');
    }

    loadBOMAnalysis() {
        // 기본 BOM 분석과 고급 BOM 분석 전환 이벤트 설정
        this.setupBOMAnalysisEvents();
        
        // 기본 BOM 분석기 초기화
        if (typeof BOMAnalyzer !== 'undefined' && !this.bomAnalyzer) {
            this.bomAnalyzer = new BOMAnalyzer(this);
            console.log('BOM 분석기 초기화 완료');
        }
        
        // 고급 BOM 매니저 초기화
        if (typeof AdvancedBOMManager !== 'undefined' && !this.advancedBOMManager) {
            this.advancedBOMManager = new AdvancedBOMManager(this);
            console.log('고급 BOM 매니저 초기화 완료');
        }
        
        console.log('BOM 분석 로드 완료');
    }
    
    setupBOMAnalysisEvents() {
        // 이벤트 설정을 지연시켜 DOM이 완전히 로드된 후 실행
        setTimeout(() => {
            const basicBOMBtn = document.getElementById('btn-show-basic-bom');
            const advancedBOMBtn = document.getElementById('btn-show-advanced-bom');
            const basicInterface = document.getElementById('basic-bom-interface');
            const advancedInterface = document.getElementById('advanced-bom-interface');
            
            if (basicBOMBtn && advancedBOMBtn && basicInterface && advancedInterface) {
                basicBOMBtn.addEventListener('click', () => {
                    basicInterface.classList.remove('hidden');
                    advancedInterface.classList.add('hidden');
                    basicBOMBtn.classList.add('bg-blue-600', 'text-white');
                    basicBOMBtn.classList.remove('bg-gray-600');
                    advancedBOMBtn.classList.add('bg-gray-600');
                    advancedBOMBtn.classList.remove('bg-blue-600', 'text-white');
                    this.showToast('기본 BOM 분석 모드로 전환했습니다.', 'info');
                });
                
                advancedBOMBtn.addEventListener('click', () => {
                    advancedInterface.classList.remove('hidden');
                    basicInterface.classList.add('hidden');
                    advancedBOMBtn.classList.add('bg-blue-600', 'text-white');
                    advancedBOMBtn.classList.remove('bg-gray-600');
                    basicBOMBtn.classList.add('bg-gray-600');
                    basicBOMBtn.classList.remove('bg-blue-600', 'text-white');
                    this.showToast('AI 고급 BOM 분석 모드로 전환했습니다.', 'success');
                    
                    // 고급 BOM 매니저 지연 초기화
                    if (typeof AdvancedBOMManager !== 'undefined' && !this.advancedBOMManager) {
                        console.log('고급 BOM 매니저 생성 시작...');
                        setTimeout(() => {
                            try {
                                this.advancedBOMManager = new AdvancedBOMManager(this);
                                console.log('고급 BOM 매니저 생성 완료');
                            } catch (error) {
                                console.error('고급 BOM 매니저 생성 실패:', error);
                            }
                        }, 500);
                    } else {
                        if (typeof AdvancedBOMManager === 'undefined') {
                            console.error('AdvancedBOMManager 클래스를 찾을 수 없습니다');
                        } else {
                            console.log('고급 BOM 매니저가 이미 존재합니다');
                        }
                    }
                });
            }
        }, 500);
    }

    loadSuppliersList() {
        // 서플라이어 패키지 매니저 초기화
        if (typeof SupplierPackageManager !== 'undefined' && !this.supplierManager) {
            this.supplierManager = new SupplierPackageManager(this);
            console.log('서플라이어 패키지 매니저 초기화 완료');
        }
        console.log('서플라이어 목록 로드');
    }

    loadMTOList() {
        // 서플라이어 관리자가 있으면 결재 완료된 PO 아이템 목록 로드
        if (this.supplierManager) {
            this.supplierManager.loadApprovedPOItems();
        } else {
            console.log('PO 목록 로드 - 서플라이어 관리자 대기 중');
        }
    }

    showLoading(show = true) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // 같은 메시지나 유사한 메시지의 토스트가 이미 있으면 중복 생성 방지
        const existingToasts = container.querySelectorAll('.toast span');
        for (const toast of existingToasts) {
            if (toast.textContent === message || 
                (message.includes('승인') && toast.textContent.includes('승인'))) {
                return; // 중복 또는 유사 메시지는 표시하지 않음
            }
        }

        // 최대 3개까지만 토스트 유지 (오래된 것부터 제거)
        const currentToasts = container.querySelectorAll('.toast');
        if (currentToasts.length >= 3) {
            currentToasts[0].remove();
        }

        const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast ${bgColors[type] || bgColors.info} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300 transform translate-x-0 opacity-100`;
        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.removeToast('${toastId}')" class="text-white hover:text-gray-200 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 애니메이션과 함께 추가
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        container.appendChild(toast);
        
        // 슬라이드 인 애니메이션
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // 자동 제거
        setTimeout(() => {
            this.removeToast(toastId);
        }, duration);
    }

    removeToast(toastId) {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            // 슬라이드 아웃 애니메이션
            toastElement.style.transform = 'translateX(100%)';
            toastElement.style.opacity = '0';
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.remove();
                }
            }, 300);
        }
    }

    // 유틸리티 메서드들
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatNumber(number) {
        return new Intl.NumberFormat('ko-KR').format(number);
    }

    generateId() {
        return 'csw_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.csWindApp = new CSWindApp();
});

// 전역 함수들 (HTML에서 직접 호출용)
function showTab(tabName) {
    if (window.csWindApp) {
        window.csWindApp.switchTab(tabName);
    }
}

function showToast(message, type = 'info') {
    if (window.csWindApp) {
        window.csWindApp.showToast(message, type);
    }
}

// PDF 모달 관련 전역 함수들
function openPDFModal(drawingNumber, pdfUrl) {
    const modal = document.getElementById('pdf-modal');
    const title = document.getElementById('pdf-modal-title');
    const body = document.getElementById('pdf-modal-body');
    
    if (modal && title && body) {
        title.textContent = `도면 뷰어 - ${drawingNumber}`;
        
        // PDF 임베드 HTML 생성 (실제로는 pdfUrl을 사용)
        const pdfEmbed = `
            <div class="text-center py-8">
                <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12">
                    <i class="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
                    <h4 class="text-lg font-semibold text-gray-700 mb-2">PDF 도면: ${drawingNumber}</h4>
                    <p class="text-gray-500 mb-4">실제 환경에서는 PDF.js 또는 브라우저 내장 뷰어로 표시됩니다</p>
                    <div class="text-sm text-gray-400">
                        <p>PDF URL: ${pdfUrl || '샘플 도면 데이터'}</p>
                        <p class="mt-2">이 데모에서는 PDF 미리보기가 표시됩니다</p>
                    </div>
                </div>
            </div>
        `;
        
        body.innerHTML = pdfEmbed;
        modal.classList.add('show');
        
        // ESC 키로 모달 닫기
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closePDFModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

function closePDFModal() {
    const modal = document.getElementById('pdf-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 결재 모달 관련 전역 함수들
function closeApprovalModal() {
    const modal = document.getElementById('approval-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// PO 관리 모달 관련 전역 함수들
function closePOModal() {
    const modal = document.getElementById('po-management-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function openPOModal(packageData) {
    const modal = document.getElementById('po-management-modal');
    
    // 현재 패키지 데이터 저장 (협의 시 참조용)
    window.currentPOPackage = packageData;
    
    // PO 기본 정보 설정
    document.getElementById('po-package-number').textContent = packageData.packageNumber;
    document.getElementById('po-issue-date').textContent = new Date().toLocaleDateString('ko-KR');
    
    // 희망 입고일 기본값 설정 (30일 후)
    const desiredDate = new Date();
    desiredDate.setDate(desiredDate.getDate() + 30);
    document.getElementById('po-desired-date').value = desiredDate.toISOString().split('T')[0];
    
    // 기존 협의 이력이 있으면 표시
    if (packageData.poNegotiation) {
        updateNegotiationHistory(packageData);
        if (packageData.poNegotiation.proposedDate) {
            document.getElementById('po-supplier-date').value = packageData.poNegotiation.proposedDate;
            document.getElementById('po-supplier-response').classList.remove('hidden');
            showNegotiationButtons(packageData);
        }
    }
    
    // PO 아이템 목록 표시
    displayPOItems(packageData);
    
    // 이벤트 연결
    document.getElementById('btn-send-po-supplier').onclick = () => sendPOToSupplier(packageData);
    document.getElementById('btn-finalize-po').onclick = () => finalizePO(packageData);
    
    modal.classList.add('show');
}

function displayPOItems(packageData) {
    const container = document.getElementById('po-items-list');
    const items = [];
    
    // 모든 패키지의 아이템 수집
    Object.values(packageData.packages.module).flat().forEach(item => items.push({...item, category: '모듈'}));
    Object.values(packageData.packages.llt).flat().forEach(item => items.push({...item, category: 'LLT'}));
    Object.values(packageData.packages.supplier).flat().forEach(item => items.push({...item, category: '서플라이어'}));
    
    container.innerHTML = `
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-3 py-2 text-left">부품명</th>
                    <th class="px-3 py-2 text-left">도면번호</th>
                    <th class="px-3 py-2 text-left">재질</th>
                    <th class="px-3 py-2 text-center">수량</th>
                    <th class="px-3 py-2 text-center">중량</th>
                    <th class="px-3 py-2 text-center">분류</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr class="border-b">
                        <td class="px-3 py-2">${item.partName}</td>
                        <td class="px-3 py-2 text-blue-600">${item.drawingNumber}</td>
                        <td class="px-3 py-2">${item.material}</td>
                        <td class="px-3 py-2 text-center">${item.quantity} EA</td>
                        <td class="px-3 py-2 text-center">${item.weight} kg</td>
                        <td class="px-3 py-2 text-center">
                            <span class="px-2 py-1 rounded text-xs bg-gray-100">${item.category}</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function sendPOToSupplier(packageData) {
    const desiredDate = document.getElementById('po-desired-date').value;
    
    if (!desiredDate) {
        if (window.csWindApp) {
            window.csWindApp.showToast('희망 입고일을 선택해주세요.', 'warning');
        }
        return;
    }
    
    // PO 협의 상태 설정
    packageData.poNegotiation = {
        status: 'sent_to_supplier',
        requestedDate: desiredDate,
        proposedDate: null,
        negotiationRound: 1,
        history: [
            {
                timestamp: new Date().toISOString(),
                actor: 'SCM팀',
                action: '납기일 요청',
                date: desiredDate,
                comment: '프로젝트 일정에 따른 희망 납기일입니다.'
            }
        ]
    };
    
    // 서플라이어에게 PO 전송 시뮬레이션
    if (window.csWindApp) {
        window.csWindApp.showToast('서플라이어에게 PO가 전송되었습니다.', 'success');
    }
    
    // 서플라이어 응답 시뮬레이션 (3초 후)
    setTimeout(() => {
        simulateSupplierResponse(packageData, desiredDate);
    }, 3000);
}

function simulateSupplierResponse(packageData, desiredDate) {
    // 서플라이어 제안 일정 설정 (희망일 + 2~7일 랜덤)
    const proposedDate = new Date(desiredDate);
    proposedDate.setDate(proposedDate.getDate() + Math.floor(Math.random() * 6) + 2);
    
    packageData.poNegotiation.proposedDate = proposedDate.toISOString().split('T')[0];
    packageData.poNegotiation.status = 'supplier_responded';
    packageData.poNegotiation.history.push({
        timestamp: new Date().toISOString(),
        actor: '서플라이어',
        action: '납기일 제안',
        date: proposedDate.toISOString().split('T')[0],
        comment: '제작 일정 검토 후 가능한 납기일을 제안드립니다.'
    });
    
    // UI 업데이트
    document.getElementById('po-supplier-date').value = proposedDate.toISOString().split('T')[0];
    document.getElementById('po-supplier-response').classList.remove('hidden');
    
    // 협의 이력 표시
    updateNegotiationHistory(packageData);
    
    // 재협의 및 승인 버튼 표시
    showNegotiationButtons(packageData);
    
    if (window.csWindApp) {
        window.csWindApp.showToast('서플라이어가 입고 예정일을 제안했습니다. 승인하거나 재협의해주세요.', 'info');
    }
}

function finalizePO(packageData) {
    const finalDate = document.getElementById('po-supplier-date').value;
    
    if (!finalDate) {
        if (window.csWindApp) {
            window.csWindApp.showToast('서플라이어 제안일을 확인해주세요.', 'warning');
        }
        return;
    }
    
    // PO 확정 처리
    packageData.poConfirmed = true;
    packageData.deliveryDate = finalDate;
    packageData.poStatus = 'confirmed';
    
    // LOT 번호 생성 및 QR 코드 생성 시뮬레이션
    generateLOTNumbers(packageData);
    
    if (window.csWindApp) {
        window.csWindApp.showToast('PO가 확정되었습니다. LOT 번호가 생성됩니다.', 'success');
    }
    
    closePOModal();
}

// 협의 이력 업데이트
function updateNegotiationHistory(packageData) {
    const historyContainer = document.getElementById('po-negotiation-history');
    if (!historyContainer || !packageData.poNegotiation) return;
    
    historyContainer.innerHTML = `
        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-800 mb-2">협의 이력</h4>
            <div class="space-y-2 max-h-32 overflow-y-auto">
                ${packageData.poNegotiation.history.map(h => `
                    <div class="text-sm border-l-4 ${h.actor === 'SCM팀' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'} p-2 rounded">
                        <div class="flex justify-between items-start">
                            <span class="font-medium">${h.actor}</span>
                            <span class="text-xs text-gray-500">${new Date(h.timestamp).toLocaleString('ko-KR')}</span>
                        </div>
                        <div class="mt-1">
                            <strong>${h.action}:</strong> ${h.date}
                        </div>
                        <div class="text-xs text-gray-600 mt-1">${h.comment}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    historyContainer.classList.remove('hidden');
}

// 재협의 및 승인 버튼 표시
function showNegotiationButtons(packageData) {
    let buttonsContainer = document.getElementById('po-negotiation-buttons');
    if (!buttonsContainer) {
        buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'po-negotiation-buttons';
        buttonsContainer.className = 'mt-4 flex space-x-2';
        document.getElementById('po-supplier-response').appendChild(buttonsContainer);
    }
    
    buttonsContainer.innerHTML = `
        <button onclick="approveSupplierDate('${packageData.id || packageData.packageNumber}')" 
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
            <i class="fas fa-check mr-1"></i>제안 승인
        </button>
        <button onclick="renegotiateDate('${packageData.id || packageData.packageNumber}')" 
                class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-sm">
            <i class="fas fa-redo mr-1"></i>재협의
        </button>
        <button onclick="rejectProposal('${packageData.id || packageData.packageNumber}')" 
                class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">
            <i class="fas fa-times mr-1"></i>거절
        </button>
    `;
}

// 서플라이어 제안 승인
function approveSupplierDate(packageId) {
    // 현재 패키지 데이터 찾기 (실제로는 앱 상태에서 관리)
    const packageData = getCurrentPackageData(packageId);
    if (!packageData || !packageData.poNegotiation) return;
    
    packageData.poNegotiation.status = 'approved_by_scm';
    packageData.poNegotiation.history.push({
        timestamp: new Date().toISOString(),
        actor: 'SCM팀',
        action: '제안 승인',
        date: packageData.poNegotiation.proposedDate,
        comment: 'SCM팀에서 서플라이어 제안 날짜를 승인했습니다.'
    });
    
    // PO 확정 처리
    packageData.poConfirmed = true;
    packageData.deliveryDate = packageData.poNegotiation.proposedDate;
    packageData.poStatus = 'confirmed';
    
    updateNegotiationHistory(packageData);
    
    if (window.csWindApp) {
        window.csWindApp.showToast('서플라이어 제안을 승인했습니다. PO가 확정됩니다.', 'success');
    }
    
    // 3초 후 LOT 생성 진행
    setTimeout(() => {
        generateLOTNumbers(packageData);
        closePOModal();
    }, 2000);
}

// 재협의 요청
function renegotiateDate(packageId) {
    const newDate = prompt('새로운 희망 납기일을 입력하세요 (YYYY-MM-DD):');
    if (!newDate) return;
    
    const packageData = getCurrentPackageData(packageId);
    if (!packageData || !packageData.poNegotiation) return;
    
    packageData.poNegotiation.negotiationRound++;
    packageData.poNegotiation.requestedDate = newDate;
    packageData.poNegotiation.status = 'renegotiation_requested';
    packageData.poNegotiation.history.push({
        timestamp: new Date().toISOString(),
        actor: 'SCM팀',
        action: '재협의 요청',
        date: newDate,
        comment: '일정 조정이 필요하여 새로운 납기일을 요청합니다.'
    });
    
    document.getElementById('po-desired-date').value = newDate;
    updateNegotiationHistory(packageData);
    
    if (window.csWindApp) {
        window.csWindApp.showToast('재협의 요청이 서플라이어에게 전송되었습니다.', 'info');
    }
    
    // 서플라이어 재응답 시뮬레이션 (5초 후)
    setTimeout(() => {
        simulateSupplierResponse(packageData, newDate);
    }, 5000);
}

// 제안 거절
function rejectProposal(packageId) {
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;
    
    const packageData = getCurrentPackageData(packageId);
    if (!packageData || !packageData.poNegotiation) return;
    
    packageData.poNegotiation.status = 'rejected_by_scm';
    packageData.poNegotiation.history.push({
        timestamp: new Date().toISOString(),
        actor: 'SCM팀',
        action: '제안 거절',
        date: packageData.poNegotiation.proposedDate,
        comment: `거절 사유: ${reason}`
    });
    
    updateNegotiationHistory(packageData);
    
    if (window.csWindApp) {
        window.csWindApp.showToast('서플라이어 제안을 거절했습니다. 새로운 협의가 필요합니다.', 'warning');
    }
}

// 현재 패키지 데이터 반환 (임시 - 실제로는 앱 상태 관리)
function getCurrentPackageData(packageId) {
    // 임시로 전역 변수 또는 세션에서 관리
    if (!window.currentPOPackage) return null;
    return window.currentPOPackage;
}

// 패키지 내보내기 확인 팝업 관련 함수들
function closeExportConfirmationModal() {
    document.getElementById('export-confirmation-modal').classList.remove('show');
}

function confirmPackageExport() {
    // BOM 고급 분석 매니저의 확정 처리 호출
    if (window.csWindApp && window.csWindApp.advancedBOMManager) {
        window.csWindApp.advancedBOMManager.confirmPackageExport();
    }
}

function generateLOTNumbers(packageData) {
    // LOT 번호 자동 생성
    const lotNumbers = [];
    const items = [];
    
    Object.values(packageData.packages.module).flat().forEach(item => items.push(item));
    Object.values(packageData.packages.llt).flat().forEach(item => items.push(item));
    Object.values(packageData.packages.supplier).flat().forEach(item => items.push(item));
    
    // 파레트 단위로 LOT 생성 (10개씩 묶기)
    for (let i = 0; i < items.length; i += 10) {
        const lotId = `LOT-${packageData.packageNumber}-${String(Math.floor(i/10) + 1).padStart(3, '0')}`;
        const qrCode = generateQRCode(lotId);
        
        lotNumbers.push({
            lotId: lotId,
            items: items.slice(i, i + 10),
            qrCode: qrCode,
            paletteNumber: `PLT-${String(Math.floor(i/10) + 1).padStart(3, '0')}`
        });
    }
    
    packageData.lotNumbers = lotNumbers;
    
    // LOT 관리 섹션 업데이트
    updateLOTManagementSection(lotNumbers);
    
    console.log('LOT 번호 생성 완료:', lotNumbers);
}

function generateQRCode(lotId) {
    // QR 코드 생성 시뮬레이션 (실제로는 QR 라이브러리 사용)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lotId)}`;
}

function updateLOTManagementSection(lotNumbers) {
    const container = document.getElementById('lot-management-section');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${lotNumbers.map(lot => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h5 class="font-semibold text-gray-800">${lot.lotId}</h5>
                            <p class="text-sm text-gray-600">파레트: ${lot.paletteNumber}</p>
                        </div>
                        <img src="${lot.qrCode}" alt="QR Code" class="w-16 h-16">
                    </div>
                    <div class="text-sm">
                        <div class="text-gray-600 mb-2">포함 아이템: ${lot.items.length}개</div>
                        <div class="max-h-20 overflow-y-auto text-xs text-gray-500">
                            ${lot.items.map(item => item.partName).join(', ')}
                        </div>
                    </div>
                    <div class="mt-3 flex space-x-2">
                        <button onclick="downloadQRCode('${lot.lotId}')" 
                                class="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                            QR 다운로드
                        </button>
                        <button onclick="viewLOTDetails('${lot.lotId}')" 
                                class="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">
                            상세보기
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function downloadQRCode(lotId) {
    if (window.csWindApp) {
        window.csWindApp.showToast(`${lotId} QR 코드를 다운로드합니다.`, 'info');
    }
}

function viewLOTDetails(lotId) {
    if (window.csWindApp) {
        window.csWindApp.showToast(`${lotId} 상세 정보를 표시합니다.`, 'info');
    }
}

// BOM 트리 토글 전역 함수
function toggleBOMTreeItem(itemId) {
    if (window.csWindApp && window.csWindApp.advancedBOMManager) {
        window.csWindApp.advancedBOMManager.toggleTreeItem(itemId);
    }
}

// 테스트용 전역 함수들
function testAdvancedBOMManager() {
    console.log('고급 BOM 매니저 테스트 시작');
    
    // BOM 탭으로 전환
    if (window.csWindApp) {
        window.csWindApp.switchTab('bom');
        
        setTimeout(() => {
            // 고급 BOM 모드로 전환
            const advancedBtn = document.getElementById('btn-show-advanced-bom');
            if (advancedBtn) {
                advancedBtn.click();
                
                setTimeout(() => {
                    if (window.csWindApp.advancedBOMManager) {
                        console.log('고급 BOM 매니저가 성공적으로 초기화되었습니다');
                        
                        // 샘플 데이터 로드
                        window.csWindApp.advancedBOMManager.loadSampleBOMData();
                        window.csWindApp.advancedBOMManager.displayOriginalBOM();
                        console.log('샘플 데이터 로드 완료');
                    } else {
                        console.error('고급 BOM 매니저 초기화 실패');
                    }
                }, 1000);
            }
        }, 500);
    }
}

function testFileUpload() {
    console.log('파일 업로드 테스트');
    if (window.csWindApp && window.csWindApp.advancedBOMManager) {
        window.csWindApp.advancedBOMManager.uploadBOMFile();
    } else {
        console.error('고급 BOM 매니저가 초기화되지 않았습니다. 먼저 testAdvancedBOMManager()를 실행하세요.');
    }
}