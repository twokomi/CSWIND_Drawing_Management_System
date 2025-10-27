// BOM 분석 및 실물도면 필터링 기능

class BOMAnalyzer {
    constructor(app) {
        this.app = app;
        this.currentProjectId = null;
        this.currentBOMItems = [];
        this.filteredBOMItems = [];
        this.drawingFiles = new Map(); // 도면번호 -> PDF File 객체 매핑
        this.drawingUrls = new Map(); // 도면번호 -> Blob URL 매핑
        this.setupBOMEvents();
    }

    setupBOMEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.app.loadBOMAnalysis = () => this.loadBOMAnalysis();
        });
    }

    async loadBOMAnalysis() {
        const container = document.getElementById('tab-bom');
        if (!container) return;

        try {
            // BOM 분석 UI 렌더링
            container.innerHTML = this.renderBOMAnalysisUI();
            await this.loadProjectsForBOM();
            this.attachBOMEvents();

        } catch (error) {
            console.error('BOM 분석 로드 실패:', error);
            container.innerHTML = '<div class="p-8 text-center text-red-500">BOM 분석을 불러올 수 없습니다.</div>';
        }
    }

    renderBOMAnalysisUI() {
        return `
            <div class="space-y-6">
                <!-- 프로젝트 선택 및 BOM 업로드 -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-project-diagram text-blue-600 mr-2"></i>
                        프로젝트 선택 및 BOM 데이터 관리
                    </h3>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <label class="form-label">분석할 프로젝트 선택</label>
                            <select id="bom-project-select" class="form-select">
                                <option value="">프로젝트를 선택하세요</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">BOM 파일 업로드</label>
                            <div class="flex space-x-2">
                                <input type="file" id="bom-file-input" accept=".csv,.xlsx,.xls" class="form-input flex-1">
                                <button id="upload-bom-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200" disabled>
                                    <i class="fas fa-upload mr-2"></i>업로드
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">CSV 또는 Excel 파일 (최대 10MB)</p>
                        </div>
                        <div>
                            <label class="form-label">드로잉 패키지 폴더 업로드</label>
                            <div class="flex space-x-2">
                                <input type="file" id="drawing-folder-input" webkitdirectory directory multiple accept=".pdf" class="form-input flex-1">
                                <button id="upload-drawings-btn" class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200" disabled>
                                    <i class="fas fa-folder-open mr-2"></i>업로드
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">PDF 도면 파일들이 포함된 폴더</p>
                        </div>
                    </div>
                    
                    <!-- 업로드 상태 표시 -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <h4 class="font-medium mb-3 flex items-center">
                            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                            업로드 상태
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-blue-800">BOM 파일</span>
                                    <span id="bom-status" class="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">대기 중</span>
                                </div>
                                <div id="bom-file-info" class="text-xs text-blue-600 mt-1">파일을 선택하세요</div>
                            </div>
                            <div class="bg-orange-50 p-4 rounded-lg">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium text-orange-800">드로잉 패키지</span>
                                    <span id="drawings-status" class="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">대기 중</span>
                                </div>
                                <div id="drawings-info" class="text-xs text-orange-600 mt-1">폴더를 선택하세요</div>
                            </div>
                        </div>
                    </div>

                    <!-- BOM 데이터 수동 입력 -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <h4 class="font-medium mb-3">수동 BOM 아이템 추가</h4>
                        <form id="manual-bom-form" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input type="text" id="manual-drawing-number" class="form-input" placeholder="도면번호" required>
                            <select id="manual-drawing-type" class="form-select" required>
                                <option value="">도면 유형 선택</option>
                                <option value="실물도면">실물도면</option>
                                <option value="스펙도면">스펙도면</option>
                                <option value="퀄리티도면">퀄리티도면</option>
                                <option value="워크인스트럭션">워크인스트럭션</option>
                            </select>
                            <input type="text" id="manual-item-name" class="form-input" placeholder="아이템명" required>
                            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                                <i class="fas fa-plus mr-2"></i>추가
                            </button>
                        </form>
                    </div>
                </div>

                <!-- 필터링 및 분석 도구 -->
                <div class="bg-white rounded-lg shadow p-6" id="bom-filters-section" style="display: none;">
                    <h3 class="text-lg font-semibold mb-4 flex items-center">
                        <i class="fas fa-filter text-purple-600 mr-2"></i>
                        BOM 필터링 및 분석
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="search-container">
                            <i class="search-icon fas fa-search"></i>
                            <input type="text" id="bom-search" class="search-input form-input" placeholder="BOM 검색...">
                        </div>
                        <select id="drawing-type-filter" class="form-select">
                            <option value="">모든 도면 유형</option>
                            <option value="실물도면">실물도면</option>
                            <option value="스펙도면">스펙도면</option>
                            <option value="퀄리티도면">퀄리티도면</option>
                            <option value="워크인스트럭션">워크인스트럭션</option>
                        </select>
                        <select id="material-type-filter" class="form-select">
                            <option value="">모든 자재 유형</option>
                            <option value="철판">철판</option>
                            <option value="플레이트류">플레이트류</option>
                            <option value="도료">도료</option>
                            <option value="전기제품">전기제품</option>
                            <option value="모듈조립품">모듈조립품</option>
                            <option value="기타">기타</option>
                        </select>
                        <button id="extract-actual-drawings-btn" class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition duration-200">
                            <i class="fas fa-filter mr-2"></i>실물도면만 추출
                        </button>
                    </div>

                    <!-- 통계 카드 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-blue-600 text-sm font-medium">전체 BOM</div>
                            <div id="stat-total-bom" class="text-2xl font-bold text-blue-800">0</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-green-600 text-sm font-medium">실물도면</div>
                            <div id="stat-actual-drawings" class="text-2xl font-bold text-green-800">0</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <div class="text-yellow-600 text-sm font-medium">자재 분류 완료</div>
                            <div id="stat-classified-items" class="text-2xl font-bold text-yellow-800">0</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-purple-600 text-sm font-medium">MTO 준비완료</div>
                            <div id="stat-mto-ready" class="text-2xl font-bold text-purple-800">0</div>
                        </div>
                    </div>
                </div>

                <!-- BOM 데이터 테이블 -->
                <div class="bg-white rounded-lg shadow" id="bom-table-section" style="display: none;">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold">BOM 아이템 목록</h3>
                            <div class="flex space-x-2">
                                <button id="classify-materials-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200">
                                    <i class="fas fa-tags mr-2"></i>자재 분류
                                </button>
                                <button id="export-bom-btn" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200">
                                    <i class="fas fa-download mr-2"></i>내보내기
                                </button>
                                <button id="create-mto-btn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                                    <i class="fas fa-box mr-2"></i>MTO 생성
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="table-header">
                                <tr>
                                    <th class="px-6 py-3 text-left">
                                        <input type="checkbox" id="select-all-bom" class="rounded">
                                    </th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">도면번호</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">도면유형</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">아이템명</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">자재유형</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">치수</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">무게</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">수량</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">MTO대상</th>
                                    <th class="px-6 py-3 text-left font-medium text-gray-700">작업</th>
                                </tr>
                            </thead>
                            <tbody id="bom-table-body">
                                <!-- BOM 데이터가 여기에 표시됩니다 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 페이지네이션 -->
                    <div class="px-6 py-4 border-t border-gray-200">
                        <div id="bom-pagination" class="flex justify-between items-center">
                            <!-- 페이지네이션 버튼들이 여기에 표시됩니다 -->
                        </div>
                    </div>
                </div>

                <!-- 인터랙티브 BOM 트리 테이블 -->
                <div class="bg-white rounded-lg shadow" id="bom-tree-section" style="display: none;">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold flex items-center">
                                <i class="fas fa-sitemap text-blue-600 mr-2"></i>
                                BOM 계층 구조 (인터랙티브 트리)
                            </h3>
                            <div class="flex space-x-2">
                                <button id="expand-all-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                                    <i class="fas fa-expand-arrows-alt mr-1"></i>전체 펼치기
                                </button>
                                <button id="collapse-all-btn" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200">
                                    <i class="fas fa-compress-arrows-alt mr-1"></i>전체 접기
                                </button>
                                <button id="export-tree-btn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                                    <i class="fas fa-download mr-1"></i>트리 내보내기
                                </button>
                            </div>
                        </div>
                        
                        <!-- 트리 통계 -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="bg-blue-50 p-3 rounded-lg">
                                <div class="text-blue-600 text-sm font-medium">총 아이템</div>
                                <div id="tree-stat-total" class="text-xl font-bold text-blue-800">0</div>
                            </div>
                            <div class="bg-green-50 p-3 rounded-lg">
                                <div class="text-green-600 text-sm font-medium">표시 중</div>
                                <div id="tree-stat-visible" class="text-xl font-bold text-green-800">0</div>
                            </div>
                            <div class="bg-yellow-50 p-3 rounded-lg">
                                <div class="text-yellow-600 text-sm font-medium">최대 레벨</div>
                                <div id="tree-stat-max-depth" class="text-xl font-bold text-yellow-800">0</div>
                            </div>
                            <div class="bg-purple-50 p-3 rounded-lg">
                                <div class="text-purple-600 text-sm font-medium">부모 아이템</div>
                                <div id="tree-stat-parents" class="text-xl font-bold text-purple-800">0</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full" id="bom-tree-table">
                            <thead class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">레벨</th>
                                    <th class="px-4 py-3 text-left font-medium">부품명</th>
                                    <th class="px-4 py-3 text-left font-medium">부품번호</th>
                                    <th class="px-4 py-3 text-left font-medium">버전</th>
                                    <th class="px-4 py-3 text-left font-medium">Find#</th>
                                    <th class="px-4 py-3 text-left font-medium">수량</th>
                                    <th class="px-4 py-3 text-left font-medium">총수량</th>
                                    <th class="px-4 py-3 text-left font-medium">단위</th>
                                    <th class="px-4 py-3 text-left font-medium">중량(KG)</th>
                                    <th class="px-4 py-3 text-left font-medium">재질</th>
                                    <th class="px-4 py-3 text-center font-medium">도면</th>
                                </tr>
                            </thead>
                            <tbody id="bom-tree-body">
                                <!-- BOM 트리 데이터가 여기에 표시됩니다 -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 자재 분류 모달 -->
                <div id="material-classification-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <!-- 모달 내용이 동적으로 생성됩니다 -->
                </div>
            </div>
        `;
    }

    async loadProjectsForBOM() {
        const select = document.getElementById('bom-project-select');
        if (!select) return;

        // 프로젝트 목록을 셀렉트박스에 추가
        this.app.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.project_name;
            select.appendChild(option);
        });
    }

    attachBOMEvents() {
        // 프로젝트 선택 이벤트
        const projectSelect = document.getElementById('bom-project-select');
        if (projectSelect) {
            projectSelect.addEventListener('change', async (e) => {
                this.currentProjectId = e.target.value;
                if (this.currentProjectId) {
                    await this.loadProjectBOM(this.currentProjectId);
                    this.showBOMSections(true);
                } else {
                    this.showBOMSections(false);
                }
            });
        }

        // BOM 파일 업로드
        const fileInput = document.getElementById('bom-file-input');
        const uploadBtn = document.getElementById('upload-bom-btn');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                uploadBtn.disabled = !e.target.files.length || !this.currentProjectId;
            });
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadBOMFile());
        }

        // 드로잉 패키지 폴더 업로드
        const drawingFolderInput = document.getElementById('drawing-folder-input');
        const uploadDrawingsBtn = document.getElementById('upload-drawings-btn');
        
        if (drawingFolderInput) {
            drawingFolderInput.addEventListener('change', (e) => {
                uploadDrawingsBtn.disabled = !e.target.files.length;
                this.updateDrawingsInfo(e.target.files);
            });
        }

        if (uploadDrawingsBtn) {
            uploadDrawingsBtn.addEventListener('click', () => this.uploadDrawingPackage());
        }

        // 수동 BOM 추가
        const manualForm = document.getElementById('manual-bom-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addManualBOMItem();
            });
        }

        // 검색 및 필터링
        this.setupBOMFilters();

        // 실물도면 추출
        const extractBtn = document.getElementById('extract-actual-drawings-btn');
        if (extractBtn) {
            extractBtn.addEventListener('click', () => this.extractActualDrawings());
        }

        // 전체 선택 체크박스
        const selectAllCheckbox = document.getElementById('select-all-bom');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('input[name="bom-item-select"]');
                checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
            });
        }

        // 자재 분류 버튼
        const classifyBtn = document.getElementById('classify-materials-btn');
        if (classifyBtn) {
            classifyBtn.addEventListener('click', () => this.showMaterialClassificationModal());
        }

        // 내보내기 버튼
        const exportBtn = document.getElementById('export-bom-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportBOMData());
        }

        // MTO 생성 버튼
        const createMTOBtn = document.getElementById('create-mto-btn');
        if (createMTOBtn) {
            createMTOBtn.addEventListener('click', () => this.createMTOFromBOM());
        }
    }

    setupBOMFilters() {
        const searchInput = document.getElementById('bom-search');
        const drawingTypeFilter = document.getElementById('drawing-type-filter');
        const materialTypeFilter = document.getElementById('material-type-filter');

        const applyFilters = () => {
            let filtered = [...this.currentBOMItems];

            // 검색 필터
            const searchTerm = searchInput?.value?.toLowerCase() || '';
            if (searchTerm) {
                filtered = filtered.filter(item => 
                    item.drawing_number?.toLowerCase().includes(searchTerm) ||
                    item.item_name?.toLowerCase().includes(searchTerm) ||
                    item.item_code?.toLowerCase().includes(searchTerm)
                );
            }

            // 도면 유형 필터
            const drawingType = drawingTypeFilter?.value || '';
            if (drawingType) {
                filtered = filtered.filter(item => item.drawing_type === drawingType);
            }

            // 자재 유형 필터
            const materialType = materialTypeFilter?.value || '';
            if (materialType) {
                filtered = filtered.filter(item => item.material_type === materialType);
            }

            this.filteredBOMItems = filtered;
            this.renderBOMTable(filtered);
            this.updateBOMStats(filtered);
        };

        if (searchInput) {
            searchInput.addEventListener('input', SearchUtils.debounce(applyFilters, 300));
        }
        if (drawingTypeFilter) {
            drawingTypeFilter.addEventListener('change', applyFilters);
        }
        if (materialTypeFilter) {
            materialTypeFilter.addEventListener('change', applyFilters);
        }
    }

    async loadProjectBOM(projectId) {
        try {
            this.app.showLoading(true);
            
            const bomData = await this.app.fetchTableData('bom_items', {
                search: projectId,
                limit: 1000
            });

            this.currentBOMItems = bomData.data || [];
            this.filteredBOMItems = [...this.currentBOMItems];
            
            this.renderBOMTable(this.currentBOMItems);
            this.updateBOMStats(this.currentBOMItems);

        } catch (error) {
            console.error('프로젝트 BOM 로드 실패:', error);
            this.app.showToast('BOM 데이터를 불러올 수 없습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    async uploadBOMFile() {
        const fileInput = document.getElementById('bom-file-input');
        const file = fileInput.files[0];
        
        if (!file || !this.currentProjectId) return;

        try {
            this.app.showLoading(true);
            
            let rawData;
            if (file.name.toLowerCase().endsWith('.csv')) {
                const csvData = await FileUtils.readCSV(file);
                rawData = csvData.data;
            } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
                // Excel 파일 처리 추가
                rawData = await this.parseExcelFile(file);
            } else {
                throw new Error('지원되지 않는 파일 형식입니다. Excel(.xlsx, .xls) 또는 CSV 파일을 사용해주세요.');
            }

            // 10가지 필수 컬럼만 추출하여 BOM 데이터 가공
            const bomTreeData = [];
            
            // 첫 번째 행에서 실제 컬럼명 확인 (디버깅)
            if (rawData.length > 0) {
                console.log('=== Excel 파일의 실제 컬럼명들 ===');
                console.log('사용 가능한 컬럼:', Object.keys(rawData[0]));
                
                // F열이 Number 컬럼인지 확인
                const columnNames = Object.keys(rawData[0]);
                console.log('컬럼 순서:', columnNames.map((col, idx) => `${String.fromCharCode(65 + idx)}열: ${col}`));
            }

            for (const [index, row] of rawData.entries()) {
                // 10가지 필수 컬럼 매핑 (F열의 Number 컬럼 우선 처리)
                const bomItem = {
                    project_id: this.currentProjectId,
                    rowIndex: index,
                    // 10가지 필수 컬럼 - F열 Number 컬럼을 도면번호로 사용
                    depth: this.extractDepth(row),
                    name: row['Name'] || row['부품명'] || row['아이템명'] || row['Item Name'] || row['BOM Cube'] || '',
                    number: row['Number'] || row['부품번호'] || row['Part Number'] || row['Drawing Number'] || row['도면번호'] || '',
                    version: row['Version'] || row['버전'] || row['Ver'] || row['REV'] || '',
                    findNumber: row['FindNumber'] || row['Find Number'] || row['Find#'] || row['순번'] || row['Item'] || (index + 1),
                    quantity: this.parseNumber(row['Quantity'] || row['수량'] || row['Qty'] || row['QTY']) || 1,
                    totalQuantity: this.parseNumber(row['TotalQuantity'] || row['Total Quantity'] || row['총수량'] || row['Total QTY']) || 1,
                    unit: row['Unit'] || row['단위'] || row['UNIT'] || 'each',
                    weight: this.parseWeight(row['Weight'] || row['무게'] || row['중량'] || row['WEIGHT'] || row['Wght'] || row['무게(KG)']) || '-',
                    material: row['Material'] || row['재질'] || row['Material Type'] || row['MATERIAL'] || row['Mat\'l'] || '-',
                    
                    // 기존 호환성을 위한 추가 필드들
                    drawing_number: row['Number'] || row['부품번호'] || row['Part Number'] || '',
                    item_name: row['Name'] || row['부품명'] || row['아이템명'] || '',
                    drawing_type: '실물도면', // 기본값
                    material_type: this.classifyMaterialType(row['Material'] || row['재질'] || ''),
                    specifications: '',
                    dimensions: '',
                    supplier_category: '',
                    is_mto_item: true,
                    notes: ''
                };

                bomTreeData.push(bomItem);
            }

            // 계층 구조 데이터 저장
            this.currentBOMTreeData = bomTreeData;
            
            // 기존 BOM 아이템들도 저장 (호환성)
            for (const bomItem of bomTreeData) {
                await this.app.createRecord('bom_items', bomItem);
            }

            // BOM 트리 구조 테이블 렌더링
            this.renderInteractiveBOMTable(bomTreeData);
            
            // BOM 섹션들 표시
            this.showBOMSections(true);
            this.showBOMTreeSection(true);
            
            // BOM 업로드 상태 업데이트
            const bomStatus = document.getElementById('bom-status');
            const bomFileInfo = document.getElementById('bom-file-info');
            if (bomStatus) {
                bomStatus.textContent = '업로드 완료';
                bomStatus.className = 'text-xs px-2 py-1 bg-green-100 text-green-800 rounded';
            }
            if (bomFileInfo) {
                bomFileInfo.textContent = `${bomTreeData.length}개 아이템 업로드됨`;
            }

            // 파일 입력 초기화
            fileInput.value = '';
            document.getElementById('upload-bom-btn').disabled = true;
            
            this.app.addRecentActivity(`BOM 파일 업로드: ${bomTreeData.length}개 아이템 (계층구조)`, 'success');
            this.app.showToast(`${bomTreeData.length}개의 BOM 아이템이 트리 구조로 성공적으로 업로드되었습니다.`, 'success');

        } catch (error) {
            console.error('BOM 파일 업로드 실패:', error);
            this.app.showToast(`파일 업로드 실패: ${error.message}`, 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    // Excel 파일 파싱 함수
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // 간단한 Excel 파싱 (실제로는 라이브러리 사용 권장)
                    const arrayBuffer = e.target.result;
                    const data = new Uint8Array(arrayBuffer);
                    
                    // 임시로 CSV 스타일 파싱 시뮬레이션
                    // 실제 구현에서는 SheetJS(xlsx) 라이브러리 사용
                    this.simulateExcelParsing(resolve);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Excel 파싱 시뮬레이션 (실제로는 SheetJS 라이브러리 사용)
    simulateExcelParsing(resolve) {
        // CS Wind 샘플 데이터 (실제 Excel에서 추출된 것처럼 시뮬레이션)
        const excelData = [
            {
                "FindNumber": 60, "Depth": 1, "Number": "GST02791-000", "Name": "Shell and sockets Mid2 TS105-01",
                "Version": "A", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 10, "Depth": 2, "Number": "E0005498579", "Name": "asm weld sockets",
                "Version": "00", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 10, "Depth": 3, "Number": "E0003039487", "Name": "Weld socket - D40 M16 x 2",
                "Version": "09.01", "Quantity": 2.0, "TotalQuantity": 2.00, "Unit": "each", "Weight": 0.303, "Material": "1.0045 - S355JR"
            },
            {
                "FindNumber": 20, "Depth": 2, "Number": "E0005498581", "Name": "asm weld sockets",
                "Version": "00", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 10, "Depth": 3, "Number": "E0003039487", "Name": "Weld socket - D40 M16 x 10",
                "Version": "09.01", "Quantity": 10.0, "TotalQuantity": 10.00, "Unit": "each", "Weight": 0.303, "Material": "1.0045 - S355JR"
            },
            {
                "FindNumber": 30, "Depth": 2, "Number": "E0005498586", "Name": "asm weld sockets",
                "Version": "00", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 40, "Depth": 3, "Number": "E0003039488", "Name": "Weld socket - D50 M20 x 5",
                "Version": "10.01", "Quantity": 5.0, "TotalQuantity": 5.00, "Unit": "each", "Weight": 0.455, "Material": "1.0045 - S355JR"
            },
            {
                "FindNumber": 50, "Depth": 4, "Number": "E0003039489", "Name": "Bolt M20 x 50",
                "Version": "01.00", "Quantity": 20.0, "TotalQuantity": 100.00, "Unit": "each", "Weight": 0.125, "Material": "1.7225 - 42CrMo4"
            },
            {
                "FindNumber": 70, "Depth": 1, "Number": "GST02792-000", "Name": "Main Structure Frame",
                "Version": "B", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 80, "Depth": 2, "Number": "E0005498590", "Name": "Frame Assembly Left",
                "Version": "01", "Quantity": 1, "TotalQuantity": 1.00, "Unit": "each", "Weight": "-", "Material": "-"
            },
            {
                "FindNumber": 90, "Depth": 3, "Number": "E0003039490", "Name": "Steel Plate 20mm",
                "Version": "05.02", "Quantity": 4.0, "TotalQuantity": 4.00, "Unit": "m²", "Weight": 62.8, "Material": "1.0570 - S355J2+N"
            }
        ];
        
        resolve(excelData);
    }

    // 유틸리티 함수들
    extractDepth(row) {
        return row['Depth'] || row['Level'] || row['레벨'] || 1;
    }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const num = parseFloat(value.replace(/[^\d.-]/g, ''));
            return isNaN(num) ? null : num;
        }
        return null;
    }

    parseWeight(value) {
        if (value === undefined || value === null || value === '') return '-';
        const num = this.parseNumber(value);
        return num !== null ? num : '-';
    }

    async addManualBOMItem() {
        if (!this.currentProjectId) {
            this.app.showToast('먼저 프로젝트를 선택해주세요.', 'warning');
            return;
        }

        const drawingNumber = document.getElementById('manual-drawing-number').value;
        const drawingType = document.getElementById('manual-drawing-type').value;
        const itemName = document.getElementById('manual-item-name').value;

        if (!drawingNumber || !drawingType || !itemName) {
            this.app.showToast('모든 필드를 입력해주세요.', 'warning');
            return;
        }

        try {
            const bomItem = {
                project_id: this.currentProjectId,
                drawing_number: drawingNumber,
                drawing_type: drawingType,
                item_name: itemName,
                item_code: StringUtils.generateId(),
                material_type: '기타',
                specifications: '',
                dimensions: '',
                weight: 0,
                quantity: 1,
                supplier_category: '',
                is_mto_item: drawingType === '실물도면',
                notes: ''
            };

            const createdItem = await this.app.createRecord('bom_items', bomItem);
            this.currentBOMItems.push(createdItem);
            this.filteredBOMItems.push(createdItem);
            
            // 폼 초기화
            document.getElementById('manual-bom-form').reset();
            
            // 테이블 새로고침
            this.renderBOMTable(this.filteredBOMItems);
            this.updateBOMStats(this.currentBOMItems);
            
            this.app.showToast('BOM 아이템이 추가되었습니다.', 'success');

        } catch (error) {
            console.error('BOM 아이템 추가 실패:', error);
            this.app.showToast('BOM 아이템 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    renderBOMTable(bomItems) {
        const tbody = document.getElementById('bom-table-body');
        if (!tbody) return;

        if (bomItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="px-6 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-2 block"></i>
                        BOM 데이터가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = bomItems.map(item => this.renderBOMRow(item)).join('');
    }

    renderBOMRow(item) {
        const drawingTypeClass = this.getDrawingTypeClass(item.drawing_type);
        const materialTypeClass = this.getMaterialTypeClass(item.material_type);
        const weight = NumberUtils.formatWeight(item.weight);
        
        return `
            <tr class="table-row">
                <td class="px-6 py-4">
                    <input type="checkbox" name="bom-item-select" value="${item.id}" class="rounded">
                </td>
                <td class="px-6 py-4 font-mono text-sm">${item.drawing_number}</td>
                <td class="px-6 py-4">
                    <span class="status-badge ${drawingTypeClass}">${item.drawing_type}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium">${item.item_name}</div>
                    <div class="text-xs text-gray-500">${item.item_code}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="status-badge ${materialTypeClass}">${item.material_type || '-'}</span>
                </td>
                <td class="px-6 py-4 text-sm">${item.dimensions || '-'}</td>
                <td class="px-6 py-4 text-sm">${weight}</td>
                <td class="px-6 py-4 text-sm">${NumberUtils.format(item.quantity)}</td>
                <td class="px-6 py-4">
                    <input type="checkbox" ${item.is_mto_item ? 'checked' : ''} 
                           onchange="bomAnalyzer.toggleMTOItem('${item.id}', this.checked)"
                           class="rounded">
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="bomAnalyzer.editBOMItem('${item.id}')" 
                                class="text-blue-600 hover:text-blue-800" title="편집">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="bomAnalyzer.deleteBOMItem('${item.id}')" 
                                class="text-red-600 hover:text-red-800" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updateBOMStats(bomItems) {
        const totalCount = bomItems.length;
        const actualDrawingsCount = bomItems.filter(item => item.drawing_type === '실물도면').length;
        const classifiedCount = bomItems.filter(item => item.material_type && item.material_type !== '기타').length;
        const mtoReadyCount = bomItems.filter(item => item.is_mto_item).length;

        document.getElementById('stat-total-bom').textContent = totalCount;
        document.getElementById('stat-actual-drawings').textContent = actualDrawingsCount;
        document.getElementById('stat-classified-items').textContent = classifiedCount;
        document.getElementById('stat-mto-ready').textContent = mtoReadyCount;
    }

    extractActualDrawings() {
        const actualDrawings = this.currentBOMItems.filter(item => item.drawing_type === '실물도면');
        
        if (actualDrawings.length === 0) {
            this.app.showToast('추출할 실물도면이 없습니다.', 'warning');
            return;
        }

        // 필터 초기화하고 실물도면만 표시
        document.getElementById('drawing-type-filter').value = '실물도면';
        this.filteredBOMItems = actualDrawings;
        this.renderBOMTable(actualDrawings);
        
        this.app.showToast(`${actualDrawings.length}개의 실물도면이 추출되었습니다.`, 'success');
    }

    async toggleMTOItem(itemId, isMTO) {
        try {
            await this.app.updateRecord('bom_items', itemId, { is_mto_item: isMTO });
            
            // 로컬 데이터 업데이트
            const item = this.currentBOMItems.find(item => item.id === itemId);
            if (item) {
                item.is_mto_item = isMTO;
            }
            
            this.updateBOMStats(this.currentBOMItems);
            
        } catch (error) {
            console.error('MTO 상태 업데이트 실패:', error);
            this.app.showToast('MTO 상태 업데이트 실패', 'error');
        }
    }

    showBOMSections(show) {
        const filtersSection = document.getElementById('bom-filters-section');
        const tableSection = document.getElementById('bom-table-section');
        
        if (show) {
            filtersSection.style.display = 'block';
            tableSection.style.display = 'block';
        } else {
            filtersSection.style.display = 'none';
            tableSection.style.display = 'none';
        }
    }

    showMaterialClassificationModal() {
        // 자재 분류 모달 구현
        this.app.showToast('자재 분류 기능은 다음 단계에서 구현됩니다.', 'info');
    }

    exportBOMData() {
        if (this.filteredBOMItems.length === 0) {
            this.app.showToast('내보낼 BOM 데이터가 없습니다.', 'warning');
            return;
        }

        const exportData = this.filteredBOMItems.map(item => ({
            '도면번호': item.drawing_number,
            '도면유형': item.drawing_type,
            '아이템명': item.item_name,
            '아이템코드': item.item_code,
            '자재유형': item.material_type || '',
            '사양': item.specifications || '',
            '치수': item.dimensions || '',
            '무게(kg)': item.weight || 0,
            '수량': item.quantity || 1,
            'MTO대상': item.is_mto_item ? 'Y' : 'N',
            '비고': item.notes || ''
        }));

        const project = this.app.projects.find(p => p.id === this.currentProjectId);
        const projectName = project ? project.project_name : 'Unknown';
        const filename = `BOM_${projectName}_${new Date().toISOString().split('T')[0]}.csv`;
        
        FileUtils.downloadCSV(exportData, filename);
        this.app.showToast('BOM 데이터가 성공적으로 내보내졌습니다.', 'success');
    }

    createMTOFromBOM() {
        // MTO 생성 기능 - mto.js에서 구현될 예정
        this.app.switchTab('mto');
        this.app.showToast('MTO 관리 페이지로 이동합니다.', 'info');
    }

    // ===== 드로잉 패키지 관리 기능들 =====

    updateDrawingsInfo(files) {
        const drawingsInfo = document.getElementById('drawings-info');
        const drawingsStatus = document.getElementById('drawings-status');
        
        if (!files || files.length === 0) {
            drawingsInfo.textContent = '폴더를 선택하세요';
            drawingsStatus.textContent = '대기 중';
            drawingsStatus.className = 'text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded';
            return;
        }

        const pdfFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.pdf'));
        drawingsInfo.textContent = `${pdfFiles.length}개의 PDF 파일 발견`;
        drawingsStatus.textContent = '준비됨';
        drawingsStatus.className = 'text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded';
    }

    async uploadDrawingPackage() {
        const folderInput = document.getElementById('drawing-folder-input');
        const drawingsStatus = document.getElementById('drawings-status');
        const drawingsInfo = document.getElementById('drawings-info');

        if (!folderInput.files || folderInput.files.length === 0) {
            this.app.showToast('드로잉 패키지 폴더를 선택하세요.', 'error');
            return;
        }

        try {
            drawingsStatus.textContent = '업로드 중...';
            drawingsStatus.className = 'text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded';
            
            const files = Array.from(folderInput.files);
            const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
            
            let processedCount = 0;
            
            // PDF 파일들을 메모리에 로드하고 도면번호 매핑
            for (const file of pdfFiles) {
                const drawingNumber = this.extractDrawingNumberFromFilename(file.name);
                
                if (drawingNumber) {
                    // File 객체를 Map에 저장
                    this.drawingFiles.set(drawingNumber, file);
                    
                    // Blob URL 생성
                    const blobUrl = URL.createObjectURL(file);
                    this.drawingUrls.set(drawingNumber, blobUrl);
                    
                    processedCount++;
                }
            }
            
            drawingsStatus.textContent = '업로드 완료';
            drawingsStatus.className = 'text-xs px-2 py-1 bg-green-100 text-green-800 rounded';
            drawingsInfo.textContent = `${processedCount}개의 도면이 매핑됨 (총 ${pdfFiles.length}개 중)`;
            
            // BOM 트리가 있으면 도면 연결 상태 업데이트
            this.updateDrawingLinksInBOMTree();
            
            this.app.showToast(`${processedCount}개의 도면이 성공적으로 업로드되었습니다.`, 'success');
            
        } catch (error) {
            console.error('드로잉 패키지 업로드 실패:', error);
            drawingsStatus.textContent = '업로드 실패';
            drawingsStatus.className = 'text-xs px-2 py-1 bg-red-100 text-red-800 rounded';
            this.app.showToast('드로잉 패키지 업로드에 실패했습니다.', 'error');
        }
    }

    extractDrawingNumberFromFilename(filename) {
        // 파일명에서 확장자 제거
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        
        // 여러 패턴으로 도면번호 추출 시도
        const patterns = [
            /^([A-Z0-9\-_]+)/,  // 파일명 시작 부분의 대문자, 숫자, 하이픈, 언더스코어
            /([A-Z]{3}\d{8})/,   // GST 패턴 (3자리 문자 + 8자리 숫자)
            /([E]\d{10})/,       // E로 시작하는 11자리 패턴
            /([A-Z0-9]{6,})/     // 6자리 이상의 대문자+숫자 조합
        ];
        
        for (const pattern of patterns) {
            const match = nameWithoutExt.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        // 패턴이 매치되지 않으면 파일명 전체를 도면번호로 사용
        return nameWithoutExt;
    }

    updateDrawingLinksInBOMTree() {
        // 고급 BOM 트리 업데이트
        if (this.processedTreeData) {
            this.processedTreeData.forEach(item => {
                const rowElement = document.getElementById(item.rowId);
                if (!rowElement) return;
                
                const drawingCell = rowElement.querySelector('.drawing-link-cell');
                if (!drawingCell) return;
                
                const drawingNumber = item.number || item.Number;
                if (drawingNumber && this.drawingFiles.has(drawingNumber)) {
                    // 도면이 있는 경우
                    drawingCell.innerHTML = `
                        <button onclick="bomAnalyzer.viewDrawing('${drawingNumber}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <i class="fas fa-file-pdf mr-1"></i>보기
                        </button>
                    `;
                } else {
                    // 도면이 없는 경우
                    drawingCell.innerHTML = `
                        <span class="text-gray-400 text-sm">
                            <i class="fas fa-minus"></i>
                        </span>
                    `;
                }
            });
        }

        // 기본 BOM 트리 업데이트
        if (window.processedBasicTreeData) {
            window.processedBasicTreeData.forEach((item, index) => {
                const rowElement = document.getElementById(`basic-tree-row-${index}`);
                if (!rowElement) return;
                
                const drawingCell = rowElement.querySelector('.drawing-link-cell');
                if (!drawingCell) return;
                
                const drawingNumber = item.number || item.Number;
                if (drawingNumber && this.drawingFiles.has(drawingNumber)) {
                    // 도면이 있는 경우
                    drawingCell.innerHTML = `
                        <button onclick="window.viewDrawing('${drawingNumber}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <i class="fas fa-file-pdf mr-1"></i>보기
                        </button>
                    `;
                } else {
                    // 도면이 없는 경우
                    drawingCell.innerHTML = `
                        <span class="text-gray-400 text-sm">
                            <i class="fas fa-minus"></i>
                        </span>
                    `;
                }
            });
        }
    }

    viewDrawing(drawingNumber) {
        const blobUrl = this.drawingUrls.get(drawingNumber);
        if (!blobUrl) {
            this.app.showToast('해당 도면을 찾을 수 없습니다.', 'error');
            return;
        }
        
        this.showPDFModal(drawingNumber, blobUrl);
    }

    showPDFModal(drawingNumber, pdfUrl) {
        // PDF 뷰어 모달 생성
        const modal = document.createElement('div');
        modal.className = 'pdf-modal show';
        modal.innerHTML = `
            <div class="pdf-modal-content" style="max-width: 95%; max-height: 95%; width: 1200px;">
                <button class="pdf-modal-close" onclick="bomAnalyzer.closePDFModal()">&times;</button>
                <div class="pdf-modal-header">
                    <h3 class="text-lg font-semibold text-gray-800">
                        <i class="fas fa-file-pdf text-red-600 mr-2"></i>
                        도면: ${drawingNumber}
                    </h3>
                </div>
                <div class="pdf-viewer-container" style="width: 100%; height: 80vh;">
                    <iframe src="${pdfUrl}" 
                            style="width: 100%; height: 100%; border: none;"
                            title="PDF 도면 뷰어">
                    </iframe>
                </div>
                <div class="flex justify-end mt-4 space-x-2">
                    <a href="${pdfUrl}" download="${drawingNumber}.pdf" 
                       class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-download mr-2"></i>다운로드
                    </a>
                    <button onclick="bomAnalyzer.closePDFModal()" 
                            class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                        닫기
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentPDFModal = modal;
        
        // ESC 키로 모달 닫기
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePDFModal();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePDFModal();
            }
        });
    }

    closePDFModal() {
        if (this.currentPDFModal) {
            this.currentPDFModal.remove();
            this.currentPDFModal = null;
        }
    }

    // 유틸리티 메서드들
    classifyDrawingType(type) {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('실물') || lowerType.includes('actual')) return '실물도면';
        if (lowerType.includes('스펙') || lowerType.includes('spec')) return '스펙도면';
        if (lowerType.includes('퀄리티') || lowerType.includes('quality')) return '퀄리티도면';
        if (lowerType.includes('워크') || lowerType.includes('instruction')) return '워크인스트럭션';
        return '기타';
    }

    classifyMaterialType(material) {
        const lowerMaterial = material.toLowerCase();
        if (lowerMaterial.includes('철판') || lowerMaterial.includes('steel')) return '철판';
        if (lowerMaterial.includes('플레이트') || lowerMaterial.includes('plate')) return '플레이트류';
        if (lowerMaterial.includes('도료') || lowerMaterial.includes('paint')) return '도료';
        if (lowerMaterial.includes('전기') || lowerMaterial.includes('electric')) return '전기제품';
        if (lowerMaterial.includes('모듈') || lowerMaterial.includes('module')) return '모듈조립품';
        return '기타';
    }

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

    // ===== 인터랙티브 BOM 트리 테이블 기능들 =====

    showBOMTreeSection(show = true) {
        const treeSection = document.getElementById('bom-tree-section');
        if (treeSection) {
            treeSection.style.display = show ? 'block' : 'none';
        }
    }

    renderInteractiveBOMTable(bomTreeData) {
        if (!bomTreeData || bomTreeData.length === 0) return;

        this.currentBOMTreeData = bomTreeData;
        this.processedTreeData = this.preprocessTreeData(bomTreeData);
        
        // 트리 테이블 렌더링
        this.renderBOMTreeTable();
        
        // 이벤트 연결
        this.attachBOMTreeEvents();
        
        // 통계 업데이트
        this.updateTreeStatistics();
        
        console.log('인터랙티브 BOM 트리 테이블 렌더링 완료:', bomTreeData.length, '개 아이템');
    }

    preprocessTreeData(data) {
        return data.map((item, index) => {
            const nextItem = data[index + 1];
            const isParent = nextItem && nextItem.depth > item.depth;
            
            return {
                ...item,
                isParent: isParent,
                rowId: `tree-row-${index}`,
                isVisible: item.depth === 0 // 초기에는 Level 0만 보임
            };
        });
    }

    renderBOMTreeTable() {
        const tbody = document.getElementById('bom-tree-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.processedTreeData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.id = item.rowId;
            row.className = `bom-tree-row depth-${item.depth}`;
            row.setAttribute('data-level', item.depth);
            row.setAttribute('data-index', index);

            // 초기 상태: Depth 0만 보이고 나머지는 숨김
            if (item.depth > 0) {
                row.classList.add('hidden-tree-row');
            }

            // 계층별 스타일 적용
            this.applyDepthStyling(row, item.depth);

            const toggleIcon = item.isParent ? 
                `<span class="tree-toggle-icon" data-expanded="false">▶</span>` : 
                '<span style="margin-right: 22px;"></span>';

            // 도면 링크 생성
            const drawingNumber = item.number || item.Number;
            const drawingLink = drawingNumber && this.drawingFiles.has(drawingNumber) ? 
                `<button onclick="bomAnalyzer.viewDrawing('${drawingNumber}')" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <i class="fas fa-file-pdf mr-1"></i>보기
                </button>` : 
                `<span class="text-gray-400 text-sm">
                    <i class="fas fa-minus"></i>
                </span>`;

            // 요청된 컬럼 순서: Depth / Name / Number / Version / FindNumber / Quantity / TotalQuantity / Unit / Weight / Material / Drawing
            row.innerHTML = `
                <td class="px-4 py-3 border-r">${item.depth}</td>
                <td class="px-4 py-3 border-r">
                    <div class="tree-name-cell" onclick="${item.isParent ? `toggleTreeRow(${index})` : ''}">
                        ${toggleIcon}
                        <span class="name-text">${item.name}</span>
                    </div>
                </td>
                <td class="px-4 py-3 border-r font-mono text-sm">${item.number}</td>
                <td class="px-4 py-3 border-r text-center">${item.version}</td>
                <td class="px-4 py-3 border-r text-center">${item.findNumber}</td>
                <td class="px-4 py-3 border-r text-right">${item.quantity}</td>
                <td class="px-4 py-3 border-r text-right font-medium">${item.totalQuantity}</td>
                <td class="px-4 py-3 border-r text-center">${item.unit}</td>
                <td class="px-4 py-3 border-r text-right">${item.weight}</td>
                <td class="px-4 py-3 border-r">${item.material}</td>
                <td class="px-4 py-3 text-center drawing-link-cell">${drawingLink}</td>
            `;

            tbody.appendChild(row);
        });
    }

    applyDepthStyling(row, depth) {
        // 계층별 배경색과 들여쓰기
        const depthColors = {
            1: 'bg-white',
            2: 'bg-blue-50', 
            3: 'bg-indigo-50',
            4: 'bg-purple-50',
            5: 'bg-pink-50'
        };
        
        row.classList.add(depthColors[depth] || 'bg-gray-50');
        
        // 들여쓰기 적용
        const nameCell = row.querySelector('.tree-name-cell');
        if (nameCell) {
            nameCell.style.paddingLeft = `${depth * 20 + 10}px`; // Depth 0부터 시작하므로 -1 제거
        }

        // 호버 효과
        row.addEventListener('mouseenter', () => {
            row.classList.add('bg-yellow-50');
        });
        
        row.addEventListener('mouseleave', () => {
            row.classList.remove('bg-yellow-50');
            row.classList.add(depthColors[depth] || 'bg-gray-50');
        });
    }

    attachBOMTreeEvents() {
        // 전체 펼치기/접기 버튼
        const expandAllBtn = document.getElementById('expand-all-btn');
        const collapseAllBtn = document.getElementById('collapse-all-btn');
        const exportTreeBtn = document.getElementById('export-tree-btn');

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => this.expandAllTreeRows());
        }

        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => this.collapseAllTreeRows());
        }

        if (exportTreeBtn) {
            exportTreeBtn.addEventListener('click', () => this.exportTreeData());
        }
    }

    expandAllTreeRows() {
        this.processedTreeData.forEach((item, index) => {
            const row = document.getElementById(item.rowId);
            if (row) {
                row.classList.remove('hidden-tree-row');
                
                if (item.isParent) {
                    const toggleIcon = row.querySelector('.tree-toggle-icon');
                    if (toggleIcon) {
                        toggleIcon.setAttribute('data-expanded', 'true');
                        toggleIcon.textContent = '▼';
                    }
                }
            }
        });
        this.updateTreeStatistics();
    }

    collapseAllTreeRows() {
        this.processedTreeData.forEach((item, index) => {
            const row = document.getElementById(item.rowId);
            if (row) {
                if (item.depth > 0) {
                    row.classList.add('hidden-tree-row');
                }
                
                if (item.isParent) {
                    const toggleIcon = row.querySelector('.tree-toggle-icon');
                    if (toggleIcon) {
                        toggleIcon.setAttribute('data-expanded', 'false');
                        toggleIcon.textContent = '▶';
                    }
                }
            }
        });
        this.updateTreeStatistics();
    }

    updateTreeStatistics() {
        const totalItems = this.processedTreeData.length;
        const visibleRows = document.querySelectorAll('.bom-tree-row:not(.hidden-tree-row)').length;
        const maxDepth = Math.max(...this.processedTreeData.map(item => item.depth));
        const parentItems = this.processedTreeData.filter(item => item.isParent).length;

        document.getElementById('tree-stat-total').textContent = totalItems;
        document.getElementById('tree-stat-visible').textContent = visibleRows;
        document.getElementById('tree-stat-max-depth').textContent = maxDepth;
        document.getElementById('tree-stat-parents').textContent = parentItems;
    }

    exportTreeData() {
        const visibleData = this.processedTreeData.filter((item, index) => {
            const row = document.getElementById(item.rowId);
            return row && !row.classList.contains('hidden-tree-row');
        });

        const csvContent = [
            ['Depth', 'Name', 'Number', 'Version', 'FindNumber', 'Quantity', 'TotalQuantity', 'Unit', 'Weight', 'Material'].join(','),
            ...visibleData.map(item => 
                [item.depth, `"${item.name}"`, item.number, item.version, item.findNumber, 
                 item.quantity, item.totalQuantity, item.unit, item.weight, `"${item.material}"`].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cs_wind_bom_tree_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showToast('BOM 트리 데이터가 CSV로 내보내졌습니다.', 'success');
    }
}

// 전역 트리 토글 함수
window.toggleTreeRow = function(parentIndex) {
    const bomAnalyzer = window.csWindApp?.bomAnalyzer;
    if (!bomAnalyzer || !bomAnalyzer.processedTreeData) return;

    const parentItem = bomAnalyzer.processedTreeData[parentIndex];
    const parentRow = document.getElementById(parentItem.rowId);
    const toggleIcon = parentRow.querySelector('.tree-toggle-icon');
    
    const isCurrentlyExpanded = toggleIcon.getAttribute('data-expanded') === 'true';
    const newExpandedState = !isCurrentlyExpanded;
    
    // 토글 아이콘 상태 변경
    toggleIcon.setAttribute('data-expanded', newExpandedState);
    toggleIcon.textContent = newExpandedState ? '▼' : '▶';

    // 하위 항목들 토글 (재귀적으로 모든 하위 레벨 포함)
    const parentDepth = parentItem.depth;
    
    for (let i = parentIndex + 1; i < bomAnalyzer.processedTreeData.length; i++) {
        const currentItem = bomAnalyzer.processedTreeData[i];
        
        // 같은 레벨이거나 더 상위 레벨을 만나면 중단
        if (currentItem.depth <= parentDepth) {
            break;
        }
        
        const currentRow = document.getElementById(currentItem.rowId);
        
        if (newExpandedState) {
            // 펼치기: 직계 자식만 보이게 하고, 손자 이하는 각자의 상태에 따라
            if (currentItem.depth === parentDepth + 1) {
                currentRow.classList.remove('hidden-tree-row');
            }
        } else {
            // 접기: 모든 하위 항목 숨기기
            currentRow.classList.add('hidden-tree-row');
            
            // 하위 항목들의 토글 상태도 초기화
            if (currentItem.isParent) {
                const childToggleIcon = currentRow.querySelector('.tree-toggle-icon');
                if (childToggleIcon) {
                    childToggleIcon.setAttribute('data-expanded', 'false');
                    childToggleIcon.textContent = '▶';
                }
            }
        }
    }

    bomAnalyzer.updateTreeStatistics();
};

// 기본 BOM 분석용 전역 함수들
window.refreshProjectList = function() {
    // 프로젝트 목록 새로고침
    console.log('프로젝트 목록 새로고침');
    window.csWindApp?.showToast('프로젝트 목록이 업데이트되었습니다.', 'success');
};

window.uploadBOMFileBasic = async function() {
    console.log('=== uploadBOMFileBasic 함수 호출됨 ===');
    
    // 프로젝트 선택 확인
    const projectSelect = document.getElementById('project-select-bom');
    if (!projectSelect || !projectSelect.value) {
        window.csWindApp?.showToast('먼저 프로젝트를 선택해주세요.', 'error');
        return;
    }
    
    // 파일 선택 확인
    const fileInput = document.getElementById('bom-file-input');
    const file = fileInput?.files[0];
    if (!file) {
        window.csWindApp?.showToast('업로드할 파일을 선택해주세요.', 'error');
        return;
    }
    
    console.log('선택된 프로젝트:', projectSelect.value);
    console.log('선택된 파일:', file.name);
    
    try {
        window.csWindApp?.showLoading(true);
        
        let rawData;
        if (file.name.toLowerCase().endsWith('.csv')) {
            const csvData = await FileUtils.readCSV(file);
            rawData = csvData.data;
        } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
            rawData = await parseExcelFileBasic(file);
        } else {
            throw new Error('지원되지 않는 파일 형식입니다. Excel(.xlsx, .xls) 또는 CSV 파일을 사용해주세요.');
        }
        
        console.log('파일 파싱 완료, 행 수:', rawData.length);
        
        // 첫 번째 행에서 실제 컬럼명 확인 (디버깅)
        if (rawData.length > 0) {
            console.log('=== Excel 파일의 실제 컬럼명들 ===');
            console.log('사용 가능한 컬럼:', Object.keys(rawData[0]));
            
            // F열이 Number 컬럼인지 확인
            const columnNames = Object.keys(rawData[0]);
            console.log('컬럼 순서:');
            columnNames.forEach((col, idx) => {
                console.log(`${String.fromCharCode(65 + idx)}열: "${col}"`);
            });
        }
        
        // 10가지 필수 컬럼만 추출하여 BOM 데이터 가공
        const bomTreeData = [];
        
        for (const [index, row] of rawData.entries()) {
            // 컬럼 매핑을 더 광범위하게 처리
            const bomItem = {
                project_id: projectSelect.value,
                rowIndex: index,
                // 10가지 필수 컬럼 - 다양한 컬럼명 지원
                depth: extractDepthBasic(row),
                name: findColumnValue(row, ['BOM Cube', 'BOMCube', 'BOM_Cube', 'Name', '부품명', '아이템명', 'Item Name', 'Part Name', 'Component Name', 'Description', '품명', 'ItemName']),
                number: findColumnValue(row, ['Number', '부품번호', 'Part Number', 'Drawing Number', 'Item Number', 'P/N', 'PN', '도번', '품번', 'DRAWING NO']),
                version: findColumnValue(row, ['Version', '버전', 'Ver', 'Rev', 'Revision', '개정', 'V', 'REV']),
                findNumber: findColumnValue(row, ['FindNumber', 'Find Number', 'Find#', 'Find No', '순번', '번호', 'No', 'Item No', '#']) || (index + 1),
                quantity: parseNumberBasic(findColumnValue(row, ['Quantity', '수량', 'Qty', 'Q\'ty', 'Amount', '개수', 'EA', 'Pcs'])) || 1,
                totalQuantity: parseNumberBasic(findColumnValue(row, ['TotalQuantity', 'Total Quantity', '총수량', 'Total Qty', 'Total Amount', '합계수량', 'Sum Qty'])) || 1,
                unit: findColumnValue(row, ['Unit', '단위', 'UOM', 'U/M', 'Units', 'Measure']) || 'each',
                weight: parseWeightBasic(findColumnValue(row, ['Weight', '무게', '중량', 'Mass', 'Wt', 'W', '질량', 'KG', 'kg', 'WEIGHT', 'Weight(KG)', '무게(KG)', 'Unit Weight'])) || '-',
                material: findColumnValue(row, ['Material', '재질', 'Material Type', '재료', 'Mat\'l', 'Grade', '등급', 'Steel Grade', '강종', 'MATERIAL', 'Mat.', 'Steel', '소재']) || '-'
            };
            
            // 빈 행 제외 (이름이나 번호가 있는 행만 포함)
            if (bomItem.name || bomItem.number) {
                bomTreeData.push(bomItem);
            }
        }
        
        console.log('BOM 데이터 가공 완료:', bomTreeData.length, '개 아이템');
        
        // 디버깅을 위한 상세 로깅
        console.log('=== BOM 데이터 상세 정보 ===');
        console.log('총 아이템 수:', bomTreeData.length);
        
        // 레벨별 통계
        const levelStats = {};
        bomTreeData.forEach(item => {
            levelStats[item.depth] = (levelStats[item.depth] || 0) + 1;
        });
        console.log('레벨별 아이템 수:', levelStats);
        
        // 첫 5개 아이템 출력
        console.log('첫 5개 아이템 샘플:');
        bomTreeData.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. [Level ${item.depth}] ${item.name} (${item.number})`);
        });
        
        // BOM 트리 구조 테이블 렌더링 (업로드 섹션 바로 아래에)
        renderBasicBOMTreeTable(bomTreeData);
        
        // BOM 트리 섹션 표시
        const treeSection = document.getElementById('bom-tree-section');
        if (treeSection) {
            treeSection.classList.remove('hidden');
        }
        
        // 파일 입력 초기화
        fileInput.value = '';
        document.getElementById('upload-bom-btn').disabled = true;
        document.getElementById('selected-file-info').classList.add('hidden');
        
        window.csWindApp?.showToast(`${bomTreeData.length}개의 BOM 아이템이 트리 구조로 성공적으로 업로드되었습니다.`, 'success');
        
    } catch (error) {
        console.error('BOM 파일 업로드 실패:', error);
        window.csWindApp?.showToast(`파일 업로드 실패: ${error.message}`, 'error');
    } finally {
        window.csWindApp?.showLoading(false);
    }
};

window.clearSelectedFile = function() {
    const fileInput = document.getElementById('bom-file-input');
    const fileInfo = document.getElementById('selected-file-info');
    const uploadBtn = document.getElementById('upload-bom-btn');
    
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    uploadBtn.disabled = true;
};

window.expandAllTreeRows = function() {
    // 기본 BOM 분석용 데이터 확인
    if (window.processedBasicTreeData) {
        window.processedBasicTreeData.forEach((item, index) => {
            if (item.isParent) {
                const row = document.getElementById(item.rowId);
                const toggleIcon = row?.querySelector('.tree-toggle-icon');
                if (toggleIcon && toggleIcon.getAttribute('data-expanded') === 'false') {
                    window.toggleBasicTreeRow(index);
                }
            }
        });
        return;
    }
    
    // 고급 BOM 분석용 데이터 확인
    const bomAnalyzer = window.csWindApp?.bomAnalyzer;
    if (bomAnalyzer && bomAnalyzer.processedTreeData) {
        bomAnalyzer.processedTreeData.forEach((item, index) => {
            if (item.isParent) {
                const row = document.getElementById(item.rowId);
                const toggleIcon = row?.querySelector('.tree-toggle-icon');
                if (toggleIcon && toggleIcon.getAttribute('data-expanded') === 'false') {
                    window.toggleTreeRow(index);
                }
            }
        });
    }
};

window.collapseAllTreeRows = function() {
    // 기본 BOM 분석용 데이터 확인
    if (window.processedBasicTreeData) {
        window.processedBasicTreeData.forEach((item, index) => {
            if (item.isParent) {
                const row = document.getElementById(item.rowId);
                const toggleIcon = row?.querySelector('.tree-toggle-icon');
                if (toggleIcon && toggleIcon.getAttribute('data-expanded') === 'true') {
                    window.toggleBasicTreeRow(index);
                }
            }
        });
        return;
    }
    
    // 고급 BOM 분석용 데이터 확인
    const bomAnalyzer = window.csWindApp?.bomAnalyzer;
    if (bomAnalyzer && bomAnalyzer.processedTreeData) {
        bomAnalyzer.processedTreeData.forEach((item, index) => {
            if (item.isParent) {
                const row = document.getElementById(item.rowId);
                const toggleIcon = row?.querySelector('.tree-toggle-icon');
                if (toggleIcon && toggleIcon.getAttribute('data-expanded') === 'true') {
                    window.toggleTreeRow(index);
                }
            }
        });
    }
};

window.exportVisibleItems = function() {
    const visibleRows = document.querySelectorAll('#bom-tree-body tr:not(.hidden-tree-row)');
    if (visibleRows.length === 0) {
        window.csWindApp?.showToast('내보낼 데이터가 없습니다.', 'error');
        return;
    }
    
    // CSV 형태로 현재 보이는 항목들 내보내기
    let csvContent = 'Depth,Name,Number,Version,FindNumber,Quantity,TotalQuantity,Unit,Weight,Material\n';
    
    visibleRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).map(cell => {
            let text = cell.textContent.trim();
            // 특수 문자 처리
            text = text.replace(/"/g, '""');
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                text = `"${text}"`;
            }
            return text;
        });
        csvContent += rowData.join(',') + '\n';
    });
    
    // 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BOM_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    window.csWindApp?.showToast(`${visibleRows.length}개 항목이 CSV로 내보내기 완료되었습니다.`, 'success');
};

// 실제 Excel 파일 파싱 함수 (SheetJS 라이브러리 사용)
async function parseExcelFileBasic(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                console.log('=== Excel 파일 파싱 시작 ===');
                
                // SheetJS를 사용하여 실제 Excel 파일 읽기
                const arrayBuffer = e.target.result;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                
                console.log('Excel 워크북 로드됨. 시트 목록:', workbook.SheetNames);
                
                // "Full BOM" 시트 찾기 (대소문자 구분 없이)
                let targetSheetName = null;
                for (const sheetName of workbook.SheetNames) {
                    if (sheetName.toLowerCase().includes('full') && sheetName.toLowerCase().includes('bom')) {
                        targetSheetName = sheetName;
                        break;
                    }
                }
                
                // "Full BOM" 시트가 없으면 첫 번째 시트 사용
                if (!targetSheetName) {
                    targetSheetName = workbook.SheetNames[0];
                    console.log('Full BOM 시트를 찾을 수 없어 첫 번째 시트를 사용합니다:', targetSheetName);
                } else {
                    console.log('Full BOM 시트를 찾았습니다:', targetSheetName);
                }
                
                const worksheet = workbook.Sheets[targetSheetName];
                
                // 시트를 JSON으로 변환 (헤더 행 포함)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,  // 첫 번째 행을 헤더로 사용
                    defval: ''  // 빈 셀은 빈 문자열로 처리
                });
                
                console.log('JSON 데이터 변환 완료. 총 행 수:', jsonData.length);
                
                if (jsonData.length < 2) {
                    throw new Error('Excel 파일에 데이터가 충분하지 않습니다.');
                }
                
                // 첫 번째 행을 헤더로 사용하여 객체 배열 생성
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);
                
                console.log('헤더:', headers);
                console.log('데이터 행 수:', dataRows.length);
                
                const bomData = dataRows.map((row, index) => {
                    const rowObj = {};
                    headers.forEach((header, colIndex) => {
                        if (header && typeof header === 'string') {
                            rowObj[header.trim()] = row[colIndex] || '';
                        }
                    });
                    return rowObj;
                }).filter(row => {
                    // 비어있지 않은 행만 필터링
                    return Object.values(row).some(value => value && value.toString().trim() !== '');
                });
                
                console.log('최종 BOM 데이터:', bomData.length, '개 행');
                console.log('첫 번째 데이터 샘플:', bomData[0]);
                
                resolve(bomData);
                
            } catch (error) {
                console.error('Excel 파일 파싱 중 오류 발생:', error);
                reject(new Error(`Excel 파일을 읽을 수 없습니다: ${error.message}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function extractDepthBasic(row) {
    console.log('=== extractDepthBasic 시작 ===');
    
    // 먼저 NAME/BOM Cube 컬럼의 들여쓰기를 확인 (이것이 실제 계층을 나타냄)
    const possibleNameColumns = [
        'NAME', 'Name', 'BOM Cube', 'BOMCube', 'BOM_Cube', 'bomcube', 'BOMCUBE',
        'Item Name', '부품명', '아이템명', 'Component Name', 'Description'
    ];
    
    let itemNameForDepth = null;
    let usedColumn = '';
    
    for (const colName of possibleNameColumns) {
        if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
            itemNameForDepth = row[colName].toString();
            usedColumn = colName;
            console.log(`들여쓰기 분석용 컬럼 발견: ${colName} = "${itemNameForDepth}"`);
            break;
        }
    }
    
    // 들여쓰기 분석이 가장 중요함 (실제 계층 구조를 나타냄)
    if (itemNameForDepth && typeof itemNameForDepth === 'string') {
        // 앞쪽 공백 문자 개수 계산
        const leadingWhitespace = itemNameForDepth.match(/^(\s*)/)[1];
        const leadingSpaces = leadingWhitespace.length;
        
        // 탭 문자와 공백 문자 구분 계산
        const tabCount = (leadingWhitespace.match(/\t/g) || []).length;
        const spaceCount = leadingSpaces - tabCount;
        
        // Depth 계산 - 더 정교한 로직
        let calculatedDepth = 0;
        
        if (tabCount > 0) {
            // 탭 문자 기반: 1탭 = 1레벨
            calculatedDepth = tabCount;
        } else if (spaceCount > 0) {
            // 공백 기반: 다양한 패턴 지원
            if (spaceCount >= 4) {
                calculatedDepth = Math.floor(spaceCount / 4); // 4칸당 1레벨
            } else if (spaceCount >= 2) {
                calculatedDepth = Math.floor(spaceCount / 2); // 2칸당 1레벨
            } else {
                calculatedDepth = 1; // 1칸이라도 있으면 1레벨
            }
        }
        
        // 특별한 패턴 감지 (GST 코드는 보통 최상위 또는 1레벨)
        const trimmedName = itemNameForDepth.trim();
        if (trimmedName.startsWith('GST') && leadingSpaces === 0) {
            calculatedDepth = 0; // GST로 시작하고 들여쓰기가 없으면 최상위
        } else if (trimmedName.startsWith('GST') && leadingSpaces > 0) {
            calculatedDepth = 1; // GST로 시작하고 들여쓰기가 있으면 1레벨
        } else if (trimmedName.startsWith('E000') && leadingSpaces > 0) {
            // E000으로 시작하는 항목은 보통 하위 문서/부품
            calculatedDepth = Math.max(2, calculatedDepth); // 최소 2레벨
        }
        
        console.log(`들여쓰기 분석 결과:`);
        console.log(`- 컬럼: ${usedColumn}`);
        console.log(`- 원본 텍스트: "${itemNameForDepth}"`);
        console.log(`- 트림된 텍스트: "${trimmedName}"`);
        console.log(`- 전체 앞쪽 공백: ${leadingSpaces}개`);
        console.log(`- 탭 문자: ${tabCount}개`);
        console.log(`- 순수 공백: ${spaceCount}개`);
        console.log(`- 계산된 Depth: ${calculatedDepth}`);
        
        // 들여쓰기가 있다면 계산된 값 사용
        if (leadingSpaces > 0 || calculatedDepth > 0) {
            return calculatedDepth;
        }
    }
    
    // 들여쓰기가 없는 경우에만 Depth 컬럼 확인
    const possibleDepthColumns = [
        'DEPTH', 'Depth', 'Level', 'Lv', 'LV', '레벨', '단계', 'Stage', 'Tier', 
        'depth', 'level', 'lv', 'LEVEL', 'LV',
        '계층', 'Hierarchy', 'Tree Level', 'BOM Level'
    ];
    
    let depthValue = null;
    
    // Depth 컬럼에서 값 찾기
    for (const colName of possibleDepthColumns) {
        if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
            depthValue = row[colName];
            console.log(`Depth 컬럼 값 발견: ${colName} = ${depthValue}`);
            break;
        }
    }
    
    // Depth 컬럼 값이 있는 경우 (들여쓰기가 없을 때만 사용)
    if (depthValue !== null) {
        const parsedDepth = parseInt(depthValue.toString().replace(/[^\d]/g, ''));
        if (!isNaN(parsedDepth) && parsedDepth >= 0) {
            console.log(`Depth 컬럼 파싱 결과: ${parsedDepth}`);
            return parsedDepth;
        }
    }
    
    // 키워드 기반 추론 (최후 수단)
    if (itemNameForDepth) {
        const trimmedName = itemNameForDepth.trim();
        if (trimmedName.includes('조립품') || trimmedName.includes('Assembly') || trimmedName.includes('ASM')) {
            console.log('키워드 기반 Depth 추정: 0 (최상위 조립품)');
            return 0;
        } else if (trimmedName.startsWith('GST')) {
            console.log('키워드 기반 Depth 추정: 0 (GST 코드 - 최상위)');
            return 0;
        } else if (trimmedName.includes('Documentation') || trimmedName.includes('문서') || trimmedName.includes('도면') || trimmedName.includes('Ausführungsempfehlung')) {
            console.log('키워드 기반 Depth 추정: 2 (문서류)');
            return 2;
        }
    }
    
    console.log('Depth를 추정할 수 없어 기본값 0을 사용합니다. 행 데이터:', row);
    return 0; // 기본값을 0으로 설정
}

