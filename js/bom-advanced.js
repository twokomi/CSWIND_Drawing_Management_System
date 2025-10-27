// 고급 BOM 분석 및 도면 관리 시스템

class AdvancedBOMManager {
    constructor(app) {
        this.app = app;
        this.originalBOM = [];
        this.classifiedBOM = [];
        this.materialCategoryPackages = {}; // 자재 특성별 분류 (Small/Large/전장품/기타)
        this.modulePackages = {};
        this.lltPackages = {};
        this.drawingLinks = new Map();
        this.aiClassificationResults = [];
        this.draggedItem = null;
        this.approvedPackages = []; // CEO 승인 완료된 패키지 목록
        this.init();
    }

    init() {
        console.log('고급 BOM 매니저 초기화 시작');
        
        // DOM 요소 확인 후 초기화
        if (this.checkDOMReady()) {
            this.setupAdvancedBOMEvents();
            this.loadDrawingDatabase();
            this.setupDragAndDrop();
            
            // 승인된 패키지 UI 초기화
            setTimeout(() => this.updateApprovedPackagesUI(), 500);
        } else {
            console.log('고급 BOM 매니저: DOM 준비 대기 중... 3초 후 재시도');
            // 3초 후 재시도
            setTimeout(() => {
                if (this.checkDOMReady()) {
                    console.log('DOM 재시도 성공');
                    this.setupAdvancedBOMEvents();
                    this.loadDrawingDatabase();
                    this.setupDragAndDrop();
                    
                    // 승인된 패키지 UI 초기화
                    setTimeout(() => this.updateApprovedPackagesUI(), 500);
                } else {
                    console.error('DOM 요소를 찾을 수 없어 고급 BOM 매니저 초기화 실패');
                }
            }, 3000);
        }
    }
    
    checkDOMReady() {
        const requiredElements = [
            'btn-upload-bom-advanced',
            'btn-run-ai-analysis',
            'processed-bom-container',
            'supplier-packages-container'
        ];
        
        const missingElements = requiredElements.filter(id => document.getElementById(id) === null);
        
        if (missingElements.length > 0) {
            console.log('DOM 준비 안됨. 누락된 요소들:', missingElements);
            return false;
        }
        
        console.log('DOM 준비 완료. 모든 필요한 요소 확인됨');
        return true;
    }

    setupAdvancedBOMEvents() {
        // 고급 BOM 분석 UI 이벤트 연결
        this.attachAdvancedBOMEvents();
    }