function parseNumberBasic(value) {
    if (!value) return 0;
    const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
}

function parseWeightBasic(value) {
    if (!value) return '-';
    const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return value.toString();
    return value.toString().includes('kg') ? value : `${num}kg`;
}

// 다양한 컬럼명에서 값을 찾는 헬퍼 함수
function findColumnValue(row, possibleNames) {
    for (const name of possibleNames) {
        // 정확한 매치
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name].toString().trim();
        }
        
        // 대소문자 무시 매치
        const lowerName = name.toLowerCase();
        for (const [key, value] of Object.entries(row)) {
            if (key.toLowerCase() === lowerName && value !== undefined && value !== null && value !== '') {
                return value.toString().trim();
            }
        }
        
        // 부분 매치 (컬럼명에 포함되는 경우)
        for (const [key, value] of Object.entries(row)) {
            if (key.toLowerCase().includes(lowerName) && value !== undefined && value !== null && value !== '') {
                return value.toString().trim();
            }
        }
    }
    return '';
}

// 기본 BOM 분석용 트리 테이블 렌더링
function renderBasicBOMTreeTable(bomTreeData, targetTableId = null) {
    console.log('=== renderBasicBOMTreeTable 호출 ===', bomTreeData.length);
    
    if (!bomTreeData || bomTreeData.length === 0) return;
    
    // 현재 데이터를 전역으로 저장
    window.currentBasicBOMData = bomTreeData;
    window.processedBasicTreeData = preprocessBasicTreeData(bomTreeData);
    
    // 타겟 테이블 ID 결정 (Sales팀용 vs Prod.Tech팀용)
    let tableId = targetTableId;
    if (!tableId) {
        // 현재 활성 탭에 따라 결정
        const projectManagementTab = document.querySelector('#tab-project-management');
        const bomAnalysisTab = document.querySelector('#tab-bom');
        
        if (projectManagementTab && !projectManagementTab.classList.contains('hidden')) {
            tableId = 'bom-tree-body-sales'; // Sales팀용
        } else if (bomAnalysisTab && !bomAnalysisTab.classList.contains('hidden')) {
            tableId = 'bom-tree-body'; // Prod.Tech팀용
        } else {
            tableId = 'bom-tree-body-sales'; // 기본값은 Sales팀용
        }
    }
    
    // 현재 사용 중인 테이블 ID를 전역으로 저장
    window.currentBOMTreeTableId = tableId;
    
    const tbody = document.getElementById(tableId);
    if (!tbody) {
        console.error(`${tableId} 요소를 찾을 수 없습니다.`);
        return;
    }
    
    console.log(`BOM 트리를 ${tableId}에 렌더링합니다.`);
    console.log(`처리된 트리 데이터: ${window.processedBasicTreeData.length}개 아이템`);
    
    // Sales팀용 테이블인 경우 BOM 분석 결과 섹션 표시
    if (tableId === 'bom-tree-body-sales') {
        const salesSection = document.getElementById('basic-bom-analysis-section-sales');
        if (salesSection) {
            salesSection.classList.remove('hidden');
            console.log('✅ Sales팀 BOM 분석 결과 섹션 표시됨');
        } else {
            console.error('❌ basic-bom-analysis-section-sales 요소를 찾을 수 없습니다');
        }
    }
    
    tbody.innerHTML = '';
    
    window.processedBasicTreeData.forEach((item, index) => {
        console.log(`아이템 ${index} 렌더링 중:`, item.name, `(Depth: ${item.depth})`);
        const row = document.createElement('tr');
        row.id = `basic-tree-row-${index}`;
        row.className = `bom-tree-row depth-${item.depth}`;
        row.setAttribute('data-level', item.depth);
        row.setAttribute('data-index', index);
        
        // 초기 상태: Depth 0만 보이고 나머지는 숨김
        if (item.depth > 0) {
            row.classList.add('hidden-tree-row');
        }
        
        // 계층별 스타일 적용
        applyBasicDepthStyling(row, item.depth);
        
        const toggleIcon = item.isParent ? 
            `<span class="tree-toggle-icon" data-expanded="false">▶</span>` : 
            '<span style="margin-right: 22px;"></span>';
        
        // 도면 링크 생성 (두 가지 소스 확인)
        const drawingNumber = item.number || item.Number;
        let hasDrawing = false;
        
        console.log(`도면 확인 중: ${drawingNumber}`);
        
        // 1. window.bomAnalyzer.drawingFiles 확인 (고급 BOM 분석)
        if (window.bomAnalyzer && drawingNumber && window.bomAnalyzer.drawingFiles.has(drawingNumber)) {
            hasDrawing = true;
            console.log(`✅ bomAnalyzer.drawingFiles에서 발견: ${drawingNumber}`);
        }
        
        // 2. window.drawingMap 확인 (기본 BOM 분석의 드로잉 패키지 업로드)
        if (!hasDrawing && window.drawingMap && drawingNumber) {
            // 정확한 매칭 시도
            if (window.drawingMap.has(drawingNumber)) {
                hasDrawing = true;
                console.log(`✅ window.drawingMap에서 정확 매칭: ${drawingNumber}`);
            } 
            // E코드 prefix 매칭 시도 (E0003589466-03 → E0003589466)
            else if (drawingNumber.startsWith('E') && drawingNumber.includes('-')) {
                const prefix = drawingNumber.split('-')[0]; // E0003589466-03 → E0003589466
                if (window.drawingMap.has(prefix)) {
                    hasDrawing = true;
                    console.log(`✅ window.drawingMap에서 E코드 prefix 매칭: ${drawingNumber} → ${prefix}`);
                }
            }
        }
        
        if (!hasDrawing && drawingNumber) {
            console.log(`❌ 도면을 찾을 수 없음: ${drawingNumber}`, {
                drawingMapExists: !!window.drawingMap,
                drawingMapSize: window.drawingMap ? window.drawingMap.size : 0,
                bomAnalyzerExists: !!window.bomAnalyzer,
                bomAnalyzerDrawingFilesSize: window.bomAnalyzer ? window.bomAnalyzer.drawingFiles.size : 0
            });
        }
        
        const drawingLink = hasDrawing ? 
            `<button onclick="viewPDF('${drawingNumber}')" 
                    class="text-blue-600 hover:text-blue-800 text-xs font-medium">
                <i class="fas fa-file-pdf mr-1"></i>보기
            </button>` : 
            `<span class="text-gray-400 text-xs">
                <i class="fas fa-minus"></i>
            </span>`;

        // 컬럼 순서 (TotalQuantity 제거): Depth / Name / Number / Version / FindNumber / Quantity / Unit / Weight / Material / Drawing
        
        // Weight 및 Material 빈 값 처리
        const weightDisplay = (item.weight && item.weight !== '' && item.weight !== 'undefined' && item.weight !== 'null') ? item.weight : '-';
        const materialDisplay = (item.material && item.material !== '' && item.material !== 'undefined' && item.material !== 'null') ? item.material : '-';
        
        row.innerHTML = `
            <td class="px-2 py-1 border-r text-xs">${item.depth}</td>
            <td class="px-2 py-1 border-r">
                <div class="tree-name-cell text-xs" onclick="${item.isParent ? `toggleBasicTreeRow(${index})` : ''}">
                    ${toggleIcon}
                    <span class="name-text">${item.name}</span>
                </div>
            </td>
            <td class="px-2 py-1 border-r font-mono text-xs">${item.number}</td>
            <td class="px-2 py-1 border-r text-center text-xs">${item.version}</td>
            <td class="px-2 py-1 border-r text-center text-xs">${item.findNumber}</td>
            <td class="px-2 py-1 border-r text-right text-xs">${item.quantity}</td>
            <td class="px-2 py-1 border-r text-center text-xs">${item.unit}</td>
            <td class="px-2 py-1 border-r text-right text-xs">${weightDisplay}</td>
            <td class="px-2 py-1 border-r text-xs">${materialDisplay}</td>
            <td class="px-2 py-1 text-center drawing-link-cell">${drawingLink}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // 통계 업데이트
    updateBasicTreeStatistics();
    
    console.log(`✅ 기본 BOM 트리 테이블 렌더링 완료 - ${window.processedBasicTreeData.length}개 행이 ${tableId}에 추가됨`);
}

function preprocessBasicTreeData(data) {
    console.log('=== preprocessBasicTreeData 시작 ===');
    console.log('입력 데이터:', data);
    
    return data.map((item, index) => {
        // 현재 항목이 부모인지 확인: 다음에 나오는 항목 중 depth가 더 큰 것이 있는지 확인
        let isParent = false;
        
        // 현재 항목 다음부터 끝까지 또는 같은/상위 레벨을 만날 때까지 확인
        for (let nextIndex = index + 1; nextIndex < data.length; nextIndex++) {
            const nextItem = data[nextIndex];
            
            if (nextItem.depth > item.depth) {
                // 더 깊은 레벨이 나타나면 현재 항목은 부모
                isParent = true;
                break;
            } else if (nextItem.depth <= item.depth) {
                // 같은 레벨이나 상위 레벨이 나타나면 더 이상 확인할 필요 없음
                break;
            }
        }
        
        const processedItem = {
            ...item,
            isParent: isParent,
            rowId: `basic-tree-row-${index}`,
            isVisible: item.depth === 0 // 초기에는 Level 0만 보임
        };
        
        console.log(`항목 ${index}: ${item.name} (Depth: ${item.depth}, isParent: ${isParent})`);
        
        return processedItem;
    });
}

function applyBasicDepthStyling(row, depth) {
    // 계층별 배경색과 들여쓰기 (Depth 0부터 시작)
    const depthColors = {
        0: 'bg-white',
        1: 'bg-blue-50', 
        2: 'bg-indigo-50',
        3: 'bg-purple-50',
        4: 'bg-pink-50',
        5: 'bg-orange-50'
    };
    
    row.classList.add(depthColors[depth] || 'bg-gray-50');
    
    // 들여쓰기 적용
    const nameCell = row.querySelector('.tree-name-cell');
    if (nameCell) {
        nameCell.style.paddingLeft = `${depth * 20 + 10}px`; // Depth 0부터 시작하므로 -1 제거
    }
    
    // 호버 효과
    row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    });
    
    row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = '';
    });
}

function updateBasicTreeStatistics() {
    if (!window.processedBasicTreeData) return;
    
    const totalItems = window.processedBasicTreeData.length;
    
    // 동적으로 현재 테이블 ID 사용
    const tableId = window.currentBOMTreeTableId || 'bom-tree-body-sales';
    const visibleRows = document.querySelectorAll(`#${tableId} tr:not(.hidden-tree-row)`);
    const visibleItems = visibleRows.length;
    const maxDepth = Math.max(...window.processedBasicTreeData.map(item => item.depth));
    const parentItems = window.processedBasicTreeData.filter(item => item.isParent).length;
    
    // 통계 정보 업데이트 (Sales팀용과 Prod.Tech팀용 모두)
    if (tableId === 'bom-tree-body-sales') {
        // Sales팀용 통계 업데이트
        const totalElementSales = document.getElementById('total-items-sales');
        const visibleElementSales = document.getElementById('visible-items-sales');
        const maxDepthElementSales = document.getElementById('max-depth-sales');
        const parentElementSales = document.getElementById('parent-items-sales');
        
        if (totalElementSales) totalElementSales.textContent = totalItems;
        if (visibleElementSales) visibleElementSales.textContent = visibleItems;
        if (maxDepthElementSales) maxDepthElementSales.textContent = maxDepth;
        if (parentElementSales) parentElementSales.textContent = parentItems;
        
        console.log(`📊 Sales팀 통계 업데이트: 총 ${totalItems}, 표시 ${visibleItems}, 최대 레벨 ${maxDepth}, 부모 ${parentItems}`);
    } else {
        // Prod.Tech팀용 통계 업데이트
        const totalElement = document.getElementById('total-items');
        const visibleElement = document.getElementById('visible-items');
        const maxDepthElement = document.getElementById('max-depth');
        const parentElement = document.getElementById('parent-items');
        
        if (totalElement) totalElement.textContent = totalItems;
        if (visibleElement) visibleElement.textContent = visibleItems;
        if (maxDepthElement) maxDepthElement.textContent = maxDepth;
        if (parentElement) parentElement.textContent = parentItems;
        
        console.log(`📊 Prod.Tech팀 통계 업데이트: 총 ${totalItems}, 표시 ${visibleItems}, 최대 레벨 ${maxDepth}, 부모 ${parentItems}`);
    }
}

// 기본 BOM 분석용 트리 토글 함수
window.toggleBasicTreeRow = function(parentIndex) {
    if (!window.processedBasicTreeData) return;
    
    const parentItem = window.processedBasicTreeData[parentIndex];
    const parentRow = document.getElementById(parentItem.rowId);
    const toggleIcon = parentRow?.querySelector('.tree-toggle-icon');
    
    if (!toggleIcon) return;
    
    const isCurrentlyExpanded = toggleIcon.getAttribute('data-expanded') === 'true';
    const newExpandedState = !isCurrentlyExpanded;
    
    // 토글 아이콘 상태 변경
    toggleIcon.setAttribute('data-expanded', newExpandedState);
    toggleIcon.textContent = newExpandedState ? '▼' : '▶';
    
    // 하위 항목들 토글 (재귀적으로 모든 하위 레벨 포함)
    const parentDepth = parentItem.depth;
    
    for (let i = parentIndex + 1; i < window.processedBasicTreeData.length; i++) {
        const currentItem = window.processedBasicTreeData[i];
        
        // 같은 레벨이거나 더 상위 레벨을 만나면 중단
        if (currentItem.depth <= parentDepth) {
            break;
        }
        
        const currentRow = document.getElementById(currentItem.rowId);
        
        if (newExpandedState) {
            // 펼치기: 직계 자식만 보이게 하고, 손자 이하는 각자의 상태에 따라
            if (currentItem.depth === parentDepth + 1) {
                currentRow.classList.remove('hidden-tree-row');
            }
        } else {
            // 접기: 모든 하위 항목 숨기기
            currentRow.classList.add('hidden-tree-row');
            
            // 하위 항목들의 토글 상태도 초기화
            if (currentItem.isParent) {
                const childToggleIcon = currentRow.querySelector('.tree-toggle-icon');
                if (childToggleIcon) {
                    childToggleIcon.setAttribute('data-expanded', 'false');
                    childToggleIcon.textContent = '▶';
                }
            }
        }
    }
    
    updateBasicTreeStatistics();
};

// 프로젝트 선택 변경 이벤트
document.addEventListener('DOMContentLoaded', () => {
    // 프로젝트 선택 드롭다운 이벤트
    setTimeout(() => {
        const projectSelect = document.getElementById('project-select-bom');
        if (projectSelect) {
            projectSelect.addEventListener('change', function() {
                const projectInfo = document.getElementById('selected-project-info');
                const projectInfoContent = document.getElementById('project-info-content');
                
                if (this.value) {
                    // 선택된 프로젝트 정보 표시
                    projectInfo.classList.remove('hidden');
                    const projectName = this.options[this.selectedIndex].text;
                    projectInfoContent.innerHTML = `
                        <div class="space-y-1">
                            <p><span class="font-medium">프로젝트명:</span> ${projectName}</p>
                            <p><span class="font-medium">프로젝트 ID:</span> ${this.value}</p>
                            <p><span class="font-medium">상태:</span> <span class="text-green-600">활성</span></p>
                        </div>
                    `;
                    
                    // BOM 파일 업로드 활성화
                    const bomSection = document.querySelector('#basic-bom-interface .bg-white.rounded-lg.shadow.p-6:nth-child(2)');
                    if (bomSection) {
                        bomSection.classList.remove('opacity-50', 'pointer-events-none');
                    }
                } else {
                    projectInfo.classList.add('hidden');
                    // BOM 파일 업로드 비활성화
                    const bomSection = document.querySelector('#basic-bom-interface .bg-white.rounded-lg.shadow.p-6:nth-child(2)');
                    if (bomSection) {
                        bomSection.classList.add('opacity-50', 'pointer-events-none');
                    }
                }
            });
        }
        
        // 파일 선택 이벤트
        const fileInput = document.getElementById('bom-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                const file = this.files[0];
                const fileInfo = document.getElementById('selected-file-info');
                const uploadBtn = document.getElementById('upload-bom-btn');
                
                if (file) {
                    document.getElementById('file-name').textContent = file.name;
                    document.getElementById('file-size').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                    fileInfo.classList.remove('hidden');
                    uploadBtn.disabled = false;
                } else {
                    fileInfo.classList.add('hidden');
                    uploadBtn.disabled = true;
                }
            });
        }
    }, 500);
});

// BOM 트리 렌더링 함수들을 즉시 전역에서 접근 가능하도록 설정
window.renderBasicBOMTreeTable = renderBasicBOMTreeTable;
window.preprocessBasicTreeData = preprocessBasicTreeData;
window.updateBasicTreeStatistics = updateBasicTreeStatistics;

console.log('✅ BOM 트리 함수들이 전역에 등록되었습니다.');

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.bomAnalyzer = new BOMAnalyzer(window.csWindApp);
            
            // 전역 함수로 접근 가능하도록 설정
            window.viewDrawing = (drawingNumber) => {
                if (window.bomAnalyzer) {
                    window.bomAnalyzer.viewDrawing(drawingNumber);
                } else {
                    console.error('bomAnalyzer 인스턴스를 찾을 수 없습니다.');
                }
            };
            
            console.log('BOMAnalyzer 인스턴스가 생성되었습니다.');
        }
    }, 100);
});