    attachAdvancedBOMEvents() {
        // 이벤트 연결을 지연하여 DOM이 완전히 준비된 후 실행
        setTimeout(() => {
            // BOM 파일 업로드 버튼
            const uploadBtn = document.getElementById('btn-upload-bom-advanced');
            if (uploadBtn) {
                console.log('업로드 버튼 발견, 이벤트 연결');
                uploadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('업로드 버튼 클릭됨');
                    this.uploadBOMFile();
                });
            } else {
                console.error('업로드 버튼을 찾을 수 없습니다:', 'btn-upload-bom-advanced');
            }

            // AI 분석 실행 버튼
            const aiAnalysisBtn = document.getElementById('btn-run-ai-analysis');
            if (aiAnalysisBtn) {
                aiAnalysisBtn.addEventListener('click', () => this.runAIAnalysis());
            }

            // 서플라이어 패키지 내보내기 버튼 (확인 팝업으로 변경)
            // 이전 POR 버튼 제거됨 - CEO 승인 완료 패키지에서 POR 생성

            // 승인 단계 버튼들
            this.setupApprovalButtons();

            // 원본 엑셀 토글 버튼
            const excelToggleBtn = document.getElementById('btn-toggle-original-excel');
            if (excelToggleBtn) {
                excelToggleBtn.addEventListener('click', () => this.toggleOriginalExcel());
            }

            // 파일 입력 이벤트
            const fileInput = document.getElementById('bom-file-input-advanced');
            if (fileInput) {
                console.log('파일 입력 요소 발견, 이벤트 연결');
                fileInput.addEventListener('change', (e) => this.handleBOMFileUpload(e));
            } else {
                console.error('파일 입력 요소를 찾을 수 없습니다:', 'bom-file-input-advanced');
            }



            console.log('고급 BOM 매니저 이벤트 연결 완료');
        }, 1000);
    }
    
    buildBOMTree(bomData) {
        // BOM 데이터를 트리 구조로 변환
        const tree = [];
        const itemMap = {};
        
        // 먼저 모든 아이템을 맵에 저장
        bomData.forEach(item => {
            itemMap[item.id] = {
                ...item,
                children: [],
                isExpanded: false // 초기에는 모든 노드가 접혀있음
            };
        });
        
        // 부모-자식 관계 설정
        bomData.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                // 루트 노드 (parentId가 없는 노드)
                tree.push(itemMap[item.id]);
            }
        });
        
        return tree;
    }
    
    toggleOriginalExcel() {
        const dropdown = document.getElementById('original-excel-dropdown');
        const icon = document.getElementById('excel-toggle-icon');
        
        if (dropdown && icon) {
            if (dropdown.classList.contains('hidden')) {
                // 펼치기
                dropdown.classList.remove('hidden');
                dropdown.classList.add('slide-down');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                // 접기
                dropdown.classList.add('slide-up');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                    dropdown.classList.remove('slide-down', 'slide-up');
                }, 300);
            }
        }
    }
    
    uploadBOMFile() {
        const fileInput = document.getElementById('bom-file-input-advanced');
        if (fileInput) {
            console.log('파일 입력 요소 발견, 클릭 실행');
            fileInput.click();
        } else {
            console.error('파일 입력 요소를 찾을 수 없습니다:', 'bom-file-input-advanced');
            // 파일 입력 요소가 없다면 동적으로 생성
            this.createFileInput();
        }
    }
    
    createFileInput() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'bom-file-input-advanced-backup';
        fileInput.accept = '.csv,.xlsx,.xls';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleBOMFileUpload(e));
        document.body.appendChild(fileInput);
        fileInput.click();
        
        // 사용 후 제거
        setTimeout(() => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }, 1000);
    }
    
    handleBOMFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.app.showLoading(true);
        
        // 파일 처리 시뮬레이션
        setTimeout(() => {
            this.loadSampleBOMData();
            this.displayOriginalBOM();
            this.enableAIAnalysis();
            this.app.showToast(`BOM 파일 업로드 완료: ${file.name}`, 'success');
            this.app.showLoading(false);
        }, 2000);
    }
    
    loadSampleBOMData() {
        // 계층적 구조를 가진 실제 풍력타워 BOM 데이터 생성
        this.originalBOM = [
            // Level 1 - 주요 조립품
            { id: 'BOM001', level: 1, parentId: '', drawingNumber: 'DWG-WT-001', partName: '풍력타워 조립품', partNumber: 'WT-ASSY-001', material: '조립품', quantity: 1, weight: 0, supplier: 'TBD', itemType: 'Assembly' },
            
            // Level 2 - 타워 섹션들 (Level 1의 하위)
            { id: 'BOM002', level: 2, parentId: 'BOM001', drawingNumber: 'DWG-TS-001', partName: '타워 상단 섹션', partNumber: 'TS-001', material: '구조용강', quantity: 1, weight: 2500.0, supplier: 'TBD', itemType: 'Fabrication' },
            { id: 'BOM003', level: 2, parentId: 'BOM001', drawingNumber: 'DWG-TM-001', partName: '타워 중단 섹션', partNumber: 'TM-001', material: '구조용강', quantity: 1, weight: 3200.0, supplier: 'TBD', itemType: 'Fabrication' },
            { id: 'BOM004', level: 2, parentId: 'BOM001', drawingNumber: 'DWG-TB-001', partName: '타워 하단 섹션', partNumber: 'TB-001', material: '구조용강', quantity: 1, weight: 3800.0, supplier: 'TBD', itemType: 'Fabrication' },
            { id: 'BOM005', level: 2, parentId: 'BOM001', drawingNumber: 'DWG-FL-001', partName: '플랜지 조립품', partNumber: 'FL-ASSY-001', material: '조립품', quantity: 2, weight: 0, supplier: 'TBD', itemType: 'Assembly' },
            
            // Level 3 - 타워 상단 섹션 하위 부품들 (Level 2의 하위)
            { id: 'BOM006', level: 3, parentId: 'BOM002', drawingNumber: 'DWG-TS-SHELL', partName: '상단 쉘 플레이트', partNumber: 'TS-SHELL-001', material: 'S355', quantity: 8, weight: 280.5, supplier: 'TBD', itemType: 'Plate' },
            { id: 'BOM007', level: 3, parentId: 'BOM002', drawingNumber: 'DWG-TS-RING', partName: '상단 보강링', partNumber: 'TS-RING-001', material: 'S355', quantity: 2, weight: 150.0, supplier: 'TBD', itemType: 'Ring' },
            
            // Level 3 - 타워 중단 섹션 하위 부품들
            { id: 'BOM008', level: 3, parentId: 'BOM003', drawingNumber: 'DWG-TM-SHELL', partName: '중단 쉘 플레이트', partNumber: 'TM-SHELL-001', material: 'S355', quantity: 12, weight: 245.0, supplier: 'TBD', itemType: 'Plate' },
            { id: 'BOM009', level: 3, parentId: 'BOM003', drawingNumber: 'DWG-TM-DOOR', partName: '점검문 조립품', partNumber: 'TM-DOOR-001', material: '조립품', quantity: 1, weight: 0, supplier: 'TBD', itemType: 'Assembly' },
            
            // Level 3 - 하단 섹션 하위 부품들
            { id: 'BOM010', level: 3, parentId: 'BOM004', drawingNumber: 'DWG-TB-SHELL', partName: '하단 쉘 플레이트', partNumber: 'TB-SHELL-001', material: 'S355', quantity: 16, weight: 220.0, supplier: 'TBD', itemType: 'Plate' },
            { id: 'BOM011', level: 3, parentId: 'BOM004', drawingNumber: 'DWG-TB-BASE', partName: '베이스 플레이트', partNumber: 'TB-BASE-001', material: 'S690', quantity: 1, weight: 1200.0, supplier: 'TBD', itemType: 'Plate' },
            
            // Level 3 - 플랜지 조립품 하위 부품들
            { id: 'BOM012', level: 3, parentId: 'BOM005', drawingNumber: 'DWG-FL-TOP', partName: '상부 플랜지', partNumber: 'FL-TOP-001', material: '탄소강', quantity: 1, weight: 150.5, supplier: 'TBD', itemType: 'Flange' },
            { id: 'BOM013', level: 3, parentId: 'BOM005', drawingNumber: 'DWG-FL-BOT', partName: '하부 플랜지', partNumber: 'FL-BOT-001', material: '탄소강', quantity: 1, weight: 145.2, supplier: 'TBD', itemType: 'Flange' },
            
            // Level 4 - 점검문 조립품 하위 부품들 (Level 3의 하위)
            { id: 'BOM014', level: 4, parentId: 'BOM009', drawingNumber: 'DWG-DOOR-FRAME', partName: '점검문 프레임', partNumber: 'DOOR-FRAME-001', material: 'S235', quantity: 1, weight: 45.0, supplier: 'TBD', itemType: 'Frame' },
            { id: 'BOM015', level: 4, parentId: 'BOM009', drawingNumber: 'DWG-DOOR-PANEL', partName: '점검문 패널', partNumber: 'DOOR-PANEL-001', material: 'S235', quantity: 1, weight: 25.0, supplier: 'TBD', itemType: 'Panel' },
            { id: 'BOM016', level: 4, parentId: 'BOM009', drawingNumber: 'DWG-DOOR-HINGE', partName: '점검문 힌지', partNumber: 'DOOR-HINGE-001', material: '스테인리스강', quantity: 3, weight: 2.5, supplier: 'TBD', itemType: 'Hardware' },
            
            // Small Parts (소형 부품들)
            { id: 'BOM017', level: 4, parentId: 'BOM002', drawingNumber: 'DWG-BRACKET-001', partName: '보강 브라켓', partNumber: 'BRACKET-001', material: 'S235', quantity: 24, weight: 1.2, supplier: 'TBD', itemType: 'Bracket' },
            { id: 'BOM018', level: 4, parentId: 'BOM003', drawingNumber: 'DWG-PLATE-SMALL', partName: '소형 보강 플레이트', partNumber: 'PLATE-S-001', material: 'S235', quantity: 16, weight: 2.8, supplier: 'TBD', itemType: 'Plate' },
            { id: 'BOM019', level: 4, parentId: 'BOM004', drawingNumber: 'DWG-BOLT-M20', partName: '고장력 볼트 M20', partNumber: 'BOLT-M20-001', material: '고장력강', quantity: 144, weight: 0.3, supplier: 'TBD', itemType: 'Fastener' },
            { id: 'BOM020', level: 4, parentId: 'BOM005', drawingNumber: 'DWG-NUT-M20', partName: '너트 M20', partNumber: 'NUT-M20-001', material: '고장력강', quantity: 144, weight: 0.15, supplier: 'TBD', itemType: 'Fastener' },
            { id: 'BOM021', level: 4, parentId: 'BOM002', drawingNumber: 'DWG-WASHER-20', partName: '와셔 M20', partNumber: 'WASHER-20-001', material: '스테인리스강', quantity: 288, weight: 0.05, supplier: 'TBD', itemType: 'Fastener' },
            { id: 'BOM022', level: 4, parentId: 'BOM003', drawingNumber: 'DWG-CLIP-001', partName: '고정 클립', partNumber: 'CLIP-001', material: '스프링강', quantity: 48, weight: 0.08, supplier: 'TBD', itemType: 'Clip' },

            // Large Parts (대형 구조물들)  
            { id: 'BOM023', level: 3, parentId: 'BOM004', drawingNumber: 'DWG-PLATFORM-001', partName: '작업 플랫폼 (Φ4.5m)', partNumber: 'PLATFORM-001', material: 'S355', quantity: 1, weight: 850.0, supplier: 'TBD', itemType: 'Platform', dimensions: '4500mm dia' },
            { id: 'BOM024', level: 3, parentId: 'BOM002', drawingNumber: 'DWG-LADDER-001', partName: '사다리 (15m)', partNumber: 'LADDER-001', material: 'S235', quantity: 1, weight: 320.0, supplier: 'TBD', itemType: 'Ladder', dimensions: '15000mm length' },
            { id: 'BOM025', level: 3, parentId: 'BOM003', drawingNumber: 'DWG-FRAME-LARGE', partName: '대형 보강 프레임', partNumber: 'FRAME-L-001', material: 'S355', quantity: 2, weight: 180.0, supplier: 'TBD', itemType: 'Frame', dimensions: '3000x2000mm' },
            { id: 'BOM026', level: 3, parentId: 'BOM004', drawingNumber: 'DWG-STRUCTURE-001', partName: '하부 구조체', partNumber: 'STRUCTURE-001', material: 'S690', quantity: 1, weight: 1200.0, supplier: 'TBD', itemType: 'Structure', dimensions: '2500x2500mm' },

            // 전장품 (전기/전자 부품들)
            { id: 'BOM027', level: 4, parentId: 'BOM002', drawingNumber: 'DWG-CABLE-001', partName: '전원 케이블 25mm²', partNumber: 'CABLE-25-001', material: '구리', quantity: 50, weight: 2.1, supplier: 'TBD', itemType: 'Cable', dimensions: '25mm² x 100m' },
            { id: 'BOM028', level: 4, parentId: 'BOM003', drawingNumber: 'DWG-LIGHT-001', partName: 'LED 항공장애등', partNumber: 'LIGHT-LED-001', material: 'LED', quantity: 4, weight: 3.2, supplier: 'TBD', itemType: 'Light' },
            { id: 'BOM029', level: 4, parentId: 'BOM004', drawingNumber: 'DWG-JUNCTION-001', partName: '접속함 (방수형)', partNumber: 'JUNCTION-001', material: '플라스틱', quantity: 6, weight: 1.8, supplier: 'TBD', itemType: 'Junction Box' },
            { id: 'BOM030', level: 4, parentId: 'BOM009', drawingNumber: 'DWG-WIRE-001', partName: '제어 와이어 2.5mm²', partNumber: 'WIRE-2.5-001', material: '구리', quantity: 100, weight: 0.8, supplier: 'TBD', itemType: 'Wire' },
            { id: 'BOM031', level: 4, parentId: 'BOM005', drawingNumber: 'DWG-CONNECTOR-001', partName: '전기 커넥터', partNumber: 'CONNECTOR-001', material: '플라스틱', quantity: 12, weight: 0.15, supplier: 'TBD', itemType: 'Connector' },
            { id: 'BOM032', level: 4, parentId: 'BOM002', drawingNumber: 'DWG-SWITCH-001', partName: '비상 스위치', partNumber: 'SWITCH-001', material: '플라스틱', quantity: 2, weight: 0.25, supplier: 'TBD', itemType: 'Switch' },

            // 기타 자재
            { id: 'BOM033', level: 4, parentId: 'BOM001', drawingNumber: 'DWG-PAINT-001', partName: '방식 도료 시스템', partNumber: 'PAINT-SYS-001', material: '에폭시', quantity: 500, weight: 0.5, supplier: 'TBD', itemType: 'Paint' },
            { id: 'BOM034', level: 4, parentId: 'BOM011', drawingNumber: 'DWG-SEAL-001', partName: '방수 씰', partNumber: 'SEAL-001', material: '고무', quantity: 24, weight: 0.12, supplier: 'TBD', itemType: 'Seal' },
            { id: 'BOM035', level: 4, parentId: 'BOM012', drawingNumber: 'DWG-GASKET-001', partName: '플랜지 가스켓', partNumber: 'GASKET-001', material: '고무', quantity: 8, weight: 0.35, supplier: 'TBD', itemType: 'Gasket' }
        ];
        
        // 도면 링크 생성 (1:1 매칭)
        this.originalBOM.forEach(item => {
            this.drawingLinks.set(item.drawingNumber, `/drawings/${item.drawingNumber}.pdf`);
        });
        
        // 트리 구조 전처리
        this.processedBOMTree = this.buildBOMTree(this.originalBOM);
    }
    
    displayOriginalBOM() {
        // 원본 엑셀 테이블 표시
        this.displayOriginalExcelTable();
        
        // 전처리된 BOM 트리 표시
        this.displayProcessedBOMTree();
        
        this.updateBOMStats();
    }
    
    displayOriginalExcelTable() {
        const container = document.getElementById('original-excel-table-container');
        if (!container) return;
        
        const emptyDiv = document.getElementById('original-excel-empty');
        if (emptyDiv) emptyDiv.style.display = 'none';
        
        // 행 개수 표시
        const rowCountEl = document.getElementById('original-row-count');
        if (rowCountEl) {
            rowCountEl.textContent = `총 ${this.originalBOM.length}개 행`;
        }
        
        // 원본 엑셀 데이터를 테이블 형태로 표시
        const tableHeaders = ['레벨', 'BOM ID', '부품번호', '부품명', '도면번호', '재질', '수량', '중량', '타입'];
        
        container.innerHTML = `
            <table class="excel-table">
                <thead>
                    <tr>
                        ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.originalBOM.map(item => `
                        <tr>
                            <td>Level ${item.level}</td>
                            <td>${item.id}</td>
                            <td>${item.partNumber}</td>
                            <td>${item.partName}</td>
                            <td class="text-blue-600 font-medium">${item.drawingNumber}</td>
                            <td>${item.material}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${item.weight}</td>
                            <td><span class="text-xs bg-gray-100 px-2 py-1 rounded">${item.itemType}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    displayProcessedBOMTree() {
        const container = document.getElementById('processed-bom-container');
        if (!container) return;
        
        const emptyDiv = document.getElementById('processed-bom-empty');
        if (emptyDiv) emptyDiv.style.display = 'none';
        
        container.innerHTML = `
            <div class="bom-tree-container">
                ${this.renderBOMTreeLevel(this.processedBOMTree, 1)}
            </div>
        `;
        
        // 트리 항목 이벤트 연결
        this.attachTreeEvents();
    }
    
    renderBOMTreeLevel(items, level) {
        return items.map(item => `
            <div class="bom-tree-item bom-tree-level-${level} ${item.children.length > 0 ? 'has-children' : ''} ${item.isExpanded ? 'expanded' : 'collapsed'}"
                 data-bom-id="${item.id}" data-level="${level}">
                <div class="flex items-center justify-between p-3 rounded-lg border mb-2" 
                     ondblclick="toggleBOMTreeItem('${item.id}')">
                    <div class="flex items-center space-x-3 flex-1">
                        ${item.children.length > 0 ? `
                            <i class="fas fa-chevron-right bom-tree-toggle ${item.isExpanded ? 'expanded' : ''} text-gray-400 cursor-pointer"
                               onclick="toggleBOMTreeItem('${item.id}')"></i>
                        ` : `
                            <div class="w-3"></div>
                        `}
                        
                        <div class="flex items-center space-x-2">
                            ${this.getItemTypeIcon(item.itemType)}
                            <span class="font-semibold text-gray-800">${item.partName}</span>
                            <span class="text-xs bg-blue-100 px-2 py-1 rounded">Level ${item.level}</span>
                            ${item.children.length > 0 ? `<span class="text-xs bg-green-100 px-2 py-1 rounded">${item.children.length}개 하위</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-3 text-sm">
                        <div class="text-right">
                            <div class="text-xs text-gray-500">부품번호</div>
                            <div class="font-medium">${item.partNumber}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-gray-500">도면번호</div>
                            <div class="drawing-link font-medium" onclick="openPDFModal('${item.drawingNumber}', '${this.drawingLinks.get(item.drawingNumber) || ''}')">${item.drawingNumber}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-gray-500">수량 x 중량</div>
                            <div class="font-medium">${item.quantity} EA x ${item.weight}kg</div>
                        </div>
                        <i class="fas fa-grip-vertical text-gray-400" draggable="true"></i>
                    </div>
                </div>
                
                <!-- 하위 아이템들 (초기에는 숨김) -->
                <div class="bom-children ml-6 ${item.isExpanded ? '' : 'hidden'}">
                    ${item.children.length > 0 ? this.renderBOMTreeLevel(item.children, level + 1) : ''}
                </div>
            </div>
        `).join('');
    }
    
    getItemTypeIcon(itemType) {
        const iconMap = {
            'Assembly': '<i class="fas fa-cubes text-blue-600"></i>',
            'Fabrication': '<i class="fas fa-hammer text-green-600"></i>',
            'Plate': '<i class="fas fa-square text-gray-600"></i>',
            'Ring': '<i class="fas fa-circle-notch text-purple-600"></i>',
            'Flange': '<i class="fas fa-record-vinyl text-orange-600"></i>',
            'Frame': '<i class="fas fa-border-style text-brown-600"></i>',
            'Panel': '<i class="fas fa-rectangle-ad text-indigo-600"></i>',
            'Hardware': '<i class="fas fa-cog text-yellow-600"></i>',
            'Paint': '<i class="fas fa-paint-brush text-red-600"></i>',
            'Fastener': '<i class="fas fa-bolt text-gray-800"></i>'
        };
        
        return iconMap[itemType] || '<i class="fas fa-cube text-gray-400"></i>';
    }
    
    toggleTreeItem(itemId) {
        // BOM 트리에서 특정 항목의 펼침/접힘 상태 토글
        const item = this.findTreeItem(this.processedBOMTree, itemId);
        if (item && item.children.length > 0) {
            item.isExpanded = !item.isExpanded;
            this.displayProcessedBOMTree(); // 트리 다시 렌더링
        }
    }
    
    findTreeItem(tree, itemId) {
        for (let item of tree) {
            if (item.id === itemId) {
                return item;
            }
            if (item.children.length > 0) {
                const found = this.findTreeItem(item.children, itemId);
                if (found) return found;
            }
        }
        return null;
    }
    
    attachTreeEvents() {
        // 트리 항목에 드래그 이벤트 연결
        const treeItems = document.querySelectorAll('.bom-tree-item');
        treeItems.forEach(item => {
            const gripIcon = item.querySelector('.fa-grip-vertical');
            if (gripIcon) {
                gripIcon.addEventListener('dragstart', this.handleDragStart.bind(this));
                gripIcon.addEventListener('dragend', this.handleDragEnd.bind(this));
            }
        });
    }
    
    enableAIAnalysis() {
        const aiBtn = document.getElementById('btn-run-ai-analysis');
        if (aiBtn) {
            aiBtn.disabled = false;
            aiBtn.classList.remove('disabled:bg-gray-400');
        }
    }
    
    updateBOMStats() {
        const totalItemsEl = document.getElementById('total-items-count');
        if (totalItemsEl) {
            totalItemsEl.textContent = this.originalBOM.length;
        }
    }
    
    async runAIAnalysis() {
        if (this.originalBOM.length === 0) {
            // 샘플 BOM 데이터 자동 생성
            this.app.showToast('샘플 BOM 데이터를 생성합니다...', 'info');
            this.createSampleBOMData();
        }

        this.app.showLoading(true);
        
        // AI 분석 진행 상태 표시
        this.updateAnalysisProgress('AI 분석 실행 중...', 25);
        
        try {
            // AI 분석 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.aiClassificationResults = await this.performAIAnalysis();
            this.updateAnalysisProgress('분류 결과 생성 중...', 75);
            
            await this.displaySupplierPackages();
            this.updateAnalysisProgress('분석 완료', 100);
            
            this.showAISummary();
            this.app.showToast(`AI 분석 완료: ${this.aiClassificationResults.length}개 아이템 분석`, 'success');
            
        } catch (error) {
            console.error('AI 분석 실패:', error);
            this.app.showToast('AI 분석 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }
    
    updateAnalysisProgress(status, progress) {
        const statusEl = document.getElementById('analysis-status-text');
        const progressEl = document.getElementById('analysis-progress');
        
        if (statusEl) statusEl.textContent = status;
        if (progressEl) progressEl.style.width = `${progress}%`;
    }
    
    async performAIAnalysis() {
        // AI 분석 결과 시뮬레이션
        return this.originalBOM.map(item => {
            const analysis = {
                ...item,
                aiClassification: this.simulateAIClassification(item),
                confidence: Math.random() * 0.4 + 0.6, // 60-100% 신뢰도
                materialCategory: this.suggestMaterialCategory(item)
            };
            
            // 특별 분류 감지
            analysis.isModuleAssembly = this.detectModuleAssembly(item);
            analysis.isLongLeadTime = this.detectLongLeadTime(item);
            analysis.specialCategory = this.getSpecialCategory(analysis);
            
            return analysis;
        });
    }
    
    detectModuleAssembly(item) {
        // 모듈 단위 조립품 감지 로직
        // Level 2 아이템이면서 하위에 여러 부품을 포함하는 조립품
        if (item.level === 2 && item.itemType === 'Assembly') {
            return true;
        }
        
        // 특정 부품명 패턴으로도 감지
        const modulePatterns = [
            '조립품', '어셈블리', 'ASSY', 'Assembly',
            '플랜지 조립품', '점검문 조립품', '전기 시스템'
        ];
        
        return modulePatterns.some(pattern => 
            item.partName.includes(pattern) || 
            item.partNumber.includes(pattern)
        );
    }
    
    detectLongLeadTime(item) {
        // Long Lead Time 아이템 감지 로직
        const lltMaterials = [
            'S355', 'S690', 'S420', // 구조용 강재
            '탄소강', '구조용강', '고장력강',
            'Steel', 'Plate'
        ];
        
        const lltTypes = [
            'Plate', 'Flange', 'Ring', 
            'Shell', '쉘', '플레이트', 
            '플랜지', '보강링'
        ];
        
        const lltPatterns = [
            '플레이트', '쉘', '플랜지', '링', '보강링',
            'Shell', 'Plate', 'Flange', 'Ring'
        ];
        
        // 재질 기반 검사
        const hasMaterial = lltMaterials.some(material => 
            item.material.includes(material)
        );
        
        // 아이템 타입 기반 검사
        const hasType = lltTypes.includes(item.itemType);
        
        // 부품명 패턴 기반 검사
        const hasPattern = lltPatterns.some(pattern =>
            item.partName.includes(pattern) || 
            item.partNumber.includes(pattern)
        );
        
        // 중량 기반 검사 (큰 부품들은 보통 LLT)
        const isHeavyItem = item.weight > 100;
        
        return hasMaterial || hasType || hasPattern || isHeavyItem;
    }
    
    getSpecialCategory(analysis) {
        if (analysis.isModuleAssembly) return 'module';
        if (analysis.isLongLeadTime) return 'llt';
        return 'supplier';
    }
    
    simulateAIClassification(item) {
        if (item.material.includes('탄소강') || item.material.includes('구조용강')) {
            return '강재 가공품';
        } else if (item.material.includes('스테인리스')) {
            return '특수강 제품';
        } else if (item.material.includes('에폭시') || item.partName.includes('도료')) {
            return '도장 재료';
        } else {
            return '기타 부품';
        }
    }
    
    suggestMaterialCategory(item) {
        // 임시로 자재 특성별 분류를 AI가 제안하는 것으로 시뮬레이션
        const partName = (item.partName || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        
        // 간단한 키워드 기반 분류
        if (partName.includes('cable') || partName.includes('light') || partName.includes('케이블') || partName.includes('조명')) {
            return '전장품';
        } else if (partName.includes('platform') || partName.includes('ladder') || partName.includes('플랫폼') || partName.includes('사다리')) {
            return 'Large Parts';
        } else if (partName.includes('bracket') || partName.includes('plate') || partName.includes('bolt') || partName.includes('브라켓') || partName.includes('플레이트')) {
            return 'Small Parts';
        } else {
            return '기타';
        }
    }
    
    async displaySupplierPackages() {
        // 특별 분류별로 그룹화
        this.classifyItemsByCategory();
        
        // 각 카테고리별 표시
        this.displayModulePackages();
        this.displayLLTPackages();
        this.displayMaterialCategoryPackages();
        
        // 드래그앤드롭 설정
        this.setupDragAndDrop();
        
        // 승인 요청 버튼 상태 업데이트
        this.updateApprovalButtonState();
        
        // 이제 자동 승인 시스템 사용
    }
    
    classifyItemsByCategory() {
        // 초기화
        this.modulePackages = {};
        this.lltPackages = {};
        this.materialCategoryPackages = {};
        
        this.aiClassificationResults.forEach(item => {
            if (item.specialCategory === 'module') {
                // 모듈 패키지 분류
                const moduleKey = this.getModuleKey(item);
                if (!this.modulePackages[moduleKey]) {
                    this.modulePackages[moduleKey] = [];
                }
                this.modulePackages[moduleKey].push(item);
                
            } else if (item.specialCategory === 'llt') {
                // LLT 패키지 분류
                const lltKey = this.getLLTKey(item);
                if (!this.lltPackages[lltKey]) {
                    this.lltPackages[lltKey] = [];
                }
                this.lltPackages[lltKey].push(item);
                
            } else {
                // 자재 특성별 분류 (Small/Large/전장품/기타)
                const materialCategory = this.getMaterialCategory(item);
                if (!this.materialCategoryPackages[materialCategory]) {
                    this.materialCategoryPackages[materialCategory] = [];
                }
                this.materialCategoryPackages[materialCategory].push(item);
            }
        });
    }
    
    updateApprovalButtonState() {
        const approvalRequestBtn = document.getElementById('btn-submit-approval-request');
        
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        // 승인 요청 버튼 상태 업데이트
        if (approvalRequestBtn && !this.approvalProgress?.isInProgress) {
            if (totalPackages > 0) {
                approvalRequestBtn.disabled = false;
                approvalRequestBtn.classList.remove('disabled:bg-gray-400');
                approvalRequestBtn.classList.add('hover:bg-blue-700');
                console.log('승인 요청 버튼 활성화됨 - AI 분석 완료');
            } else {
                approvalRequestBtn.disabled = true;
                approvalRequestBtn.classList.add('disabled:bg-gray-400');
                approvalRequestBtn.classList.remove('hover:bg-blue-700');
                console.log('승인 요청 버튼 비활성화됨 - AI 분석 필요');
            }
        }
    }
    
    getModuleKey(item) {
        // 모듈 키 생성 - 부모 ID 기반 또는 조립품 타입 기반
        if (item.parentId && item.level >= 3) {
            // 하위 부품들은 부모로 그룹화
            const parentItem = this.findItemById(item.parentId);
            return parentItem ? `${parentItem.partName} (${parentItem.partNumber})` : `모듈-${item.parentId}`;
        } else {
            // Level 2 조립품들
            return `${item.partName} (${item.partNumber})`;
        }
    }
    
    getLLTKey(item) {
        const partName = (item.partName || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        const material = (item.material || '').toLowerCase();
        
        // 고강도 강재 (S690 등)
        if (material.includes('s690') || material.includes('고강도') || material.includes('high strength')) {
            return '고강도 강재';
        }
        
        // 플랜지류
        if (item.itemType === 'Flange' || partName.includes('플랜지') || partName.includes('flange') || partNumber.includes('flg')) {
            return '플랜지류';
        }
        
        // 일반 구조용강재 및 기타 LLT 항목은 통합하여 'LLT'로 분류
        return 'LLT';
    }

    // 자재 특성별 분류 (Small/Large/전장품/기타)
    getMaterialCategory(item) {
        const partName = (item.partName || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        const material = (item.material || '').toLowerCase();
        const weight = parseFloat(item.weight || 0);
        const dimensions = item.dimensions || '';

        // 전장품 분류
        if (this.isElectricalItem(partName, partNumber)) {
            return '전장품';
        }
        
        // Large Parts 분류 (대형 구조물)
        if (this.isLargePart(partName, partNumber, dimensions, weight)) {
            return 'Large Parts';
        }
        
        // Small Parts 분류 (소형 부품)
        if (this.isSmallPart(partName, partNumber, weight)) {
            return 'Small Parts';
        }
        
        // 기타
        return '기타';
    }

    // 전장품 판별
    isElectricalItem(partName, partNumber) {
        const electricalKeywords = [
            'cable', 'wire', 'light', 'lighting', 'led', 'lamp',
            'junction', 'box', 'connector', 'terminal', 'switch',
            'sensor', 'controller', 'electrical', 'electric',
            '케이블', '전선', '조명', '등', '접속함', '스위치', '센서'
        ];
        
        return electricalKeywords.some(keyword => 
            partName.includes(keyword) || partNumber.includes(keyword)
        );
    }

    // Large Parts 판별 (대형 구조물)
    isLargePart(partName, partNumber, dimensions, weight) {
        const largeKeywords = [
            'platform', 'ladder', 'frame', 'structure', 'assembly',
            'section', 'shell', 'tower', 'nacelle', 'hub',
            '플랫폼', '사다리', '프레임', '구조', '조립체', '섹션', '쉘'
        ];
        
        // 키워드 기반 판별
        const hasLargeKeyword = largeKeywords.some(keyword => 
            partName.includes(keyword) || partNumber.includes(keyword)
        );
        
        // 크기/무게 기반 판별 (무게 50kg 이상 또는 직경 1000mm 이상)
        const isHeavy = weight > 50;
        const isLargeDimension = dimensions && (
            dimensions.includes('4500') || dimensions.includes('15000') ||
            parseInt(dimensions.match(/\d+/)?.[0] || 0) > 1000
        );
        
        return hasLargeKeyword || isHeavy || isLargeDimension;
    }

    // Small Parts 판별 (소형 부품)
    isSmallPart(partName, partNumber, weight) {
        const smallKeywords = [
            'plate', 'bracket', 'bolt', 'nut', 'washer', 'screw',
            'clip', 'pin', 'ring', 'seal', 'gasket', 'bearing',
            '플레이트', '브라켓', '볼트', '너트', '와셔', '나사',
            '클립', '핀', '링', '씰', '가스켓', '베어링'
        ];
        
        // 키워드 기반 판별
        const hasSmallKeyword = smallKeywords.some(keyword => 
            partName.includes(keyword) || partNumber.includes(keyword)
        );
        
        // 무게 기반 판별 (10kg 미만)
        const isLight = weight < 10 && weight > 0;
        
        return hasSmallKeyword || isLight;
    }
    
    // 분류 통계 정보 생성
    getClassificationStats() {
        const stats = {
            module: 0,
            llt: 0,
            고강도강재: 0,
            플랜지류: 0,
            smallParts: 0,
            largeParts: 0,
            electrical: 0,
            other: 0,
            total: this.aiClassificationResults.length
        };
        
        this.aiClassificationResults.forEach(item => {
            if (item.specialCategory === 'module') {
                stats.module++;
            } else if (item.specialCategory === 'llt') {
                const lltKey = this.getLLTKey(item);
                if (lltKey === '고강도 강재') {
                    stats.고강도강재++;
                } else if (lltKey === '플랜지류') {
                    stats.플랜지류++;
                } else {
                    stats.llt++;
                }
            } else {
                const materialCategory = this.getMaterialCategory(item);
                if (materialCategory === 'Small Parts') stats.smallParts++;
                else if (materialCategory === 'Large Parts') stats.largeParts++;
                else if (materialCategory === '전장품') stats.electrical++;
                else stats.other++;
            }
        });
        
        return stats;
    }
    
    findItemById(id) {
        return this.originalBOM.find(item => item.id === id);
    }
    
    displayModulePackages() {
        const container = document.getElementById('module-packages-container');
        const emptyDiv = document.getElementById('module-packages-empty');
        const countBadge = document.getElementById('module-count-badge');
        
        if (!container) return;
        
        const moduleCount = Object.keys(this.modulePackages).length;
        if (countBadge) countBadge.textContent = `${moduleCount}개`;
        
        if (moduleCount === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }
        
        if (emptyDiv) emptyDiv.style.display = 'none';
        
        container.innerHTML = Object.entries(this.modulePackages).map(([moduleKey, items]) => `
            <div class="module-package has-items bg-purple-50 border border-purple-200 rounded-lg mb-4" 
                 data-module="${moduleKey}" data-package-type="module">
                <div class="bg-purple-100 px-4 py-3 rounded-t-lg border-b border-purple-200">
                    <div class="flex justify-between items-center">
                        <h5 class="font-semibold text-purple-800 flex items-center">
                            <i class="fas fa-puzzle-piece text-purple-600 mr-2"></i>
                            ${moduleKey}
                        </h5>
                        <span class="text-xs bg-purple-200 px-2 py-1 rounded">${items.length}개 부품</span>
                    </div>
                </div>
                ${this.renderPackageItems(items, 'module', moduleKey)}
            </div>
        `).join('');
    }
    
    displayLLTPackages() {
        const container = document.getElementById('llt-packages-container');
        const emptyDiv = document.getElementById('llt-packages-empty');
        const countBadge = document.getElementById('llt-count-badge');
        
        if (!container) return;
        
        const lltCount = Object.keys(this.lltPackages).length;
        if (countBadge) countBadge.textContent = `${lltCount}개`;
        
        if (lltCount === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }
        
        if (emptyDiv) emptyDiv.style.display = 'none';
        
        container.innerHTML = Object.entries(this.lltPackages).map(([lltKey, items]) => `
            <div class="llt-package has-items bg-orange-50 border border-orange-200 rounded-lg mb-4" 
                 data-llt="${lltKey}" data-package-type="llt">
                <div class="bg-orange-100 px-4 py-3 rounded-t-lg border-b border-orange-200">
                    <div class="flex justify-between items-center">
                        <h5 class="font-semibold text-orange-800 flex items-center">
                            <i class="fas fa-clock text-orange-600 mr-2"></i>
                            ${lltKey}
                        </h5>
                        <span class="text-xs bg-orange-200 px-2 py-1 rounded">${items.length}개 아이템</span>
                    </div>
                </div>
                ${this.renderPackageItems(items, 'llt', lltKey)}
            </div>
        `).join('');
    }
    
    displayMaterialCategoryPackages() {
        const container = document.getElementById('supplier-packages-container');
        const emptyDiv = document.getElementById('supplier-packages-empty');
        const countBadge = document.getElementById('supplier-count-badge');
        
        if (!container) return;
        
        const categoryCount = Object.keys(this.materialCategoryPackages).length;
        if (countBadge) countBadge.textContent = `${categoryCount}개`;
        
        if (categoryCount === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }
        
        if (emptyDiv) emptyDiv.style.display = 'none';
        
        // 자재 특성별 표시 순서 및 색상 정의
        const categoryOrder = ['Small Parts', 'Large Parts', '전장품', '기타'];
        const categoryColors = {
            'Small Parts': { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-800', icon: 'fas fa-puzzle-piece', color: 'green' },
            'Large Parts': { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100', text: 'text-red-800', icon: 'fas fa-cubes', color: 'red' },
            '전장품': { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-100', text: 'text-yellow-800', icon: 'fas fa-bolt', color: 'yellow' },
            '기타': { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100', text: 'text-gray-800', icon: 'fas fa-ellipsis-h', color: 'gray' }
        };
        
        const sortedCategories = categoryOrder.filter(cat => this.materialCategoryPackages[cat]);
        
        container.innerHTML = sortedCategories.map(category => {
            const items = this.materialCategoryPackages[category];
            const colors = categoryColors[category];
            
            return `
                <div class="material-category-package has-items ${colors.bg} ${colors.border} border rounded-lg mb-4" 
                     data-category="${category}" data-package-type="material">
                    <div class="${colors.header} px-4 py-3 rounded-t-lg border-b ${colors.border}">
                        <div class="flex justify-between items-center">
                            <h5 class="font-semibold ${colors.text} flex items-center">
                                <i class="${colors.icon} ${colors.text.replace('text-', 'text-').replace('800', '600')} mr-2"></i>
                                ${category}
                                <span class="ml-2 text-xs ${colors.text.replace('800', '600')}">${this.getCategoryDescription(category)}</span>
                            </h5>
                            <span class="text-xs ${colors.header} px-2 py-1 rounded">${items.length}개 항목</span>
                        </div>
                    </div>
                    ${this.renderPackageItems(items, 'material', category)}
                </div>
            `;
        }).join('');
    }

    // 카테고리 설명 텍스트
    getCategoryDescription(category) {
        const descriptions = {
            'Small Parts': '(소형부품: 플레이트, 브라켓 등)',
            'Large Parts': '(대형구조물: 플랫폼, 사다리 등)', 
            '전장품': '(전기설비: 케이블, 조명, 접속함 등)',
            '기타': '(기타 자재)'
        };
        return descriptions[category] || '';
    }
    
    renderPackageItems(items, packageType, packageKey) {
        return `
            <div class="p-4 space-y-2 custom-scrollbar">
                ${items.map(item => `
                    <div class="${packageType}-package-item bg-white p-3 rounded border hover:bg-gray-50 transition-colors cursor-move" 
                         data-bom-id="${item.id}" 
                         data-current-package="${packageKey}"
                         data-package-type="${packageType}"
                         draggable="true">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="font-medium text-sm">${item.partName}</div>
                                <div class="text-xs text-gray-600 mt-1">
                                    <span class="drawing-link" onclick="openPDFModal('${item.drawingNumber}', '${this.drawingLinks.get(item.drawingNumber) || ''}')">${item.drawingNumber}</span>
                                    | ${item.aiClassification}
                                    ${item.specialCategory !== 'supplier' ? `| <span class="text-${packageType === 'module' ? 'purple' : 'orange'}-600 font-medium">${packageType.toUpperCase()}</span>` : ''}
                                </div>
                                <div class="text-xs text-gray-500">
                                    Level ${item.level} | ${item.material} | ${item.quantity} EA | ${item.weight} kg
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="confidence-badge ${this.getConfidenceBadgeClass(item.confidence)}">
                                    ${Math.round(item.confidence * 100)}%
                                </span>
                                <i class="fas fa-grip-vertical text-gray-400 drag-handle" title="드래그하여 다른 패키지로 이동"></i>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getConfidenceBadgeClass(confidence) {
        if (confidence >= 0.8) return 'confidence-high';
        if (confidence >= 0.6) return 'confidence-medium';
        return 'confidence-low';
    }
    
    showAISummary() {
        const summaryEl = document.getElementById('ai-analysis-summary');
        if (summaryEl) {
            summaryEl.classList.remove('hidden');
            
            // 통계 계산
            const moduleItemCount = this.aiClassificationResults.filter(item => item.specialCategory === 'module').length;
            const lltItemCount = this.aiClassificationResults.filter(item => item.specialCategory === 'llt').length;
            const supplierItemCount = this.aiClassificationResults.filter(item => item.specialCategory === 'supplier').length;
            const lowConfidenceCount = this.aiClassificationResults.filter(item => item.confidence < 0.7).length;
            
            // 통계 업데이트
            const totalItems = document.getElementById('total-items-count');
            const classifiedItems = document.getElementById('classified-items-count');
            const manualReview = document.getElementById('manual-review-count');
            const materialPackagesCount = document.getElementById('material-packages-count');
            
            if (totalItems) totalItems.textContent = this.originalBOM.length;
            if (classifiedItems) classifiedItems.textContent = this.aiClassificationResults.length - lowConfidenceCount;
            if (manualReview) manualReview.textContent = lowConfidenceCount;
            if (materialPackagesCount) {
                const totalPackages = Object.keys(this.modulePackages).length + 
                                    Object.keys(this.lltPackages).length + 
                                    Object.keys(this.materialCategoryPackages).length;
                materialPackagesCount.textContent = totalPackages;
            }
            
            // 상세 분류 정보 표시 (콘솔)
            console.log('=== AI 분류 결과 요약 ===');
            console.log(`총 아이템: ${this.originalBOM.length}개`);
            console.log(`모듈 단위 조립품: ${moduleItemCount}개 (${Object.keys(this.modulePackages).length}개 패키지)`);
            console.log(`Long Lead Time: ${lltItemCount}개 (${Object.keys(this.lltPackages).length}개 패키지)`);
            console.log(`일반 서플라이어: ${supplierItemCount}개 (${Object.keys(this.materialCategoryPackages).length}개 패키지)`);
            console.log(`수동 검토 필요: ${lowConfidenceCount}개`);
        }
    }
    
    requestPackageApproval() {
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        if (totalPackages === 0) {
            this.app.showToast('결재 요청할 패키지가 없습니다.', 'warning');
            return;
        }

        this.openApprovalModal();
    }
    
    openApprovalModal() {
        const modal = document.getElementById('approval-modal');
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        const totalItems = this.aiClassificationResults.length;
        
        // 패키지 정보 업데이트
        document.getElementById('approval-package-count').textContent = totalPackages;
        document.getElementById('approval-total-items').textContent = totalItems;
        document.getElementById('approval-created-date').textContent = new Date().toLocaleString('ko-KR');
        
        // 패키지 목록 표시
        this.displayApprovalPackagesList();
        
        // 결재 요청 버튼 이벤트
        const submitBtn = document.getElementById('btn-submit-approval');
        submitBtn.onclick = () => this.submitApprovalRequest();
        
        modal.classList.add('show');
    }
    
    displayApprovalPackagesList() {
        const container = document.getElementById('approval-packages-list');
        const packages = [];
        
        // 모든 패키지 수집
        Object.entries(this.modulePackages).forEach(([key, items]) => {
            packages.push({
                type: 'module',
                name: key,
                items: items,
                color: 'purple',
                icon: 'puzzle-piece'
            });
        });
        
        Object.entries(this.lltPackages).forEach(([key, items]) => {
            packages.push({
                type: 'llt',
                name: key,
                items: items,
                color: 'orange',
                icon: 'clock'
            });
        });
        
        Object.entries(this.supplierPackages).forEach(([key, items]) => {
            packages.push({
                type: 'supplier',
                name: key,
                items: items,
                color: 'blue',
                icon: 'truck'
            });
        });
        
        container.innerHTML = packages.map(pkg => `
            <div class="flex items-center justify-between p-3 border border-${pkg.color}-200 rounded-lg bg-${pkg.color}-50">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-${pkg.icon} text-${pkg.color}-600"></i>
                    <div>
                        <div class="font-medium text-${pkg.color}-800">${pkg.name}</div>
                        <div class="text-sm text-${pkg.color}-600">${pkg.type.toUpperCase()} 패키지 - ${pkg.items.length}개 아이템</div>
                    </div>
                </div>
                <div class="text-sm font-medium text-${pkg.color}-700">
                    ${pkg.items.reduce((sum, item) => sum + item.quantity, 0)} EA
                </div>
            </div>
        `).join('');
    }
    
    submitApprovalRequest() {
        const comment = document.getElementById('approval-comment').value;
        
        // 결재 요청 데이터 생성
        const approvalRequest = {
            id: this.generatePackageId(),
            timestamp: new Date().toISOString(),
            projectName: this.getCurrentProjectName(), // 현재 프로젝트명
            requester: {
                name: '김철수',
                role: 'Production Technician',
                email: 'kim.cs@cswind.com'
            },
            packages: {
                module: this.modulePackages,
                llt: this.lltPackages,
                material: this.materialCategoryPackages
            },
            comment: comment,
            status: 'pending_review',
            approvalLine: [
                { role: 'Engineer', name: '김설계', status: 'completed', timestamp: new Date().toISOString() },
                { role: 'Team Leader', name: '이팀장', status: 'pending', timestamp: null },
                { role: 'CEO', name: '박대표', status: 'pending', timestamp: null }
            ]
        };
        
        // 시뮬레이션: 결재 요청 처리
        this.processApprovalRequest(approvalRequest);
        
        this.closeApprovalModal();
        this.app.showToast('결재 요청이 성공적으로 제출되었습니다.', 'success');
        
        // 자동으로 검토 완료 처리 (시뮬레이션)
        setTimeout(() => {
            this.simulateApprovalProcess(approvalRequest);
        }, 3000);
    }
    
    processApprovalRequest(request) {
        // 결재 요청을 앱 레벨에서 관리
        if (!this.app.approvalRequests) {
            this.app.approvalRequests = [];
        }
        this.app.approvalRequests.push(request);
        
        console.log('결재 요청 등록:', request);
    }
    
    // 정상 워크플로우에서 CEO 승인 완료 패키지 생성
    createCEOApprovedPackageFromWorkflow() {
        console.log('정상 워크플로우에서 CEO 패키지 생성 시작');
        
        // 현재 분석된 패키지 데이터가 있는지 확인
        const hasPackages = Object.keys(this.modulePackages).length > 0 || 
                           Object.keys(this.lltPackages).length > 0 || 
                           Object.keys(this.materialCategoryPackages).length > 0;
        
        if (!hasPackages) {
            console.warn('❌ 분석된 패키지 데이터가 없습니다. 다음 단계를 먼저 완료하세요:');
            console.warn('1. BOM 파일 업로드');
            console.warn('2. AI 고급 BOM 분석 실행');
            console.warn('현재 패키지 상태:', {
                module: Object.keys(this.modulePackages).length,
                llt: Object.keys(this.lltPackages).length,
                material: Object.keys(this.materialCategoryPackages).length
            });
            this.app.showToast('❌ AI 분석이 완료되지 않았습니다. BOM 업로드 → AI 분석 실행 → 결재 승인 순서로 진행하세요.', 'error');
            return;
        }
        
        // 현재 분석된 패키지 데이터로 승인 요청 생성
        const approvalRequest = {
            id: this.generatePackageId(),
            timestamp: new Date().toISOString(),
            projectName: this.getCurrentProjectName() || '풍력타워 프로젝트',
            requester: {
                name: '김철수',
                role: 'Production Technician',
                email: 'kim.cs@cswind.com'
            },
            packages: {
                module: this.modulePackages,
                llt: this.lltPackages,
                material: this.materialCategoryPackages
            },
            comment: '정상 결재라인 승인 완료',
            status: 'approved',
            approvalLine: [
                { role: 'Engineer', name: '김설계', status: 'completed', timestamp: new Date().toISOString() },
                { role: 'Team Leader', name: '이팀장', status: 'completed', timestamp: new Date().toISOString() },
                { role: 'CEO', name: '박대표', status: 'completed', timestamp: new Date().toISOString() }
            ]
        };
        
        console.log('생성된 승인 요청 데이터:', approvalRequest);
        
        // CEO 승인 완료된 패키지 등록
        this.registerApprovedPackage(approvalRequest);
        
        console.log('✅ CEO 패키지 생성 완료');
        console.log('현재 승인된 패키지 수:', this.approvedPackages.length);
    }

    // 테스트용 CEO 승인 시뮬레이션 (사용 중단)
    simulateApprovalProcess(request) {
        console.log('CEO 승인 처리 시작:', request);
        
        // 시뮬레이션: 자동 승인 처리
        request.status = 'approved';
        request.approvalLine[1].status = 'approved';
        request.approvalLine[1].timestamp = new Date().toISOString();
        request.approvalLine[2].status = 'approved';  
        request.approvalLine[2].timestamp = new Date().toISOString();
        
        console.log('승인 상태 업데이트 완료, 패키지 등록 시작');
        
        // CEO 승인 완료된 패키지를 BOM 분석 탭에 등록
        this.registerApprovedPackage(request);
        
        console.log('패키지 등록 완료, 현재 승인 패키지 수:', this.approvedPackages.length);
        
        // 정상 워크플로우에서는 자동 서플라이어 전송 하지 않음
        // POR 생성 버튼을 통해서만 서플라이어에 전송
        console.log('CEO 패키지 등록 완료, 서플라이어 전송은 POR 생성 시에만 수행');
        
        this.app.showToast('CEO 승인 완료! 패키지가 BOM 분석 탭에 등록되었습니다.', 'success');
        
        // 테스트에서만 서플라이어 탭으로 자동 전환 (정상 워크플로우에서는 제외)
        // 실제 사용에서는 POR 생성 버튼을 통해 수동으로 전송
    }

    // CEO 승인 완료된 패키지 등록
    registerApprovedPackage(request) {
        console.log('패키지 등록 함수 시작, request:', request);
        
        // 패키지 번호 생성 (CSW-YYYYMMDD-XXX)
        const packageNumber = this.generatePackageNumber();
        console.log('생성된 패키지 번호:', packageNumber);
        
        const packageInfo = {
            packageNumber: packageNumber,
            projectName: request.projectName || '풍력타워 프로젝트',
            approvedAt: new Date().toISOString(),
            approvalLine: request.approvalLine,
            totalItems: this.getTotalPackageItems(request),
            packageTypes: this.getPackageTypes(request),
            status: 'approved',
            canCreatePOR: true
        };
        
        console.log('패키지 정보 생성 완료:', packageInfo);
        
        // 중복 방지
        const existingIndex = this.approvedPackages.findIndex(pkg => pkg.packageNumber === packageInfo.packageNumber);
        if (existingIndex >= 0) {
            console.log('기존 패키지 업데이트:', existingIndex);
            this.approvedPackages[existingIndex] = packageInfo;
        } else {
            console.log('새 패키지 추가');
            this.approvedPackages.push(packageInfo);
        }
        
        console.log('CEO 승인 완료 패키지 등록:', packageInfo);
        console.log('현재 전체 승인 패키지 목록:', this.approvedPackages);
        
        // BOM 분석 탭의 패키지 목록 UI 업데이트
        console.log('UI 업데이트 시작');
        this.updateApprovedPackagesUI();
        console.log('UI 업데이트 완료');
    }

    // 패키지의 총 아이템 수 계산
    getTotalPackageItems(request) {
        let total = 0;
        if (request.packages) {
            total += Object.values(request.packages.module || {}).flat().length;
            total += Object.values(request.packages.llt || {}).flat().length;
            total += Object.values(request.packages.material || {}).flat().length;
        }
        return total;
    }

    // 패키지 유형 정보 추출
    getPackageTypes(request) {
        const types = [];
        if (request.packages) {
            if (Object.keys(request.packages.module || {}).length > 0) types.push('모듈');
            if (Object.keys(request.packages.llt || {}).length > 0) types.push('LLT');
            if (Object.keys(request.packages.material || {}).length > 0) types.push('자재');
        }
        return types;
    }

    // 승인된 패키지 목록 UI 업데이트
    updateApprovedPackagesUI() {
        console.log('UI 업데이트 함수 시작, 현재 패키지 수:', this.approvedPackages.length);
        
        const section = document.getElementById('approved-packages-section');
        const list = document.getElementById('approved-packages-list');
        const countElement = document.getElementById('approved-packages-count');
        
        if (!section || !list || !countElement) {
            console.warn('승인 패키지 UI 요소를 찾을 수 없습니다. section:', !!section, 'list:', !!list, 'countElement:', !!countElement);
            return;
        }

        // 섹션은 항상 표시
        section.classList.remove('hidden');
        countElement.textContent = `${this.approvedPackages.length}개`;
        
        console.log('패키지 수 업데이트 완료:', this.approvedPackages.length);

        if (this.approvedPackages.length > 0) {
            // 패키지가 있는 경우 패키지 카드들 표시
            console.log('패키지 카드 렌더링 시작');
            const cardsHTML = this.approvedPackages.map(pkg => this.renderApprovedPackageCard(pkg)).join('');
            list.innerHTML = cardsHTML;
            console.log('패키지 카드 렌더링 완료');
        } else {
            // 패키지가 없는 경우 빈 상태 표시
            list.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                    <div class="bg-green-100 p-4 rounded-full mb-4">
                        <i class="fas fa-clipboard-check text-3xl text-green-600"></i>
                    </div>
                    <h4 class="text-lg font-semibold mb-2 text-gray-700">CEO 승인 대기 중</h4>
                    <p class="text-sm text-center max-w-lg text-gray-600 mb-4">
                        아래 단계를 완료하면 CEO 승인 완료 패키지가<br>
                        <strong class="text-green-600">CSW-YYYYMMDD-XXX</strong> 형식으로 이곳에 자동 생성됩니다.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center gap-3 text-xs">
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                <i class="fas fa-upload mr-1"></i>1. BOM 파일 업로드
                            </span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                <i class="fas fa-robot mr-1"></i>2. AI 분석 실행
                            </span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                <i class="fas fa-paper-plane mr-1"></i>3. POR 승인 요청
                            </span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </div>
                        <span class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                            <i class="fas fa-crown mr-1"></i>CEO 승인 완료
                        </span>
                    </div>

                </div>
            `;
        }
    }

    // 승인된 패키지 카드 렌더링
    renderApprovedPackageCard(pkg) {
        const statusIcon = pkg.canCreatePOR ? 'fas fa-play-circle text-green-600' : 'fas fa-check-circle text-blue-600';
        const statusText = pkg.canCreatePOR ? 'POR 생성 가능' : 'POR 생성 완료';
        const statusBg = pkg.canCreatePOR ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        
        return `
            <div class="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300" data-package-id="${pkg.packageNumber}">
                <!-- 패키지 카드 헤더 -->
                <div class="p-4">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h4 class="font-semibold text-gray-800 text-sm">${pkg.packageNumber}</h4>
                            <p class="text-xs text-gray-600 mt-1">${pkg.projectName}</p>
                        </div>
                        <i class="${statusIcon}"></i>
                    </div>
                    
                    <div class="space-y-2 text-xs text-gray-600 mb-3">
                        <div class="flex justify-between">
                            <span>총 아이템:</span>
                            <span class="font-medium">${pkg.totalItems}개</span>
                        </div>
                        <div class="flex justify-between">
                            <span>패키지 유형:</span>
                            <span class="font-medium">${pkg.packageTypes.join(', ')}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>승인일:</span>
                            <span class="font-medium">${new Date(pkg.approvedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                    </div>
                    
                    <!-- 버튼 영역 -->
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusBg}">
                            ${statusText}
                        </span>
                        <div class="flex space-x-2">
                            <!-- 상세보기 토글 버튼 -->
                            <button onclick="togglePackageDetails('${pkg.packageNumber}')" 
                                    class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                    id="toggle-btn-${pkg.packageNumber}">
                                <i class="fas fa-chevron-down mr-1"></i>상세보기
                            </button>
                            <!-- POR 생성 버튼 -->
                            ${pkg.canCreatePOR ? 
                                `<button onclick="createPORFromPackage('${pkg.packageNumber}')" 
                                        class="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors">
                                    <i class="fas fa-plus mr-1"></i>POR 생성
                                </button>` :
                                `<button class="px-3 py-1 bg-gray-300 text-gray-500 text-xs rounded cursor-not-allowed" disabled>
                                    POR 생성 완료
                                </button>`
                            }
                        </div>
                    </div>
                </div>
                
                <!-- 상세 정보 영역 (기본적으로 숨김) -->
                <div id="details-${pkg.packageNumber}" class="package-details hidden border-t border-gray-200 bg-gray-50">
                    <div class="p-4">
                        <!-- 결재라인 정보 -->
                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-users mr-2"></i>결재라인 현황
                            </h5>
                            <div class="space-y-2">
                                ${pkg.approvalLine.map(approver => `
                                    <div class="flex items-center justify-between p-2 bg-white rounded border">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-6 h-6 rounded-full ${approver.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center">
                                                <i class="fas ${approver.status === 'completed' ? 'fa-check' : 'fa-clock'} text-white text-xs"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs font-medium text-gray-700">${approver.name}</p>
                                                <p class="text-xs text-gray-500">${approver.role}</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xs font-medium ${approver.status === 'completed' ? 'text-green-600' : 'text-gray-500'}">
                                                ${approver.status === 'completed' ? '승인 완료' : '대기중'}
                                            </p>
                                            ${approver.timestamp ? 
                                                `<p class="text-xs text-gray-400">${new Date(approver.timestamp).toLocaleString('ko-KR')}</p>` : 
                                                ''
                                            }
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- 패키지 상세 정보 -->
                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-box mr-2"></i>패키지 상세 정보
                            </h5>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-white p-3 rounded border">
                                    <p class="text-xs text-gray-500">패키지 번호</p>
                                    <p class="text-sm font-medium text-gray-800">${pkg.packageNumber}</p>
                                </div>
                                <div class="bg-white p-3 rounded border">
                                    <p class="text-xs text-gray-500">프로젝트명</p>
                                    <p class="text-sm font-medium text-gray-800">${pkg.projectName}</p>
                                </div>
                                <div class="bg-white p-3 rounded border">
                                    <p class="text-xs text-gray-500">총 아이템 수</p>
                                    <p class="text-sm font-medium text-blue-600">${pkg.totalItems}개</p>
                                </div>
                                <div class="bg-white p-3 rounded border">
                                    <p class="text-xs text-gray-500">패키지 유형</p>
                                    <p class="text-sm font-medium text-purple-600">${pkg.packageTypes.join(', ')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 승인 정보 -->
                        <div>
                            <h5 class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-calendar-check mr-2"></i>승인 정보
                            </h5>
                            <div class="bg-white p-3 rounded border">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs text-gray-500">최종 승인일시</span>
                                    <span class="text-sm font-medium text-green-600">${new Date(pkg.approvedAt).toLocaleString('ko-KR')}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-500">승인 상태</span>
                                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ${pkg.status === 'approved' ? '승인 완료' : pkg.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // POR 생성 (승인된 패키지에서)
    createPORFromApprovedPackage(packageNumber) {
        const packageInfo = this.approvedPackages.find(pkg => pkg.packageNumber === packageNumber);
        if (!packageInfo) {
            this.app.showToast('패키지 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        if (!packageInfo.canCreatePOR) {
            this.app.showToast('이미 POR이 생성된 패키지입니다.', 'warning');
            return;
        }

        // 현재 선택된 패키지 설정 (POR 생성을 위해)
        this.selectedPackageForPOR = packageInfo;
        
        // 기존 POR 확인 팝업 사용
        this.showPORConfirmationModal(packageNumber);
    }

    // POR 확인 팝업 표시 (CEO 승인 완료 패키지용)
    showPORConfirmationModal(packageNumber) {
        // 패키지 정보 요약 생성
        const summary = document.getElementById('export-package-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="text-center mb-4">
                    <div class="text-lg font-semibold text-orange-800">패키지 ${packageNumber}</div>
                    <div class="text-sm text-gray-600">POR(구매요청서) 생성</div>
                </div>
                <div class="bg-blue-50 p-3 rounded">
                    <div class="flex justify-between">
                        <span>패키지 번호:</span>
                        <span class="font-medium">${packageNumber}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>프로젝트:</span>
                        <span class="font-medium">${this.selectedPackageForPOR.projectName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>총 아이템:</span>
                        <span class="font-medium">${this.selectedPackageForPOR.totalItems}개</span>
                    </div>
                    <div class="flex justify-between">
                        <span>패키지 유형:</span>
                        <span class="font-medium">${this.selectedPackageForPOR.packageTypes.join(', ')}</span>
                    </div>
                </div>
                <div class="mt-3 text-center">
                    <p class="text-sm text-gray-600">이 패키지의 POR을 생성하여 서플라이어 탭으로 전송하시겠습니까?</p>
                </div>
            `;
        }

        // 확인 팝업 표시
        const modal = document.getElementById('export-confirmation-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    // POR 생성 확정 처리 (CEO 승인 완료 패키지용)
    confirmPORFromApprovedPackage() {
        if (!this.selectedPackageForPOR) {
            this.app.showToast('선택된 패키지가 없습니다.', 'error');
            return;
        }

        const packageInfo = this.selectedPackageForPOR;
        
        // 확인 팝업 닫기
        const modal = document.getElementById('export-confirmation-modal');
        if (modal) {
            modal.classList.remove('show');
        }

        // POR 생성 처리
        packageInfo.canCreatePOR = false;
        packageInfo.porCreatedAt = new Date().toISOString();
        
        // 패키지를 서플라이어 탭으로 전송
        this.transferApprovedPackageToSupplierTab(packageInfo);
        
        // UI 업데이트
        this.updateApprovedPackagesUI();
        
        this.app.showToast(`패키지 ${packageInfo.packageNumber}의 POR이 생성되어 서플라이어 탭으로 전송되었습니다.`, 'success');
        
        // 선택된 패키지 초기화
        this.selectedPackageForPOR = null;
        
        // 3초 후 서플라이어 탭으로 이동
        setTimeout(() => {
            this.switchToSupplierTab();
        }, 2000);
    }

    // 현재 프로젝트명 가져오기
    getCurrentProjectName() {
        // 현재 선택된 프로젝트가 있으면 그 이름을 사용
        if (this.app.selectedProject && this.app.selectedProject.project_name) {
            return this.app.selectedProject.project_name;
        }
        
        // 기본값
        return '풍력타워 프로젝트';
    }

    // 패키지 번호 생성 (CSW-YYYYMMDD-XXX)
    generatePackageNumber() {
        const today = new Date();
        const dateStr = today.getFullYear().toString() + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
        
        // 시간 기반 고유 번호 생성 (밀리초 기반)
        const timeStr = today.getHours().toString().padStart(2, '0') + 
                       today.getMinutes().toString().padStart(2, '0') + 
                       (today.getSeconds() * 1000 + today.getMilliseconds()).toString().padStart(5, '0').slice(-3);
        
        return `CSW-${dateStr}-${timeStr}`;
    }

    // 테스트용 샘플 BOM 데이터 생성
    createSampleBOMData() {
        this.originalBOM = [
            {
                id: 'BOM-001',
                partNumber: 'FL-ASSY-001',
                partName: '플랜지 조립품',
                level: 1,
                quantity: 4,
                material: 'Steel',
                weight: 125.5,
                dimensions: '1200x800x100',
                drawingNumber: 'DWG-FL-001',
                supplier: '효성중공업',
                itemType: 'Flange',
                specialCategory: '플랜지류'
            },
            {
                id: 'BOM-002',
                partNumber: 'CABLE-002',
                partName: '제어 케이블',
                level: 2,
                quantity: 10,
                material: 'Copper',
                weight: 3.2,
                dimensions: '5000x20x15',
                drawingNumber: 'DWG-CABLE-002',
                supplier: '케이씨테크',
                itemType: 'Cable',
                specialCategory: '전장품'
            },
            {
                id: 'BOM-003',
                partNumber: 'STEEL-S690-003',
                partName: '고강도 강재',
                level: 1,
                quantity: 8,
                material: 'S690QL',
                weight: 890.0,
                dimensions: '3000x1500x50',
                drawingNumber: 'DWG-STEEL-003',
                supplier: '포스코강판',
                itemType: 'Steel',
                specialCategory: '고강도 강재'
            },
            {
                id: 'BOM-004',
                partNumber: 'PLATFORM-004',
                partName: '작업 플랫폼',
                level: 1,
                quantity: 2,
                material: 'Aluminum',
                weight: 450.0,
                dimensions: '4000x2000x150',
                drawingNumber: 'DWG-PLATFORM-004',
                supplier: '대한중공업',
                itemType: 'Platform',
                specialCategory: '모듈단위 조립품'
            },
            {
                id: 'BOM-005',
                partNumber: 'BRACKET-005',
                partName: '소형 브라켓',
                level: 3,
                quantity: 20,
                material: 'Steel',
                weight: 2.1,
                dimensions: '200x150x50',
                drawingNumber: 'DWG-BRACKET-005',
                supplier: '동국제강',
                itemType: 'Bracket',
                specialCategory: 'Small Parts'
            }
        ];

        console.log('샘플 BOM 데이터 생성됨:', this.originalBOM.length, '개');
    }

    // 승인된 패키지를 서플라이어 탭으로 전송
    transferApprovedPackageToSupplierTab(packageInfo) {
        if (!this.app.receivedPackages) {
            this.app.receivedPackages = [];
        }

        const packageData = {
            id: `pkg-${Date.now()}`,
            packageNumber: packageInfo.packageNumber,
            status: 'received',
            receivedDate: new Date().toISOString(),
            requester: {
                name: 'BOM 분석팀',
                department: 'R&D',
                timestamp: packageInfo.approvedAt
            },
            packages: {
                module: this.modulePackages,
                llt: this.lltPackages,
                material: this.materialCategoryPackages
            },
            totalItems: packageInfo.totalItems,
            porGenerated: true,
            originalApprovalData: packageInfo.approvalLine
        };

        // 중복 방지
        const existingIndex = this.app.receivedPackages.findIndex(pkg => pkg.packageNumber === packageInfo.packageNumber);
        if (existingIndex >= 0) {
            this.app.receivedPackages[existingIndex] = packageData;
        } else {
            this.app.receivedPackages.push(packageData);
        }

        console.log('승인된 패키지가 서플라이어 탭으로 전송됨:', packageData);
    }



    // 서플라이어 탭으로 전환
    switchToSupplierTab() {
        // 서플라이어 탭 클릭 시뮬레이션
        const supplierTab = document.querySelector('[onclick="showSuppliers()"]');
        if (supplierTab) {
            supplierTab.click();
            this.app.showToast('서플라이어 탭으로 이동되었습니다.', 'info');
        }
    }

    // 기존 수동 승인 프로세스 제거됨 - 자동 승인 시스템 사용

    // 패키지 서머리 모달 표시
    showPackageSummaryModal() {
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        if (totalPackages === 0) {
            this.app.showToast('승인할 패키지가 없습니다.', 'warning');
            return;
        }

        // 패키지 서머리 모달 표시
        this.openPackageSummaryModal();
    }
    
    openPackageSummaryModal() {
        const modal = document.getElementById('approval-modal');
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        const totalItems = this.aiClassificationResults.length;
        
        // 모달 제목 변경
        const modalTitle = modal.querySelector('h3');
        if (modalTitle) {
            modalTitle.innerHTML = `
                <i class="fas fa-clipboard-check text-blue-600 mr-3"></i>
                패키지 승인 확인
            `;
        }
        
        // 패키지 정보 업데이트
        document.getElementById('approval-package-count').textContent = totalPackages;
        document.getElementById('approval-total-items').textContent = totalItems;
        document.getElementById('approval-created-date').textContent = new Date().toLocaleString('ko-KR');
        
        // 패키지 목록 표시
        this.displayApprovalPackagesList();
        
        // 승인 버튼으로 변경
        const submitBtn = document.getElementById('btn-submit-approval');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>승인';
            submitBtn.className = 'px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700';
            submitBtn.onclick = () => this.finalApprovalAndTransferToSupplier();
        }
        
        modal.classList.add('show');
    }

    // 최종 승인 및 서플라이어 탭 전송
    finalApprovalAndTransferToSupplier() {
        const comment = document.getElementById('approval-comment').value;
        
        // 패키지 데이터 생성
        const packageData = {
            id: this.generatePackageId(),
            packageNumber: this.generatePackageNumber(),
            timestamp: new Date().toISOString(),
            requester: {
                name: '김철수',
                role: 'Production Engineer',
                email: 'kim.cs@cswind.com'
            },
            packages: {
                module: this.modulePackages,
                llt: this.lltPackages,
                material: this.materialCategoryPackages
            },
            comment: comment,
            status: 'approved',
            receivedDate: new Date().toISOString()
        };
        
        // POR 생성 시에만 서플라이어 탭으로 전송
        this.sendPackagesToSupplierTab(packageData);
        
        // 모달 닫기
        this.closeApprovalModal();
        
        this.app.showToast('POR이 생성되어 SCM팀으로 전송되었습니다.', 'success');
        
        // 2초 후 서플라이어 탭으로 자동 전환
        setTimeout(() => {
            this.switchToSupplierTab();
        }, 2000);
    }

    // 승인 모달 닫기
    closeApprovalModal() {
        const modal = document.getElementById('approval-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    sendPackagesToSupplierTab(approvedRequest) {
        // 서플라이어 탭에 패키지 정보 전송
        if (!this.app.receivedPackages) {
            this.app.receivedPackages = [];
        }
        
        const packageData = {
            ...approvedRequest,
            receivedDate: new Date().toISOString(),
            packageNumber: this.generatePackageNumber(),
            status: 'received'
        };
        
        this.app.receivedPackages.push(packageData);
        
        // 서플라이어 탭 업데이트 알림
        const receivedCountEl = document.getElementById('received-packages-count');
        if (receivedCountEl) {
            receivedCountEl.textContent = this.app.receivedPackages.length;
        }
        
        // 서플라이어 관리자가 있으면 대시보드 업데이트
        if (this.app.supplierManager) {
            this.app.supplierManager.updatePackageDashboard();
        }
        
        console.log('패키지가 서플라이어 탭으로 전송됨:', packageData);
    }
    
    generatePackageId() {
        return 'PKG_' + Math.random().toString(36).substr(2, 9).toUpperCase() + '_' + Date.now();
    }
    
    generatePackageNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        
        return `CSW-${year}${month}${day}-${sequence}`;
    }
    
    exportSupplierPackages() {
        // 기존 내보내기 기능은 결재 완료 후에만 사용
        this.app.showToast('패키지 내보내기는 결재 완료 후 서플라이어 탭에서 가능합니다.', 'info');
    }
    
    loadDrawingDatabase() {
        // 도면 데이터베이스 로드 시뮬레이션
        console.log('도면 데이터베이스 로드 완료');
    }
    
    setupDragAndDrop() {
        console.log('드래그앤드롭 설정 시작');
        
        // 왼쪽 BOM 트리 아이템들 (원본)
        const bomTreeItems = document.querySelectorAll('.bom-tree-item');
        console.log(`BOM 트리 아이템 개수: ${bomTreeItems.length}`);
        
        // 오른쪽 패키지 내 아이템들 (이동 가능)
        const packageItems = document.querySelectorAll('.supplier-package-item, .module-package-item, .llt-package-item');
        console.log(`패키지 아이템 개수: ${packageItems.length}`);
        
        // 패키지 컨테이너들 (드롭 대상)
        const packages = document.querySelectorAll('.supplier-package, .module-package, .llt-package');
        console.log(`패키지 개수: ${packages.length}`);
        
        // BOM 트리 아이템들에 드래그 이벤트 연결 (읽기 전용이지만 드래그 가능)
        bomTreeItems.forEach(item => {
            const gripIcon = item.querySelector('.fa-grip-vertical');
            if (gripIcon) {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', this.handleDragStart.bind(this));
                item.addEventListener('dragend', this.handleDragEnd.bind(this));
            }
        });
        
        // 패키지 아이템들에 드래그 이벤트 연결
        packageItems.forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        // 패키지들에 드롭 이벤트 연결
        packages.forEach(pkg => {
            pkg.addEventListener('dragover', this.handleDragOver.bind(this));
            pkg.addEventListener('drop', this.handleDrop.bind(this));
            pkg.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
        
        console.log('드래그앤드롭 설정 완료');
    }
    
    handleDragStart(event) {
        console.log('드래그 시작:', event.target);
        
        // 드래그되는 요소가 BOM 아이템인지 확인
        const bomItem = event.target.closest('[data-bom-id]');
        if (bomItem) {
            this.draggedItem = bomItem;
            bomItem.classList.add('dragging');
            
            // 드래그 데이터 설정
            event.dataTransfer.setData('text/plain', bomItem.dataset.bomId);
            event.dataTransfer.effectAllowed = 'move';
            
            console.log(`드래그 시작 - BOM ID: ${bomItem.dataset.bomId}`);
        }
    }
    
    handleDragEnd(event) {
        console.log('드래그 종료');
        
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }
        
        // 모든 드래그 오버 효과 제거
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
    
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const targetPackage = event.currentTarget.closest('.supplier-package, .module-package, .llt-package');
        if (targetPackage) {
            targetPackage.classList.add('drag-over');
        }
    }
    
    handleDragLeave(event) {
        const targetPackage = event.currentTarget.closest('.supplier-package, .module-package, .llt-package');
        if (targetPackage && !targetPackage.contains(event.relatedTarget)) {
            targetPackage.classList.remove('drag-over');
        }
    }
    
    handleDrop(event) {
        event.preventDefault();
        console.log('드롭 이벤트 발생');
        
        const targetPackage = event.currentTarget.closest('.supplier-package, .module-package, .llt-package');
        if (targetPackage) {
            targetPackage.classList.remove('drag-over');
        }
        
        if (this.draggedItem) {
            const bomId = this.draggedItem.dataset.bomId;
            const currentPackage = this.draggedItem.dataset.currentPackage;
            const currentPackageType = this.draggedItem.dataset.packageType;
            
            // 타겟 패키지 정보 추출
            const targetInfo = this.getTargetPackageInfo(targetPackage);
            
            console.log(`드롭 처리 - BOM ID: ${bomId}, 현재: ${currentPackage} (${currentPackageType}), 대상: ${targetInfo.key} (${targetInfo.type})`);
            
            if (bomId && targetInfo.key) {
                // 같은 패키지에 드롭하는 경우 무시
                if (currentPackage === targetInfo.key) {
                    console.log('같은 패키지로 이동 시도 - 무시됨');
                    this.app.showToast('같은 패키지입니다.', 'warning');
                    return;
                }
                
                this.moveItemBetweenPackages(bomId, currentPackage, currentPackageType, targetInfo);
                this.app.showToast(`항목이 ${currentPackage}에서 ${targetInfo.key}로 이동되었습니다.`, 'success');
            }
        }
    }
    
    getTargetPackageInfo(targetPackage) {
        if (targetPackage.classList.contains('supplier-package')) {
            return {
                type: 'supplier',
                key: targetPackage.dataset.supplier
            };
        } else if (targetPackage.classList.contains('module-package')) {
            return {
                type: 'module',
                key: targetPackage.dataset.module
            };
        } else if (targetPackage.classList.contains('llt-package')) {
            return {
                type: 'llt',
                key: targetPackage.dataset.llt
            };
        }
        return { type: null, key: null };
    }
    
    moveItemBetweenPackages(bomId, currentPackageKey, currentPackageType, targetInfo) {
        console.log(`BOM ${bomId}을 ${currentPackageKey} (${currentPackageType})에서 ${targetInfo.key} (${targetInfo.type})로 이동`);
        
        // 1. 현재 패키지에서 아이템 찾기 및 제거
        let movedItem = null;
        const currentPackageData = this.getPackageData(currentPackageType);
        
        if (currentPackageKey && currentPackageData[currentPackageKey]) {
            const currentItems = currentPackageData[currentPackageKey];
            const itemIndex = currentItems.findIndex(item => item.id === bomId);
            
            if (itemIndex !== -1) {
                movedItem = currentItems.splice(itemIndex, 1)[0];
                console.log('아이템 제거됨:', movedItem.partName);
            }
        }
        
        // 2. 대상 패키지에 아이템 추가
        if (movedItem) {
            const targetPackageData = this.getPackageData(targetInfo.type);
            
            if (!targetPackageData[targetInfo.key]) {
                targetPackageData[targetInfo.key] = [];
            }
            
            // 아이템 정보 업데이트
            this.updateItemForPackageType(movedItem, targetInfo.type, targetInfo.key);
            targetPackageData[targetInfo.key].push(movedItem);
            
            console.log(`아이템 추가됨 (${targetInfo.key}):`, movedItem.partName);
            
            // 3. UI 새로고침
            this.displaySupplierPackages();
            
            // 4. AI 분석 결과도 업데이트
            const aiResultItem = this.aiClassificationResults.find(item => item.id === bomId);
            if (aiResultItem) {
                this.updateAIResultForPackageType(aiResultItem, targetInfo.type, targetInfo.key);
            }
            
            // 5. 통계 업데이트
            this.updateAllPackageStats();
        }
    }
    
    getPackageData(packageType) {
        switch (packageType) {
            case 'module': return this.modulePackages;
            case 'llt': return this.lltPackages;
            case 'supplier': return this.supplierPackages;
            default: return {};
        }
    }
    
    updateItemForPackageType(item, packageType, packageKey) {
        switch (packageType) {
            case 'module':
                item.specialCategory = 'module';
                item.isModuleAssembly = true;
                item.isLongLeadTime = false;
                break;
            case 'llt':
                item.specialCategory = 'llt';
                item.isModuleAssembly = false;
                item.isLongLeadTime = true;
                break;
            case 'supplier':
                item.specialCategory = 'supplier';
                item.isModuleAssembly = false;
                item.isLongLeadTime = false;
                item.suggestedSupplier = packageKey;
                break;
        }
    }
    
    updateAIResultForPackageType(aiResult, packageType, packageKey) {
        this.updateItemForPackageType(aiResult, packageType, packageKey);
    }
    
    updateAllPackageStats() {
        // 모듈 패키지 수 업데이트
        const moduleCountBadge = document.getElementById('module-count-badge');
        if (moduleCountBadge) {
            moduleCountBadge.textContent = `${Object.keys(this.modulePackages).length}개`;
        }
        
        // LLT 패키지 수 업데이트
        const lltCountBadge = document.getElementById('llt-count-badge');
        if (lltCountBadge) {
            lltCountBadge.textContent = `${Object.keys(this.lltPackages).length}개`;
        }
        
        // 서플라이어 패키지 수 업데이트
        const supplierCountBadge = document.getElementById('supplier-count-badge');
        if (supplierCountBadge) {
            supplierCountBadge.textContent = `${Object.keys(this.materialCategoryPackages).length}개`;
        }
        
        console.log('모든 패키지 통계 업데이트 완료');
    }
    
    updateSupplierStats() {
        // 서플라이어 패키지 수 업데이트
        const materialPackagesCount = document.getElementById('material-packages-count');
        if (materialPackagesCount) {
            materialPackagesCount.textContent = Object.keys(this.materialCategoryPackages).length;
        }
        
        console.log('서플라이어 통계 업데이트 완료');
    }

    // 승인 시스템 설정
    setupApprovalButtons() {
        // 승인 요청 버튼 설정
        const approvalRequestBtn = document.getElementById('btn-submit-approval-request');
        if (approvalRequestBtn) {
            approvalRequestBtn.addEventListener('click', () => this.startApprovalProcess());
        }
        
        // 승인 진행 상태 초기화
        this.approvalProgress = {
            isInProgress: false,
            currentStep: 0,
            startTime: null,
            stepTimings: [3000, 5000, 7000] // 각 단계별 소요 시간 (밀리초)
        };
    }

    // 자동 승인 프로세스 시작
    startApprovalProcess() {
        console.log('🚀 자동 승인 프로세스 시작');
        
        // 패키지 데이터가 있는지 확인
        const hasPackages = Object.keys(this.modulePackages).length > 0 || 
                           Object.keys(this.lltPackages).length > 0 || 
                           Object.keys(this.materialCategoryPackages).length > 0;
        
        if (!hasPackages) {
            this.app.showToast('❌ AI 분석이 완료되지 않았습니다. BOM 업로드 → AI 분석 실행을 먼저 완료하세요.', 'error');
            return;
        }
        
        // 이미 진행 중이면 중단
        if (this.approvalProgress.isInProgress) {
            this.app.showToast('이미 승인 프로세스가 진행 중입니다.', 'warning');
            return;
        }
        
        // 승인 프로세스 초기화
        this.approvalProgress.isInProgress = true;
        this.approvalProgress.currentStep = 0;
        this.approvalProgress.startTime = Date.now();
        
        // UI 업데이트
        this.showApprovalProgressUI();
        this.disableApprovalRequestButton();
        
        // 첫 번째 단계 시작
        this.processApprovalStepAuto(1);
        
        this.app.showToast('승인 요청이 제출되었습니다. 자동으로 결재라인 승인이 진행됩니다.', 'info');
    }
    
    // 승인 진행 UI 표시
    showApprovalProgressUI() {
        const container = document.getElementById('approval-progress-container');
        if (container) {
            container.classList.remove('hidden');
        }
        
        // 시간 업데이트 타이머 시작
        this.startProgressTimer();
    }
    
    // 승인 요청 버튼 비활성화
    disableApprovalRequestButton() {
        const btn = document.getElementById('btn-submit-approval-request');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>승인 진행 중...';
        }
    }
    
    // 진행 시간 타이머
    startProgressTimer() {
        this.progressTimer = setInterval(() => {
            if (!this.approvalProgress.isInProgress) {
                clearInterval(this.progressTimer);
                return;
            }
            
            const elapsed = Math.floor((Date.now() - this.approvalProgress.startTime) / 1000);
            const timeElement = document.getElementById('approval-progress-time');
            if (timeElement) {
                timeElement.textContent = `진행 시간: ${elapsed}초`;
            }
        }, 1000);
    }
    
    // 자동 승인 단계 처리
    processApprovalStepAuto(step) {
        console.log(`📋 자동 승인 단계 ${step} 시작`);
        
        const stepElement = document.getElementById(`approval-step-${step}`);
        const roles = ['생산기술자', 'SCM팀장', 'CEO'];
        const names = ['김설계', '이팀장', '박대표'];
        
        // 현재 단계를 진행 중으로 표시
        this.updateApprovalStepUI(step, 'in-progress', `${names[step - 1]} 검토 중...`);
        
        // 전체 진행률 업데이트
        this.updateOverallProgress(step);
        
        // 지정된 시간 후 승인 완료 처리
        setTimeout(() => {
            this.completeApprovalStep(step);
        }, this.approvalProgress.stepTimings[step - 1]);
    }
    
    // 승인 단계 완료 처리
    completeApprovalStep(step) {
        console.log(`✅ 승인 단계 ${step} 완료`);
        
        const roles = ['생산기술자', 'SCM팀장', 'CEO'];
        const names = ['김설계', '이팀장', '박대표'];
        
        // 현재 단계를 완료로 표시
        this.updateApprovalStepUI(step, 'completed', `${names[step - 1]} 승인 완료`);
        
        // 완료 효과 애니메이션
        const stepElement = document.getElementById(`approval-step-${step}`);
        if (stepElement) {
            stepElement.classList.add('approval-completed-effect');
            setTimeout(() => {
                stepElement.classList.remove('approval-completed-effect');
            }, 500);
        }
        
        this.app.showToast(`${roles[step - 1]} (${names[step - 1]}) 승인이 완료되었습니다.`, 'success');
        
        // 다음 단계 또는 최종 완료 처리
        if (step < 3) {
            // 다음 단계 진행
            setTimeout(() => {
                this.processApprovalStepAuto(step + 1);
            }, 1000);
        } else {
            // 모든 승인 완료
            this.completeAllApprovals();
        }
    }
    
    // 승인 단계 UI 업데이트
    updateApprovalStepUI(step, status, statusText) {
        const stepElement = document.getElementById(`approval-step-${step}`);
        const statusElement = stepElement?.querySelector('.approval-step-status');
        const iconElement = stepElement?.querySelector('.approval-step-icon i');
        
        if (!stepElement) return;
        
        // 기존 상태 클래스 제거
        stepElement.classList.remove('approval-step-pending', 'approval-step-in-progress', 'approval-step-completed');
        
        // 새 상태 적용
        stepElement.classList.add(`approval-step-${status}`);
        
        // 상태 텍스트 업데이트
        if (statusElement) {
            statusElement.textContent = statusText;
        }
        
        // 아이콘 업데이트
        if (iconElement) {
            if (status === 'in-progress') {
                iconElement.className = 'fas fa-spinner fa-spin text-white text-sm';
            } else if (status === 'completed') {
                iconElement.className = 'fas fa-check text-white text-sm';
            } else {
                iconElement.className = 'fas fa-clock text-gray-500 text-sm';
            }
        }
    }
    
    // 전체 진행률 업데이트
    updateOverallProgress(currentStep) {
        const progress = (currentStep / 3) * 100;
        const progressBar = document.getElementById('approval-progress-bar');
        const progressText = document.getElementById('approval-overall-progress');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }
    
    // 모든 승인 완료 처리
    completeAllApprovals() {
        console.log('🎉 모든 결재라인 승인 완료! CEO 패키지 생성 시작');
        
        // 진행 상태 종료
        this.approvalProgress.isInProgress = false;
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }
        
        // 진행률 100%로 설정
        this.updateOverallProgress(3);
        
        // CEO 승인 완료 시 자동으로 패키지 생성
        try {
            this.createCEOApprovedPackageFromWorkflow();
            console.log('✅ CEO 패키지 생성 함수 호출 완료');
        } catch (error) {
            console.error('❌ CEO 패키지 생성 중 오류:', error);
        }
        
        // 승인 완료 후 승인 요청 버튼 상태 업데이트
        this.updateApprovalButtonState();
        
        // 승인 요청 버튼 초기화
        this.resetApprovalRequestButton();
        
        this.app.showToast('🎉 모든 승인이 완료되었습니다! CEO 승인 완료 패키지가 생성되었습니다.', 'success');
        
        // 3초 후 진행창 숨기기
        setTimeout(() => {
            const container = document.getElementById('approval-progress-container');
            if (container) {
                container.classList.add('hidden');
            }
        }, 5000);
    }
    
    // 승인 요청 버튼 초기화
    resetApprovalRequestButton() {
        const btn = document.getElementById('btn-submit-approval-request');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>승인 요청';
        }
    }

    // 패키지 내보내기 확인 팝업 표시
    showExportConfirmation() {
        const totalPackages = Object.keys(this.modulePackages).length + 
                             Object.keys(this.lltPackages).length + 
                             Object.keys(this.materialCategoryPackages).length;
        
        if (totalPackages === 0) {
            this.app.showToast('POR을 생성할 자재가 없습니다.', 'warning');
            return;
        }

        // 패키지 정보 요약 생성
        const summary = document.getElementById('export-package-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="flex justify-between">
                    <span>모듈 패키지:</span>
                    <span class="font-medium">${Object.keys(this.modulePackages).length}개</span>
                </div>
                <div class="flex justify-between">
                    <span>LLT 패키지:</span>
                    <span class="font-medium">${Object.keys(this.lltPackages).length}개</span>
                </div>
                <div class="flex justify-between">
                    <span>자재 특성별 패키지:</span>
                    <span class="font-medium">${Object.keys(this.materialCategoryPackages).length}개</span>
                </div>
                <div class="flex justify-between border-t pt-2 mt-2 font-semibold">
                    <span>총 패키지 수:</span>
                    <span class="text-orange-600">${totalPackages}개</span>
                </div>
            `;
        }

        // 확인 팝업 표시
        document.getElementById('export-confirmation-modal').classList.add('show');
    }

    // 패키지 내보내기 확정 처리
    confirmPackageExport() {
        // 확인 팝업 닫기
        document.getElementById('export-confirmation-modal').classList.remove('show');
        
        // CEO 승인 완료 패키지에서 POR 생성하는 경우
        if (this.selectedPackageForPOR) {
            this.confirmPORFromApprovedPackage();
            return;
        }
        
        // 일반적인 BOM 분석에서 POR 생성하는 경우
        this.finalApprovalAndTransferToSupplier();
    }
}

// 전역 함수들
function refreshApprovedPackages() {
    if (window.csWindApp && window.csWindApp.advancedBOMManager) {
        window.csWindApp.advancedBOMManager.updateApprovedPackagesUI();
        window.csWindApp.showToast('승인 완료 패키지 목록이 새로고침되었습니다.', 'info');
    }
}

function createPORFromPackage(packageNumber) {
    if (window.csWindApp && window.csWindApp.advancedBOMManager) {
        window.csWindApp.advancedBOMManager.createPORFromApprovedPackage(packageNumber);
    }
}

// 패키지 상세보기 토글 함수
function togglePackageDetails(packageNumber) {
    const detailsElement = document.getElementById(`details-${packageNumber}`);
    const toggleBtn = document.getElementById(`toggle-btn-${packageNumber}`);
    
    if (!detailsElement || !toggleBtn) {
        console.error('상세보기 요소를 찾을 수 없습니다:', packageNumber);
        return;
    }
    
    const isHidden = detailsElement.classList.contains('hidden');
    
    if (isHidden) {
        // 상세보기 열기
        detailsElement.classList.remove('hidden');
        detailsElement.style.maxHeight = '0px';
        detailsElement.style.overflow = 'hidden';
        detailsElement.style.transition = 'max-height 0.3s ease-out';
        
        // 실제 높이 계산
        setTimeout(() => {
            const scrollHeight = detailsElement.scrollHeight;
            detailsElement.style.maxHeight = scrollHeight + 'px';
        }, 10);
        
        // 애니메이션 완료 후 스타일 정리
        setTimeout(() => {
            detailsElement.style.maxHeight = '';
            detailsElement.style.overflow = '';
        }, 300);
        
        // 버튼 아이콘 및 텍스트 변경
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>접기';
        toggleBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        toggleBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
        
        console.log('패키지 상세보기 열림:', packageNumber);
    } else {
        // 상세보기 닫기
        const scrollHeight = detailsElement.scrollHeight;
        detailsElement.style.maxHeight = scrollHeight + 'px';
        detailsElement.style.overflow = 'hidden';
        detailsElement.style.transition = 'max-height 0.3s ease-in';
        
        setTimeout(() => {
            detailsElement.style.maxHeight = '0px';
        }, 10);
        
        // 애니메이션 완료 후 요소 숨김
        setTimeout(() => {
            detailsElement.classList.add('hidden');
            detailsElement.style.maxHeight = '';
            detailsElement.style.overflow = '';
        }, 300);
        
        // 버튼 아이콘 및 텍스트 변경
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>상세보기';
        toggleBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
        toggleBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        
        console.log('패키지 상세보기 닫힘:', packageNumber);
    }
}

// 개발자 전용 디버깅 기능 토글
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        const debugSection = document.getElementById('debug-test-section');
        if (debugSection) {
            debugSection.style.display = debugSection.style.display === 'none' ? 'block' : 'none';
        }
    }
});

// 디버깅 전용 CEO 승인 완료 시뮬레이션 함수
function testCEOApproval() {
    console.log('[DEBUG] CEO 승인 테스트 함수 시작');
    
    if (!window.csWindApp || !window.csWindApp.advancedBOMManager) {
        console.error('[DEBUG] Advanced BOM Manager가 초기화되지 않았습니다.');
        alert('Advanced BOM Manager가 초기화되지 않았습니다.');
        return;
    }
    
    const bomManager = window.csWindApp.advancedBOMManager;
    
    // 테스트용 샘플 데이터 생성
    bomManager.createSampleBOMData();
    
    // 테스트용 승인 요청 데이터 생성
    const testRequest = {
        id: 'TEST-' + Date.now(),
        timestamp: new Date().toISOString(),
        projectName: '테스트 풍력타워 프로젝트',
        requester: {
            name: '김테스트',
            role: 'Production Technician',
            email: 'test@cswind.com'
        },
        packages: {
            module: {'모듈조립품 A': [bomManager.originalBOM[0]]},
            llt: {'LLT 패키지 A': [bomManager.originalBOM[1]]},
            material: {'자재 패키지 A': [bomManager.originalBOM[2] || bomManager.originalBOM[0]]}
        },
        comment: 'CEO 승인 테스트',
        status: 'pending_review',
        approvalLine: [
            { role: 'Engineer', name: '김설계', status: 'completed', timestamp: new Date().toISOString() },
            { role: 'Team Leader', name: '이팀장', status: 'pending', timestamp: null },
            { role: 'CEO', name: '박대표', status: 'pending', timestamp: null }
        ]
    };
    
    console.log('[DEBUG] 테스트 요청 데이터:', testRequest);
    
    // CEO 승인 시뮬레이션 실행 (테스트용)
    bomManager.simulateApprovalProcess(testRequest);
    
    window.csWindApp.showToast('[DEBUG] CEO 승인 테스트가 실행되었습니다. 콘솔을 확인하세요.', 'info');
}