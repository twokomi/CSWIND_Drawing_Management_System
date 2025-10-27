// 자재 특성별 패키지 관리 시스템

class SupplierPackageManager {
    constructor(app) {
        this.app = app;
        this.selectedPackage = null;
        this.activePackageId = null; // 현재 토글된 패키지 ID
        this.init();
    }

    init() {
        this.setupEvents();
        this.loadReceivedPackages();
    }

    setupEvents() {
        // 탭 전환 버튼들
        const showPackagesBtn = document.getElementById('btn-show-received-packages');
        const showSuppliersBtn = document.getElementById('btn-show-supplier-list');

        if (showPackagesBtn) {
            showPackagesBtn.addEventListener('click', () => this.showReceivedPackages());
        }

        if (showSuppliersBtn) {
            showSuppliersBtn.addEventListener('click', () => this.showSupplierList());
        }
    }

    showReceivedPackages() {
        document.getElementById('received-packages-section').classList.remove('hidden');
        document.getElementById('supplier-list-section').classList.add('hidden');
        
        // 버튼 상태 업데이트
        document.getElementById('btn-show-received-packages').classList.add('bg-green-700');
        document.getElementById('btn-show-supplier-list').classList.remove('bg-blue-700');
        
        this.loadReceivedPackages();
    }

    showSupplierList() {
        document.getElementById('received-packages-section').classList.add('hidden');
        document.getElementById('supplier-list-section').classList.remove('hidden');
        
        // 버튼 상태 업데이트
        document.getElementById('btn-show-received-packages').classList.remove('bg-green-700');
        document.getElementById('btn-show-supplier-list').classList.add('bg-blue-700');
        
        this.loadSupplierList();
    }

    loadReceivedPackages() {
        const container = document.getElementById('received-packages-container');
        const emptyDiv = document.getElementById('received-packages-empty');
        
        // 대시보드 업데이트
        this.updatePackageDashboard();
        
        if (!this.app.receivedPackages || this.app.receivedPackages.length === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }

        if (emptyDiv) emptyDiv.style.display = 'none';

        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-medium text-gray-800">
                        패키지 목록 (${this.app.receivedPackages.length}개)
                    </h4>
                    <div class="flex space-x-2">
                        <button class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
                            <i class="fas fa-filter mr-1"></i>필터
                        </button>
                        <button class="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">
                            <i class="fas fa-sync mr-1"></i>새로고침
                        </button>
                    </div>
                </div>
                ${this.app.receivedPackages.map(pkg => this.renderPackageCard(pkg)).join('')}
            </div>
        `;

        // 패키지 카드 이벤트 연결
        this.attachPackageCardEvents();
    }

    updatePackageDashboard() {
        const totalElement = document.getElementById('total-received-packages');
        const processedElement = document.getElementById('processed-packages');
        const pendingElement = document.getElementById('pending-packages');

        if (!this.app.receivedPackages) {
            if (totalElement) totalElement.textContent = '0';
            if (processedElement) processedElement.textContent = '0';
            if (pendingElement) pendingElement.textContent = '0';
            return;
        }

        const total = this.app.receivedPackages.length;
        const processed = this.app.receivedPackages.filter(pkg => pkg.status === 'processed').length;
        const pending = total - processed;

        if (totalElement) totalElement.textContent = total;
        if (processedElement) processedElement.textContent = processed;
        if (pendingElement) pendingElement.textContent = pending;

        // 수신 패키지 카운트도 업데이트
        const countElement = document.getElementById('received-packages-count');
        if (countElement) countElement.textContent = total;
    }

    renderPackageCard(pkg) {
        const totalItems = Object.values(pkg.packages.module).flat().length +
                          Object.values(pkg.packages.llt).flat().length +
                          Object.values(pkg.packages.material).flat().length;

        return `
            <div class="package-wrapper mb-4" data-package-id="${pkg.id}">
                <!-- 패키지 카드 -->
                <div id="package-card-${pkg.id}" class="package-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h4 class="text-lg font-semibold text-gray-800">${pkg.packageNumber}</h4>
                                <span class="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                    <i class="fas fa-check-circle mr-1"></i>${pkg.status === 'received' ? '수신완료' : pkg.status}
                                </span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><i class="fas fa-user text-blue-500 mr-1"></i>결재자: ${pkg.requester.name}</div>
                                <div><i class="fas fa-clock text-green-500 mr-1"></i>수신일: ${new Date(pkg.receivedDate).toLocaleDateString('ko-KR')}</div>
                            </div>
                        </div>
                        <div class="text-right bg-blue-50 rounded-lg p-3 min-w-20">
                            <div class="text-xs text-blue-600 font-medium">총 아이템</div>
                            <div class="text-xl font-bold text-blue-700">${totalItems}</div>
                            <div class="text-xs text-blue-500">개</div>
                        </div>
                    </div>

                    <!-- 패키지 통계 -->
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="text-center p-3 bg-purple-50 rounded-lg">
                            <div class="text-xs text-purple-600">모듈</div>
                            <div class="text-lg font-semibold text-purple-800">
                                ${Object.keys(pkg.packages.module).length}
                            </div>
                        </div>
                        <div class="text-center p-3 bg-orange-50 rounded-lg">
                            <div class="text-xs text-orange-600">LLT</div>
                            <div class="text-lg font-semibold text-orange-800">
                                ${Object.keys(pkg.packages.llt).length}
                            </div>
                        </div>
                        <div class="text-center p-3 bg-blue-50 rounded-lg">
                            <div class="text-xs text-blue-600">서플라이어</div>
                            <div class="text-lg font-semibold text-blue-800">
                                ${Object.keys(pkg.packages.material).length}
                            </div>
                        </div>
                    </div>

                    <!-- 액션 버튼들 -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button onclick="toggleSupplierPackageDetails('${pkg.id}')" 
                                id="detail-btn-${pkg.id}"
                                class="detail-btn bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                            <i class="fas fa-chevron-down mr-1"></i>상세보기
                        </button>
                        <button onclick="downloadPackageZip('${pkg.id}')" 
                                class="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                            <i class="fas fa-download mr-1"></i>다운로드
                        </button>
                        <button onclick="sendPackageEmail('${pkg.id}')" 
                                class="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors">
                            <i class="fas fa-envelope mr-1"></i>메일발송
                        </button>
                        <button onclick="managePO('${pkg.id}')" 
                                class="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                            <i class="fas fa-file-contract mr-1"></i>PO관리
                        </button>
                    </div>
                </div>
                
                <!-- 상세 정보 영역 (각 패키지 카드 바로 아래, 동적으로 내용 채워짐) -->
                <div id="details-${pkg.id}" class="package-details hidden border border-gray-200 border-t-0 rounded-b-lg bg-gray-50">
                    <!-- 내용은 toggleSupplierPackageDetails에서 동적으로 생성됩니다 -->
                    <div class="p-6 text-center text-gray-500">
                        <i class="fas fa-spinner fa-spin mr-2"></i>상세 정보 로딩 중...
                    </div>
                </div>
            </div>
        `;
    }

    attachPackageCardEvents() {
        // 이벤트는 전역 함수로 처리
        console.log('패키지 카드 이벤트 연결 완료');
    }

    loadSupplierList() {
        const container = document.getElementById('supplier-list-container');
        
        // 확장된 서플라이어 데이터
        const suppliers = this.getSupplierDatabase();

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${suppliers.map(supplier => `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h5 class="font-semibold text-gray-800">${supplier.name}</h5>
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-star text-yellow-500"></i>
                                <span class="text-sm font-medium">${supplier.rating}</span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${supplier.type}</p>
                        <p class="text-xs text-gray-500 mb-3">${supplier.contact}</p>
                        <button onclick="manageSupplier('${supplier.id}')" 
                                class="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                            관리하기
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    findPackageById(packageId) {
        return this.app.receivedPackages?.find(pkg => pkg.id === packageId);
    }

    viewPackageDetails(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) {
            this.app.showToast('패키지를 찾을 수 없습니다.', 'error');
            return;
        }

        // 현재 토글된 패키지와 같은 경우 닫기
        if (this.activePackageId === packageId) {
            this.closePackageDetail();
            return;
        }

        // 다른 패키지가 열려있으면 먼저 닫기
        if (this.activePackageId) {
            this.closePackageDetail();
        }

        // 새로운 패키지 토글 열기
        this.selectedPackage = pkg;
        this.activePackageId = packageId;
        this.showPackageDetailToggle(pkg);
    }

    showPackageDetailToggle(pkg) {
        // 패키지 카드에 활성 상태 추가
        this.updatePackageCardState(pkg.id, true);
        
        // 토글 영역 내용 업데이트
        document.getElementById('toggle-package-title').textContent = pkg.packageNumber;
        document.getElementById('toggle-package-requester').textContent = pkg.requester.name;
        document.getElementById('toggle-package-date').textContent = new Date(pkg.receivedDate).toLocaleString('ko-KR');
        
        // BOM 트리 구조 표시
        const bomContainer = document.getElementById('toggle-package-bom-tree');
        bomContainer.innerHTML = this.renderBOMTree(pkg.packages);

        // 토글 영역 표시
        const toggleArea = document.getElementById('package-detail-toggle');
        toggleArea.classList.remove('hidden');
        
        // 부드럽게 스크롤하여 토글 영역으로 이동
        setTimeout(() => {
            toggleArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 드롭다운 이벤트 설정
            this.setupSupplierDropdownEvents();
        }, 100);
    }

    downloadPackageZip(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) {
            this.app.showToast('패키지를 찾을 수 없습니다.', 'error');
            return;
        }

        // 실제로는 서버에서 ZIP 파일을 생성하지만, 여기서는 시뮬레이션
        this.app.showLoading(true, 'ZIP 파일 생성 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            
            // 시뮬레이션: ZIP 파일 다운로드
            const zipContent = this.generateZipContent(pkg);
            const blob = new Blob([zipContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pkg.packageNumber}_Package.txt`; // 실제로는 .zip 파일
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.app.showToast('패키지 ZIP 파일이 다운로드되었습니다.', 'success');
        }, 2000);
    }

    sendPackageEmail(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) {
            this.app.showToast('패키지를 찾을 수 없습니다.', 'error');
            return;
        }

        this.showEmailModal(pkg);
    }

    generateEmailBody(pkg) {
        const packageUrl = `https://cswind.com/packages/${pkg.packageNumber}`;
        
        return `
안녕하세요,

CS Wind에서 ${pkg.packageNumber} 패키지 도면 및 사양서를 발송드립니다.

■ 패키지 정보
- 패키지 번호: ${pkg.packageNumber}
- 생성일: ${new Date(pkg.receivedDate).toLocaleDateString('ko-KR')}
- 총 아이템: ${Object.values(pkg.packages.module).flat().length + Object.values(pkg.packages.llt).flat().length + Object.values(pkg.packages.material).flat().length}개

■ 접속 링크
${packageUrl}

■ 다운로드
첨부된 ZIP 파일을 확인해주시기 바랍니다.

감사합니다.
CS Wind R&D팀
        `;
    }

    managePO(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) return;

        // PO 관리 탭으로 이동
        this.app.showToast(`${pkg.packageNumber} 관련 PO들을 PO 관리 탭에서 확인하세요.`, 'info');
        
        // PO 관리 탭으로 전환
        if (this.app.switchTab) {
            this.app.switchTab('mto');
        }
    }

    manageSupplier(supplierId) {
        this.app.showToast(`서플라이어 ${supplierId} 관리 페이지로 이동합니다.`, 'info');
    }

    // BOM 트리 렌더링
    renderBOMTree(packages) {
        let html = '<div class="space-y-6">';

        // 모듈 패키지
        if (Object.keys(packages.module).length > 0) {
            html += '<div class="border border-purple-200 rounded-lg p-4 bg-purple-50">';
            html += '<h4 class="font-semibold text-purple-800 mb-3 flex items-center">';
            html += '<i class="fas fa-puzzle-piece mr-2"></i>모듈 패키지</h4>';
            
            Object.entries(packages.module).forEach(([moduleKey, items]) => {
                html += `<div class="mb-4 bg-white rounded p-3 border border-purple-100">`;
                html += `<h5 class="font-medium text-gray-800 mb-2">${moduleKey}</h5>`;
                html += '<div class="space-y-2">';
                items.forEach((item, index) => {
                    html += this.renderBOMItem(item, `module-${moduleKey}-${index}`);
                });
                html += '</div></div>';
            });
            html += '</div>';
        }

        // LLT 패키지
        if (Object.keys(packages.llt).length > 0) {
            html += '<div class="border border-orange-200 rounded-lg p-4 bg-orange-50">';
            html += '<h4 class="font-semibold text-orange-800 mb-3 flex items-center">';
            html += '<i class="fas fa-layer-group mr-2"></i>LLT 패키지</h4>';
            
            Object.entries(packages.llt).forEach(([lltKey, items]) => {
                html += `<div class="mb-4 bg-white rounded p-3 border border-orange-100">`;
                html += `<h5 class="font-medium text-gray-800 mb-2">${lltKey}</h5>`;
                html += '<div class="space-y-2">';
                items.forEach((item, index) => {
                    html += this.renderBOMItem(item, `llt-${lltKey}-${index}`);
                });
                html += '</div></div>';
            });
            html += '</div>';
        }

        // 자재 특성별 패키지
        if (Object.keys(packages.material).length > 0) {
            html += '<div class="border border-blue-200 rounded-lg p-4 bg-blue-50">';
            html += '<h4 class="font-semibold text-blue-800 mb-3 flex items-center">';
            html += '<i class="fas fa-industry mr-2"></i>자재 특성별 패키지</h4>';
            
            Object.entries(packages.material).forEach(([supplier, items]) => {
                html += `<div class="mb-4 bg-white rounded p-3 border border-blue-100">`;
                html += `<h5 class="font-medium text-gray-800 mb-2">${supplier}</h5>`;
                html += '<div class="space-y-2">';
                items.forEach((item, index) => {
                    html += this.renderBOMItem(item, `material-${supplier}-${index}`);
                });
                html += '</div></div>';
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    renderBOMItem(item, itemIndex = 0) {
        const drawingLink = item.drawingFile ? 
            `<button onclick="viewDrawing('${item.drawingFile}')" class="text-blue-600 hover:text-blue-800 ml-2">
                <i class="fas fa-file-pdf"></i>
            </button>` : '';

        const itemId = itemIndex; // renderBOMItem에서 전달받은 itemIndex 사용 (예: 'module-Platform-0')
        const dropdownId = `supplier-dropdown-${itemId}`;
        
        // PO 상태 확인
        const poStatus = this.getItemPOStatus(this.selectedPackage?.id, itemId);
        const isPOCreated = poStatus === 'po_created';
        
        return `
            <div class="flex items-center justify-between p-3 rounded transition-colors border border-gray-200 ${
                isPOCreated ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
            }">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded font-medium">L${item.level || 1}</span>
                        <span class="font-medium text-gray-800">${item.partNumber}</span>
                        <span class="text-gray-600">${item.partName}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        재질: ${item.material || 'N/A'} | 수량: ${item.quantity || 1}
                        ${item.weight ? `| 무게: ${item.weight}kg` : ''}
                    </div>
                    
                    <!-- PO 상태 표시 -->
                    <div class="mt-2">
                        ${isPOCreated ? 
                            `<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                                <i class="fas fa-check-circle mr-1"></i>PO 생성 완료
                            </span>` :
                            `<span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                                <i class="fas fa-clock mr-1"></i>PO 미생성
                            </span>`
                        }
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${drawingLink}
                    
                    <!-- 아이템별 액션 버튼들 -->
                    <div class="flex items-center space-x-1">
                        <button onclick="downloadItemSpec('${itemId}')" 
                                title="아이템 사양서 다운로드"
                                class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="sendItemEmail('${itemId}')" 
                                title="아이템 정보 메일발송"
                                class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                    
                    <!-- 서플라이어 선택 드롭다운 -->
                    <div class="relative supplier-dropdown-container">
                        ${isPOCreated ? 
                            // PO 생성 완료시 Lock된 드롭다운
                            `<div class="flex items-center justify-between min-w-48 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md opacity-75 cursor-not-allowed">
                                <span class="text-gray-600 truncate">
                                    <i class="fas fa-lock text-red-500 mr-1"></i>PO 생성 완료
                                </span>
                                <i class="fas fa-lock text-red-400 ml-2"></i>
                            </div>` :
                            // PO 미생성시 활성화된 드롭다운
                            `<button onclick="toggleSupplierDropdown('${dropdownId}', '${itemId}')" 
                                    id="supplier-btn-${itemId}"
                                    class="flex items-center justify-between min-w-48 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                <span id="selected-supplier-${itemId}" class="text-gray-700 truncate">
                                    <i class="fas fa-robot text-blue-500 mr-1"></i>AI 추천 선택...
                                </span>
                                <i class="fas fa-chevron-down text-gray-400 ml-2 transition-transform duration-200" id="chevron-${itemId}"></i>
                            </button>`
                        }
                        
                        <!-- 드롭다운 메뉴 (PO 미생성시만 표시) -->
                        ${!isPOCreated ? 
                            `<div id="${dropdownId}" 
                                 class="supplier-dropdown absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 hidden">
                                <div class="p-2 border-b border-gray-100 bg-gray-50">
                                    <div class="flex items-center text-xs text-gray-600">
                                        <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                                        AI 매칭 결과 (카테고리: <span class="font-medium text-blue-600">${this.getItemCategory(item)}</span>)
                                    </div>
                                </div>
                                <div class="max-h-64 overflow-y-auto" id="supplier-list-${itemId}">
                                    <!-- 동적으로 서플라이어 목록 로드 -->
                                </div>
                            </div>` : ''
                        }
                    </div>

                    <span class="text-xs px-2 py-1 rounded font-medium ${
                        item.specialCategory === 'module' ? 'bg-purple-100 text-purple-700' :
                        item.specialCategory === 'llt' ? 'bg-orange-100 text-orange-700' :
                        item.specialCategory === '전장품' ? 'bg-green-100 text-green-700' :
                        item.specialCategory === '고강도 강재' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                    }">${this.getItemCategory(item)}</span>
                </div>
            </div>
        `;
    }

    // ZIP 컨텐츠 생성
    generateZipContent(pkg) {
        let content = `패키지 번호: ${pkg.packageNumber}\n`;
        content += `생성일: ${new Date(pkg.receivedDate).toLocaleString('ko-KR')}\n`;
        content += `결재자: ${pkg.requester.name}\n\n`;
        
        content += '=== BOM 구조 ===\n\n';
        
        // 모듈 패키지 정보
        Object.entries(pkg.packages.module).forEach(([moduleKey, items]) => {
            content += `[모듈] ${moduleKey}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        // LLT 패키지 정보
        Object.entries(pkg.packages.llt).forEach(([lltKey, items]) => {
            content += `[LLT] ${lltKey}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        // 자재 특성별 패키지 정보
        Object.entries(pkg.packages.material).forEach(([supplier, items]) => {
            content += `[서플라이어] ${supplier}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        return content;
    }

    // 이메일 모달 표시
    showEmailModal(pkg) {
        const modal = document.getElementById('email-modal');
        if (!modal) {
            this.createEmailModal();
        }

        // 자동 이메일 내용 생성
        const emailContent = this.generateEmailContent(pkg);
        document.getElementById('email-to').value = '';
        document.getElementById('email-subject').value = `[CS Wind] 자재 특성별 패키지 전송 - ${pkg.packageNumber}`;
        document.getElementById('email-body').value = emailContent;
        
        document.getElementById('email-modal').classList.add('show');
    }

    generateEmailContent(pkg) {
        const accessLink = `${window.location.origin}/supplier-access?package=${pkg.packageNumber}&token=${this.generateAccessToken()}`;
        
        return `안녕하세요,\n\n씨에스윈드 SCM팀에서 자재 특성별 패키지를 전송드립니다.\n\n` +
               `패키지 정보:\n` +
               `- 패키지 번호: ${pkg.packageNumber}\n` +
               `- 생성일: ${new Date(pkg.receivedDate).toLocaleString('ko-KR')}\n` +
               `- 총 아이템 수: ${this.getTotalItems(pkg.packages)}개\n\n` +
               `패키지 내용:\n` +
               `- 모듈 패키지: ${Object.keys(pkg.packages.module).length}개\n` +
               `- LLT 패키지: ${Object.keys(pkg.packages.llt).length}개\n` +
               `- 자재 특성별 패키지: ${Object.keys(pkg.packages.material).length}개\n\n` +
               `도면 및 상세 정보 접속 링크:\n${accessLink}\n\n` +
               `패키지 다운로드는 위 링크를 통해 가능하며,\n` +
               `PO 발행일 및 납기일 협의는 시스템을 통해 진행해 주시기 바랍니다.\n\n` +
               `문의사항이 있으시면 언제든 연락주시기 바랍니다.\n\n` +
               `감사합니다.\n\n` +
               `씨에스윈드 SCM팀`;
    }

    getTotalItems(packages) {
        return Object.values(packages.module).flat().length +
               Object.values(packages.llt).flat().length +
               Object.values(packages.material).flat().length;
    }

    generateAccessToken() {
        return Math.random().toString(36).substr(2, 16).toUpperCase();
    }

    // 모달 생성 함수들 (기존 패키지 상세 모달은 토글로 대체됨)
    // createPackageDetailModal() 함수는 더 이상 사용하지 않음

    createEmailModal() {
        const modal = document.createElement('div');
        modal.id = 'email-modal';
        modal.className = 'pdf-modal';
        modal.innerHTML = `
            <div class="pdf-modal-content" style="max-width: 700px;">
                <button class="pdf-modal-close" onclick="document.getElementById('email-modal').classList.remove('show')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pdf-modal-header">
                    <h3 class="text-xl font-bold text-gray-800">이메일 발송</h3>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">받는 사람</label>
                        <input type="email" id="email-to" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                               placeholder="supplier@example.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
                        <input type="text" id="email-subject" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
                        <textarea id="email-body" rows="12" class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div class="flex space-x-2 pt-4">
                        <button id="send-email-btn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <i class="fas fa-paper-plane mr-2"></i>이메일 발송
                        </button>
                        <button onclick="document.getElementById('email-modal').classList.remove('show')" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                            취소
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 이메일 발송 이벤트 연결
        document.getElementById('send-email-btn').addEventListener('click', () => this.sendEmail());
    }

    sendEmail() {
        const to = document.getElementById('email-to').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;

        if (!to || !subject || !body) {
            this.app.showToast('모든 필드를 입력해주세요.', 'warning');
            return;
        }

        // 이메일 발송 시뮬레이션
        this.app.showLoading(true, '이메일 발송 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            document.getElementById('email-modal').classList.remove('show');
            this.app.showToast(`이메일이 ${to}로 발송되었습니다.`, 'success');
        }, 1500);
    }

    // PO 관리 모달 생성
    createPOModal(pkg) {
        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById('po-management-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'po-management-modal';
        modal.className = 'pdf-modal';
        modal.innerHTML = `
            <div class="pdf-modal-content" style="max-width: 900px; max-height: 90vh;">
                <button class="pdf-modal-close" onclick="document.getElementById('po-management-modal').classList.remove('show')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pdf-modal-header">
                    <h3 class="text-xl font-bold text-gray-800">PO 관리 및 일정 협의</h3>
                    <p class="text-sm text-gray-600">패키지: ${pkg.packageNumber}</p>
                </div>
                <div class="space-y-6">
                    <!-- PO 기본 정보 -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-800 mb-3">PO 기본 정보</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm text-gray-600">PO 번호</label>
                                <input type="text" id="po-number" class="w-full px-3 py-2 border rounded-md" 
                                       value="PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}" readonly>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600">패키지 번호</label>
                                <input type="text" class="w-full px-3 py-2 border rounded-md bg-gray-100" 
                                       value="${pkg.packageNumber}" readonly>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600">요청 납기일</label>
                                <input type="date" id="requested-delivery" class="w-full px-3 py-2 border rounded-md" 
                                       value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600">PO 상태</label>
                                <select id="po-status" class="w-full px-3 py-2 border rounded-md">
                                    <option value="draft">초안</option>
                                    <option value="sent">서플라이어 전송</option>
                                    <option value="negotiation">협의 중</option>
                                    <option value="approved">승인 완료</option>
                                    <option value="in-production">제작 중</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- PO 아이템 목록 -->
                    <div class="bg-white border rounded-lg">
                        <div class="px-4 py-3 border-b">
                            <h4 class="font-medium text-gray-800">PO 아이템 목록</h4>
                        </div>
                        <div class="max-h-64 overflow-y-auto" id="po-items-list">
                            ${this.renderPOItems(pkg)}
                        </div>
                    </div>

                    <!-- 협의 이력 -->
                    <div class="bg-white border rounded-lg">
                        <div class="px-4 py-3 border-b">
                            <h4 class="font-medium text-gray-800">협의 이력</h4>
                        </div>
                        <div class="p-4" id="negotiation-history">
                            <div class="space-y-2">
                                <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                    <div class="flex justify-between text-sm">
                                        <span class="font-medium">SCM팀</span>
                                        <span class="text-gray-500">${new Date().toLocaleDateString('ko-KR')}</span>
                                    </div>
                                    <div class="text-gray-700 mt-1">PO 생성 및 납기일 요청</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 새로운 협의 추가 -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-800 mb-3">새로운 협의 사항</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">납기일 변경</label>
                                <input type="date" id="new-delivery-date" class="w-full px-3 py-2 border rounded-md">
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">협의 메모</label>
                                <textarea id="negotiation-memo" class="w-full px-3 py-2 border rounded-md" rows="3" 
                                         placeholder="협의 내용을 입력하세요..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- 액션 버튼들 -->
                    <div class="flex space-x-3 pt-4 border-t">
                        <button onclick="csWindApp.supplierManager.savePO('${pkg.id}')" 
                                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <i class="fas fa-save mr-2"></i>PO 저장
                        </button>
                        <button onclick="csWindApp.supplierManager.sendPOToSupplier('${pkg.id}')" 
                                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                            <i class="fas fa-paper-plane mr-2"></i>서플라이어 전송
                        </button>
                        <button onclick="csWindApp.supplierManager.addNegotiation('${pkg.id}')" 
                                class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                            <i class="fas fa-comment mr-2"></i>협의 추가
                        </button>
                        <button onclick="document.getElementById('po-management-modal').classList.remove('show')" 
                                class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showPOModal(pkg) {
        document.getElementById('po-management-modal').classList.add('show');
    }

    renderPOItems(pkg) {
        const allItems = [
            ...Object.values(pkg.packages.module).flat(),
            ...Object.values(pkg.packages.llt).flat(), 
            ...Object.values(pkg.packages.material).flat()
        ];

        return allItems.map((item, index) => `
            <div class="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded">L${item.level || 1}</span>
                        <span class="font-medium">${item.partNumber}</span>
                        <span class="text-gray-600">${item.partName}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        재질: ${item.material || 'N/A'} | 수량: ${item.quantity || 1}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium">₩${(Math.random() * 100000 + 50000).toFixed(0)}</div>
                    <div class="text-xs text-gray-500">단가 (추정)</div>
                </div>
            </div>
        `).join('');
    }

    savePO(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) return;

        const poData = {
            poNumber: document.getElementById('po-number').value,
            packageId: packageId,
            requestedDelivery: document.getElementById('requested-delivery').value,
            status: document.getElementById('po-status').value,
            savedDate: new Date().toISOString()
        };

        // PO 저장 시뮬레이션
        this.app.showToast('PO가 저장되었습니다.', 'success');
        console.log('PO 저장됨:', poData);
    }

    sendPOToSupplier(packageId) {
        const pkg = this.findPackageById(packageId);
        if (!pkg) return;

        this.app.showLoading(true, 'PO를 서플라이어에게 전송 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            this.app.showToast('PO가 서플라이어에게 전송되었습니다.', 'success');
            
            // PO 상태 업데이트
            document.getElementById('po-status').value = 'sent';
            this.addNegotiationHistory('SCM팀', 'PO 서플라이어 전송 완료');
        }, 2000);
    }

    addNegotiation(packageId) {
        const newDate = document.getElementById('new-delivery-date').value;
        const memo = document.getElementById('negotiation-memo').value;

        if (!newDate && !memo) {
            this.app.showToast('납기일 또는 협의 메모를 입력해주세요.', 'warning');
            return;
        }

        let message = '';
        if (newDate) {
            message += `납기일 변경 요청: ${newDate}`;
        }
        if (memo) {
            if (message) message += ' / ';
            message += memo;
        }

        this.addNegotiationHistory('SCM팀', message);
        
        // 입력 필드 초기화
        document.getElementById('new-delivery-date').value = '';
        document.getElementById('negotiation-memo').value = '';
        
        this.app.showToast('협의 사항이 추가되었습니다.', 'success');
    }

    addNegotiationHistory(actor, action) {
        const historyContainer = document.getElementById('negotiation-history');
        const newEntry = document.createElement('div');
        newEntry.className = 'bg-green-50 p-3 rounded border-l-4 border-green-500';
        newEntry.innerHTML = `
            <div class="flex justify-between text-sm">
                <span class="font-medium">${actor}</span>
                <span class="text-gray-500">${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}</span>
            </div>
            <div class="text-gray-700 mt-1">${action}</div>
        `;
        historyContainer.appendChild(newEntry);
    }

    // 패키지 카드 상태 업데이트
    updatePackageCardState(packageId, isActive) {
        // 모든 패키지 카드의 활성 상태 초기화
        document.querySelectorAll('.package-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelectorAll('.detail-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        });

        if (isActive) {
            // 선택된 패키지 카드 활성화
            const packageCard = document.getElementById(`package-card-${packageId}`);
            const detailBtn = document.getElementById(`detail-btn-${packageId}`);
            
            if (packageCard) {
                packageCard.classList.add('active');
            }
            if (detailBtn) {
                const icon = detailBtn.querySelector('i');
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        }
    }

    // 패키지 상세 토글 닫기
    closePackageDetail() {
        const toggleArea = document.getElementById('package-detail-toggle');
        if (toggleArea) {
            toggleArea.classList.add('hidden');
        }

        // 패키지 카드 상태 초기화
        if (this.activePackageId) {
            this.updatePackageCardState(this.activePackageId, false);
        }

        this.activePackageId = null;
        this.selectedPackage = null;
    }

    // 서플라이어 데이터베이스
    getSupplierDatabase() {
        return [
            {
                id: 'SUP001', 
                name: '포스코강판', 
                type: 'LLT/고강도 강재 전문', 
                rating: 4.8, 
                contact: 'posco@example.com',
                specialties: ['LLT', '고강도 강재', '플랜지류'],
                materialExpertise: {
                    'LLT': 0.95,
                    '고강도 강재': 0.98,
                    '플랜지류': 0.85,
                    '모듈단위 조립품': 0.75,
                    'Small Parts': 0.60,
                    'Large Parts': 0.80,
                    '전장품': 0.05,
                    '기타': 0.25
                }
            },
            {
                id: 'SUP002', 
                name: '현대제철', 
                type: '구조강재/대형가공', 
                rating: 4.7, 
                contact: 'hyundai@example.com',
                specialties: ['LLT', 'Large Parts', '모듈단위 조립품'],
                materialExpertise: {
                    'LLT': 0.90,
                    '고강도 강재': 0.85,
                    '플랜지류': 0.70,
                    '모듈단위 조립품': 0.92,
                    'Small Parts': 0.40,
                    'Large Parts': 0.95,
                    '전장품': 0.03,
                    '기타': 0.30
                }
            },
            {
                id: 'SUP003', 
                name: '동국제강', 
                type: '특수강/정밀가공', 
                rating: 4.6, 
                contact: 'dongkuk@example.com',
                specialties: ['고강도 강재', 'Small Parts', '플랜지류'],
                materialExpertise: {
                    'LLT': 0.75,
                    '고강도 강재': 0.93,
                    '플랜지류': 0.88,
                    '모듈단위 조립품': 0.65,
                    'Small Parts': 0.90,
                    'Large Parts': 0.60,
                    '전장품': 0.08,
                    '기타': 0.35
                }
            },
            {
                id: 'SUP004', 
                name: '케이씨테크', 
                type: '전장품/자동화시스템', 
                rating: 4.5, 
                contact: 'kctech@example.com',
                specialties: ['전장품', 'Small Parts', '기타'],
                materialExpertise: {
                    'LLT': 0.15,
                    '고강도 강재': 0.10,
                    '플랜지류': 0.20,
                    '모듈단위 조립품': 0.30,
                    'Small Parts': 0.75,
                    'Large Parts': 0.25,
                    '전장품': 0.96,
                    '기타': 0.80
                }
            },
            {
                id: 'SUP005', 
                name: '한국도료', 
                type: '표면처리/코팅', 
                rating: 4.4, 
                contact: 'koreapaints@example.com',
                specialties: ['기타', 'Large Parts'],
                materialExpertise: {
                    'LLT': 0.25,
                    '고강도 강재': 0.30,
                    '플랜지류': 0.35,
                    '모듈단위 조립품': 0.60,
                    'Small Parts': 0.40,
                    'Large Parts': 0.70,
                    '전장품': 0.15,
                    '기타': 0.92
                }
            },
            {
                id: 'SUP006', 
                name: '대한중공업', 
                type: '대형구조물/조립', 
                rating: 4.9, 
                contact: 'daehan@example.com',
                specialties: ['Large Parts', '모듈단위 조립품', 'LLT'],
                materialExpertise: {
                    'LLT': 0.88,
                    '고강도 강재': 0.82,
                    '플랜지류': 0.90,
                    '모듈단위 조립품': 0.97,
                    'Small Parts': 0.50,
                    'Large Parts': 0.99,
                    '전장품': 0.12,
                    '기타': 0.40
                }
            },
            {
                id: 'SUP007', 
                name: '삼성전기', 
                type: '전기시스템/제어', 
                rating: 4.6, 
                contact: 'samsung@example.com',
                specialties: ['전장품', 'Small Parts'],
                materialExpertise: {
                    'LLT': 0.05,
                    '고강도 강재': 0.02,
                    '플랜지류': 0.10,
                    '모듈단위 조립품': 0.20,
                    'Small Parts': 0.85,
                    'Large Parts': 0.15,
                    '전장품': 0.98,
                    '기타': 0.60
                }
            },
            {
                id: 'SUP008', 
                name: '효성중공업', 
                type: '플랜지/연결부품', 
                rating: 4.7, 
                contact: 'hyosung@example.com',
                specialties: ['플랜지류', 'Small Parts', 'LLT'],
                materialExpertise: {
                    'LLT': 0.78,
                    '고강도 강재': 0.80,
                    '플랜지류': 0.96,
                    '모듈단위 조립품': 0.70,
                    'Small Parts': 0.88,
                    'Large Parts': 0.65,
                    '전장품': 0.08,
                    '기타': 0.30
                }
            }
        ];
    }

    // AI 기반 서플라이어 매칭
    getRecommendedSuppliers(item) {
        const suppliers = this.getSupplierDatabase();
        const itemCategory = this.getItemCategory(item);
        
        // 각 서플라이어의 정합성 계산
        const suppliersWithScore = suppliers.map(supplier => {
            let matchScore = supplier.materialExpertise[itemCategory] || 0.1;
            
            // 추가 매칭 요소들
            // 1. 키워드 매칭 보너스
            const keywordBonus = this.calculateKeywordMatch(item, supplier.specialties);
            matchScore += keywordBonus * 0.1;
            
            // 2. 재질 매칭 보너스
            const materialBonus = this.calculateMaterialMatch(item, supplier);
            matchScore += materialBonus * 0.05;
            
            // 3. 평점 영향
            const ratingBonus = (supplier.rating - 4.0) * 0.02;
            matchScore += ratingBonus;
            
            // 최종 점수를 0-1 범위로 제한
            matchScore = Math.min(1.0, Math.max(0.0, matchScore));
            
            return {
                ...supplier,
                matchScore: matchScore,
                matchPercentage: Math.round(matchScore * 100)
            };
        });
        
        // 매칭 점수순으로 정렬 (내림차순)
        return suppliersWithScore.sort((a, b) => b.matchScore - a.matchScore);
    }

    // 아이템 카테고리 결정
    getItemCategory(item) {
        // BOM 분석 시스템의 분류 결과 사용
        if (item.specialCategory) {
            return item.specialCategory;
        }
        
        // 기본 분류 로직 (간단한 키워드 기반)
        const partName = (item.partName || '').toLowerCase();
        const partNumber = (item.partNumber || '').toLowerCase();
        const material = (item.material || '').toLowerCase();
        
        if (partName.includes('cable') || partName.includes('light') || partName.includes('케이블') || partName.includes('조명')) {
            return '전장품';
        }
        if (material.includes('s690') || material.includes('고강도')) {
            return '고강도 강재';
        }
        if (partName.includes('flange') || partName.includes('플랜지')) {
            return '플랜지류';
        }
        if (partName.includes('platform') || partName.includes('ladder') || partName.includes('플랫폼')) {
            return '모듈단위 조립품';
        }
        if (item.weight && item.weight < 10) {
            return 'Small Parts';
        }
        if (item.weight && item.weight > 50) {
            return 'Large Parts';
        }
        
        return 'LLT'; // 기본값
    }

    // 키워드 매칭 계산
    calculateKeywordMatch(item, specialties) {
        const itemText = `${item.partName} ${item.partNumber} ${item.material}`.toLowerCase();
        let matches = 0;
        
        specialties.forEach(specialty => {
            const specialtyKeywords = {
                'LLT': ['steel', 'structure', '구조', '강재'],
                '고강도 강재': ['s690', 'high', 'strength', '고강도', '특수강'],
                '플랜지류': ['flange', 'connection', '플랜지', '연결'],
                '모듈단위 조립품': ['platform', 'ladder', 'assembly', '플랫폼', '사다리', '조립'],
                'Small Parts': ['bracket', 'bolt', 'small', '브라켓', '볼트', '소형'],
                'Large Parts': ['large', 'heavy', 'frame', '대형', '프레임'],
                '전장품': ['electrical', 'cable', 'light', 'junction', '전기', '케이블', '조명'],
                '기타': ['paint', 'coating', 'other', '도료', '코팅', '기타']
            };
            
            const keywords = specialtyKeywords[specialty] || [];
            keywords.forEach(keyword => {
                if (itemText.includes(keyword)) {
                    matches++;
                }
            });
        });
        
        return Math.min(matches * 0.2, 1.0);
    }

    // 재질 매칭 계산
    calculateMaterialMatch(item, supplier) {
        const material = (item.material || '').toLowerCase();
        let bonus = 0;
        
        // 재질별 서플라이어 적합성
        if (material.includes('steel') || material.includes('강재')) {
            if (supplier.specialties.includes('LLT') || supplier.specialties.includes('고강도 강재')) {
                bonus = 0.3;
            }
        }
        
        if (material.includes('s690') || material.includes('고강도')) {
            if (supplier.specialties.includes('고강도 강재')) {
                bonus = 0.5;
            }
        }
        
        return bonus;
    }

    // 서플라이어 드롭다운 이벤트 설정
    setupSupplierDropdownEvents() {
        // 문서 클릭으로 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.supplier-dropdown-container')) {
                document.querySelectorAll('.supplier-dropdown').forEach(dropdown => {
                    dropdown.classList.add('hidden');
                    const dropdownId = dropdown.id;
                    const itemId = dropdownId.replace('supplier-dropdown-', '');
                    const chevron = document.getElementById(`chevron-${itemId}`);
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                });
            }
        });
    }

    // 서플라이어 드롭다운 토글
    toggleSupplierDropdown(dropdownId, itemId) {
        const dropdown = document.getElementById(dropdownId);
        const chevron = document.getElementById(`chevron-${itemId}`);
        const supplierList = document.getElementById(`supplier-list-${itemId}`);
        
        if (!dropdown) return;

        // 다른 드롭다운들 닫기
        document.querySelectorAll('.supplier-dropdown').forEach(otherDropdown => {
            if (otherDropdown.id !== dropdownId) {
                otherDropdown.classList.add('hidden');
                const otherId = otherDropdown.id.replace('supplier-dropdown-', '');
                const otherChevron = document.getElementById(`chevron-${otherId}`);
                if (otherChevron) {
                    otherChevron.style.transform = 'rotate(0deg)';
                }
            }
        });

        // 현재 드롭다운 토글
        if (dropdown.classList.contains('hidden')) {
            // 드롭다운 열기
            dropdown.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
            
            // 서플라이어 목록 로드
            this.loadSupplierOptionsForItem(itemId, supplierList);
        } else {
            // 드롭다운 닫기
            dropdown.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
        }
    }

    // 아이템별 서플라이어 옵션 로드
    loadSupplierOptionsForItem(itemId, container) {
        if (!this.selectedPackage) return;

        // 아이템 정보 찾기
        const item = this.findItemById(itemId);
        if (!item) {
            container.innerHTML = '<div class="p-3 text-center text-gray-500">아이템 정보를 찾을 수 없습니다.</div>';
            return;
        }

        // AI 추천 서플라이어 가져오기
        const recommendedSuppliers = this.getRecommendedSuppliers(item);
        
        if (recommendedSuppliers.length === 0) {
            container.innerHTML = '<div class="p-3 text-center text-gray-500">추천 가능한 서플라이어가 없습니다.</div>';
            return;
        }

        // 서플라이어 목록 렌더링
        container.innerHTML = recommendedSuppliers.map(supplier => `
            <div onclick="selectSupplier('${itemId}', '${supplier.id}', '${supplier.name}', ${supplier.matchPercentage})" 
                 class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="font-medium text-gray-800">${supplier.name}</span>
                        <span class="text-xs px-2 py-1 rounded-full ${
                            supplier.matchPercentage >= 90 ? 'bg-green-100 text-green-800' :
                            supplier.matchPercentage >= 70 ? 'bg-blue-100 text-blue-800' :
                            supplier.matchPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }">
                            ${supplier.matchPercentage}% 일치
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${supplier.type} | ★${supplier.rating}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        전문분야: ${supplier.specialties.join(', ')}
                    </div>
                </div>
                <div class="ml-2">
                    <i class="fas fa-chevron-right text-gray-300"></i>
                </div>
            </div>
        `).join('');
    }

    // 아이템 ID로 아이템 찾기
    findItemById(itemId) {
        if (!this.selectedPackage) return null;

        const packages = this.selectedPackage.packages;
        
        // 모든 패키지에서 아이템 검색
        const allItems = [
            ...Object.values(packages.module).flat(),
            ...Object.values(packages.llt).flat(),
            ...Object.values(packages.material).flat()
        ];
        
        // itemId에서 인덱스 추출하여 해당 아이템 반환
        const parts = itemId.split('-');
        if (parts.length >= 4) {
            const category = parts[0];
            const subcategory = parts[1];
            const index = parseInt(parts[parts.length - 1]);
            
            if (category === 'module' && packages.module[subcategory]) {
                return packages.module[subcategory][index] || null;
            } else if (category === 'llt' && packages.llt[subcategory]) {
                return packages.llt[subcategory][index] || null;
            } else if (category === 'material' && packages.material[subcategory]) {
                return packages.material[subcategory][index] || null;
            }
        }
        
        return allItems[0] || null; // 기본값
    }

    // 서플라이어 선택
    selectSupplier(itemId, supplierId, supplierName, matchPercentage) {
        const selectedSpan = document.getElementById(`selected-supplier-${itemId}`);
        const dropdown = document.getElementById(`supplier-dropdown-${itemId}`);
        const chevron = document.getElementById(`chevron-${itemId}`);
        
        if (selectedSpan) {
            selectedSpan.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <span class="truncate">${supplierName}</span>
                    <span class="text-xs px-2 py-1 rounded-full ml-2 ${
                        matchPercentage >= 90 ? 'bg-green-100 text-green-800' :
                        matchPercentage >= 70 ? 'bg-blue-100 text-blue-800' :
                        matchPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${matchPercentage}%
                    </span>
                </div>
            `;
        }
        
        // 드롭다운 닫기
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
        
        // 선택 완료 토스트
        this.app.showToast(`${supplierName} (${matchPercentage}% 일치) 선택완료`, 'success');
        
        // 선택 데이터 저장 (추후 PO 생성시 사용)
        this.saveSupplierSelection(itemId, supplierId, supplierName, matchPercentage);
    }

    // 서플라이어 선택 데이터 저장
    saveSupplierSelection(itemId, supplierId, supplierName, matchPercentage) {
        console.log('=== 서플라이어 선택 저장 ===');
        console.log('itemId:', itemId);
        console.log('supplierName:', supplierName);
        
        if (!this.selectedPackage.supplierSelections) {
            this.selectedPackage.supplierSelections = {};
        }
        
        this.selectedPackage.supplierSelections[itemId] = {
            supplierId: supplierId,
            supplierName: supplierName,
            matchPercentage: matchPercentage,
            selectedAt: new Date().toISOString()
        };
        
        console.log('업데이트된 서플라이어 선택 목록:', this.selectedPackage.supplierSelections);
        console.log('총 선택된 아이템 수:', Object.keys(this.selectedPackage.supplierSelections).length);
        
        // 선택 완료된 아이템 수 업데이트
        this.updateSelectedSuppliersCount();
    }

    // 선택 완료된 서플라이어 수 업데이트
    updateSelectedSuppliersCount() {
        if (!this.selectedPackage) return;
        
        const totalItemCount = this.getTotalPackageItemCount();
        const selectedCount = this.selectedPackage.supplierSelections ? 
            Object.keys(this.selectedPackage.supplierSelections).length : 0;
        
        // PO 생성 완료된 아이템 수 계산
        const poCreatedCount = this.getPOCreatedItemCount();
        const availableForSelection = selectedCount - poCreatedCount;
        
        const countElement = document.getElementById('selected-suppliers-count');
        if (countElement) {
            countElement.innerHTML = `
                <span class="text-green-600">${poCreatedCount}</span>개 PO 생성 완료, 
                <span class="text-blue-600">${availableForSelection}</span>개 선택 완료, 
                <span class="text-gray-600">${totalItemCount - selectedCount}</span>개 미선택
            `;
        }

        // 결재 요청 버튼 활성화/비활성화
        const submitBtn = document.getElementById('submit-approval-btn');
        if (submitBtn) {
            if (availableForSelection > 0) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
                submitBtn.innerHTML = `<i class="fas fa-paper-plane mr-2"></i>결재 요청 (${availableForSelection}개)`;
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.add('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
                submitBtn.innerHTML = `<i class="fas fa-paper-plane mr-2"></i>결재 요청`;
            }
        }
    }

    // PO 생성 완료된 아이템 수 계산
    getPOCreatedItemCount() {
        if (!this.selectedPackage || !this.app.packageItemStatus || !this.app.packageItemStatus[this.selectedPackage.id]) {
            return 0;
        }
        
        const packageStatus = this.app.packageItemStatus[this.selectedPackage.id];
        return Object.values(packageStatus).filter(status => status === 'po_created').length;
    }

    // 아이템별 다운로드
    downloadItemSpec(itemId) {
        const item = this.findItemById(itemId);
        if (!item) {
            this.app.showToast('아이템 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        // 아이템 사양서 생성
        const specContent = this.generateItemSpecification(item, itemId);
        
        const blob = new Blob([specContent], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.partNumber}_사양서.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.app.showToast(`${item.partNumber} 사양서가 다운로드되었습니다.`, 'success');
    }

    // 아이템별 메일 발송
    sendItemEmail(itemId) {
        const item = this.findItemById(itemId);
        if (!item) {
            this.app.showToast('아이템 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        // 선택된 서플라이어 정보 가져오기
        const supplierSelection = this.selectedPackage?.supplierSelections?.[itemId];
        const selectedSupplier = supplierSelection ? 
            this.getSupplierDatabase().find(s => s.id === supplierSelection.supplierId) : null;

        this.showItemEmailModal(item, selectedSupplier, itemId);
    }

    // 아이템 사양서 생성
    generateItemSpecification(item, itemId) {
        const supplierSelection = this.selectedPackage?.supplierSelections?.[itemId];
        const selectedSupplier = supplierSelection ? 
            this.getSupplierDatabase().find(s => s.id === supplierSelection.supplierId) : null;

        let spec = `=== 아이템 사양서 ===\n\n`;
        spec += `패키지 번호: ${this.selectedPackage?.packageNumber || 'N/A'}\n`;
        spec += `아이템 번호: ${item.partNumber}\n`;
        spec += `아이템 명: ${item.partName}\n`;
        spec += `레벨: ${item.level || 1}\n`;
        spec += `재질: ${item.material || 'N/A'}\n`;
        spec += `수량: ${item.quantity || 1}\n`;
        if (item.weight) spec += `무게: ${item.weight}kg\n`;
        if (item.dimensions) spec += `치수: ${item.dimensions}\n`;
        spec += `카테고리: ${this.getItemCategory(item)}\n\n`;

        if (selectedSupplier) {
            spec += `=== 선정된 서플라이어 ===\n`;
            spec += `업체명: ${selectedSupplier.name}\n`;
            spec += `전문분야: ${selectedSupplier.type}\n`;
            spec += `정합성: ${supplierSelection.matchPercentage}%\n`;
            spec += `평점: ${selectedSupplier.rating}★\n`;
            spec += `연락처: ${selectedSupplier.contact}\n`;
            spec += `선정일시: ${new Date(supplierSelection.selectedAt).toLocaleString('ko-KR')}\n\n`;
        }

        spec += `생성일시: ${new Date().toLocaleString('ko-KR')}\n`;
        spec += `생성자: SCM Manager\n`;
        
        return spec;
    }

    // 결재 요청 (부분 선택 허용)
    submitForApproval() {
        console.log('=== 결재 요청 시작 ===');
        console.log('선택된 패키지:', this.selectedPackage);
        
        if (!this.selectedPackage || !this.selectedPackage.supplierSelections) {
            this.app.showToast('선택된 서플라이어가 없습니다.', 'warning');
            return;
        }

        const selectionCount = Object.keys(this.selectedPackage.supplierSelections).length;
        console.log('서플라이어 선택 개수:', selectionCount);
        console.log('서플라이어 선택 데이터:', this.selectedPackage.supplierSelections);
        
        if (selectionCount === 0) {
            this.app.showToast('최소 1개 이상의 아이템에 대해 서플라이어를 선택해주세요.', 'warning');
            return;
        }

        // 전체 아이템 수 계산
        const totalItemCount = this.getTotalPackageItemCount();
        
        // 부분 선택 확인 및 알림
        if (selectionCount < totalItemCount) {
            const remainingCount = totalItemCount - selectionCount;
            this.app.showToast(`${selectionCount}개 아이템 결재 진행 (${remainingCount}개 아이템 미선택)`, 'info');
        }

        // 결재 프로세스 시작
        this.initializeApprovalProcess();
    }

    // 전체 패키지 아이템 수 계산
    getTotalPackageItemCount() {
        if (!this.selectedPackage || !this.selectedPackage.packages) return 0;
        
        const packages = this.selectedPackage.packages;
        return Object.values(packages.module || {}).flat().length +
               Object.values(packages.llt || {}).flat().length +
               Object.values(packages.material || {}).flat().length;
    }

    // 결재 프로세스 초기화
    initializeApprovalProcess() {
        console.log('=== 결재 프로세스 초기화 ===');
        
        const approvalData = {
            packageId: this.selectedPackage.id,
            packageNumber: this.selectedPackage.packageNumber,
            supplierSelections: this.selectedPackage.supplierSelections,
            approvalStatus: 'pending_scm_manager',
            currentApprover: 'SCM Manager',
            approvalSteps: [
                { step: 1, role: 'SCM Manager', name: '김철수', status: 'pending', timestamp: null },
                { step: 2, role: 'SCM Team Leader', name: '이영희', status: 'waiting', timestamp: null },
                { step: 3, role: 'Division Manager', name: '박민수', status: 'waiting', timestamp: null }
            ],
            createdAt: new Date().toISOString(),
            submittedBy: 'SCM Manager (현재 사용자)'
        };
        
        console.log('결재 데이터 생성:', approvalData);

        // 결재 데이터 저장
        if (!this.app.approvalRequests) {
            this.app.approvalRequests = [];
        }
        this.app.approvalRequests.push(approvalData);

        // 패키지 상태 업데이트
        this.selectedPackage.approvalStatus = 'pending_approval';
        this.selectedPackage.approvalData = approvalData;

        // UI 업데이트
        this.showApprovalStatus(approvalData);
        this.app.showToast('결재 요청이 제출되었습니다.', 'success');

        // 자동 승인 시뮬레이션 (개발용)
        setTimeout(() => this.simulateApprovalProcess(approvalData), 2000);
    }

    // 결재 상태 표시
    showApprovalStatus(approvalData) {
        const statusSection = document.getElementById('approval-status-section');
        const progressDiv = document.getElementById('approval-progress');
        
        if (!statusSection || !progressDiv) return;

        statusSection.classList.remove('hidden');
        
        progressDiv.innerHTML = approvalData.approvalSteps.map(step => `
            <div class="flex items-center justify-between p-2 rounded ${
                step.status === 'approved' ? 'bg-green-100 border border-green-200' :
                step.status === 'pending' ? 'bg-yellow-100 border border-yellow-200' :
                step.status === 'rejected' ? 'bg-red-100 border border-red-200' :
                'bg-gray-100 border border-gray-200'
            }">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.status === 'approved' ? 'bg-green-500 text-white' :
                        step.status === 'pending' ? 'bg-yellow-500 text-white' :
                        step.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-gray-400 text-white'
                    }">
                        ${step.status === 'approved' ? '✓' : 
                          step.status === 'rejected' ? '✗' : 
                          step.status === 'pending' ? '⏳' : step.step}
                    </div>
                    <div>
                        <div class="font-medium text-sm">${step.role}</div>
                        <div class="text-xs text-gray-600">${step.name}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${step.timestamp ? new Date(step.timestamp).toLocaleString('ko-KR') : 
                      step.status === 'pending' ? '승인 대기 중' : '대기'}
                </div>
            </div>
        `).join('');
    }

    // 결재 프로세스 시뮬레이션
    simulateApprovalProcess(approvalData) {
        let currentStepIndex = 0;
        
        const processNextApproval = () => {
            if (currentStepIndex >= approvalData.approvalSteps.length) {
                // 모든 결재 완료
                approvalData.approvalStatus = 'approved';
                approvalData.currentApprover = null;
                this.selectedPackage.approvalStatus = 'approved';
                
                console.log('결재 완료! PO 생성 시작...');
                
                // PO 관리로 데이터 이동
                this.moveToPoManagement(approvalData);
                return;
            }

            const currentStep = approvalData.approvalSteps[currentStepIndex];
            currentStep.status = 'approved';
            currentStep.timestamp = new Date().toISOString();
            
            // UI 업데이트
            this.showApprovalStatus(approvalData);
            // 마지막 승인이 아닌 경우에만 토스트 표시 (중간 단계는 로그만)
            if (currentStepIndex === approvalData.approvalSteps.length - 1) {
                this.app.showToast(`${currentStep.role} 최종 승인 완료`, 'success');
            } else {
                console.log(`${currentStep.role} 승인 완료`);
            }
            
            currentStepIndex++;
            
            // 다음 단계로
            if (currentStepIndex < approvalData.approvalSteps.length) {
                approvalData.approvalSteps[currentStepIndex].status = 'pending';
                approvalData.currentApprover = approvalData.approvalSteps[currentStepIndex].role;
                
                setTimeout(processNextApproval, 1500); // 1.5초 간격으로 자동 승인
            } else {
                processNextApproval(); // 마지막 승인 처리
            }
        };

        // 첫 번째 승인 시작
        approvalData.approvalSteps[0].status = 'pending';
        setTimeout(processNextApproval, 1000);
    }

    // PO 관리로 데이터 이동 (아이템별 PO 번호 생성)
    moveToPoManagement(approvalData) {
        console.log('=== moveToPoManagement 시작 ===');
        console.log('approvalData:', approvalData);
        
        if (!this.app.approvedPOItems) {
            this.app.approvedPOItems = [];
        }
        
        // 아이템별로 개별 PO 번호 생성
        const totalItems = this.getTotalItemsWithSuppliers(approvalData);
        console.log('서플라이어가 선택된 총 아이템 수:', totalItems.length);
        console.log('아이템 목록:', totalItems);
        
        if (totalItems.length === 0) {
            console.error('서플라이어가 선택된 아이템이 없습니다!');
            console.log('selectedPackage:', this.selectedPackage);
            console.log('supplierSelections:', approvalData.supplierSelections);
            this.app.showToast('서플라이어가 선택된 아이템이 없습니다.', 'error');
            return;
        }
        
        const itemsWithPO = totalItems.map((item, index) => {
            const poNumber = this.generatePONumber();
            return {
                ...item,
                poNumber: poNumber,
                poStatus: 'pending_delivery_negotiation',
                packageNumber: approvalData.packageNumber,
                packageId: approvalData.packageId,
                approvalCompletedAt: new Date().toISOString(),
                deliveryStatus: 'not_requested',
                desiredDeliveryDate: null,
                supplierProposedDate: null,
                agreedDeliveryDate: null,
                negotiationHistory: [],
                createdAt: new Date().toISOString()
            };
        });
        
        // 기존 PO 아이템 목록에 추가
        this.app.approvedPOItems.push(...itemsWithPO);
        
        // 패키지 아이템 상태 업데이트 (PO 생성 완료로 표시)
        this.updatePackageItemStatus(approvalData.packageId, approvalData.supplierSelections);
        
        this.app.showToast(`결재 완료! ${itemsWithPO.length}개 아이템 PO 생성`, 'success');
        console.log('PO 아이템 생성 완료:', itemsWithPO);
        console.log('전체 PO 아이템 목록:', this.app.approvedPOItems);
        
        // PO 관리 탭으로 자동 전환
        setTimeout(() => {
            if (this.app.switchTab) {
                this.app.switchTab('mto');
            }
        }, 2000);
    }

    // PO 번호 자동 생성 (아이템별 고유 번호)
    generatePONumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const day = String(new Date().getDate()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        
        return `PO-${year}${month}${day}-${randomNum}`;
    }

    // 서플라이어가 선택된 아이템 목록 생성
    getTotalItemsWithSuppliers(approvalData) {
        console.log('=== getTotalItemsWithSuppliers 시작 ===');
        
        if (!this.selectedPackage) {
            console.error('selectedPackage가 null입니다!');
            return [];
        }
        
        console.log('selectedPackage.packages:', this.selectedPackage.packages);
        
        const packages = this.selectedPackage.packages;
        // renderBOMItem에서 사용하는 것과 동일한 ID 생성 방식
        const allItems = [
            ...Object.entries(packages.module || {}).flatMap(([key, items]) => 
                items.map((item, idx) => ({...item, itemId: `module-${key}-${idx}`}))),
            ...Object.entries(packages.llt || {}).flatMap(([key, items]) => 
                items.map((item, idx) => ({...item, itemId: `llt-${key}-${idx}`}))),
            ...Object.entries(packages.material || {}).flatMap(([key, items]) => 
                items.map((item, idx) => ({...item, itemId: `material-${key}-${idx}`})))
        ];
        
        console.log('전체 아이템 수:', allItems.length);
        console.log('전체 아이템 목록:', allItems);
        console.log('서플라이어 선택 데이터:', approvalData.supplierSelections);
        
        // ID 매칭 상세 디버깅
        console.log('=== 아이템 ID 매칭 디버깅 ===');
        const supplierSelectionKeys = Object.keys(approvalData.supplierSelections);
        const allItemIds = allItems.map(item => item.itemId);
        
        console.log('서플라이어 선택 키들:', supplierSelectionKeys);
        console.log('전체 아이템 ID들:', allItemIds);
        
        // 매칭되지 않는 ID들 찾기
        const unmatchedSelections = supplierSelectionKeys.filter(key => 
            !allItemIds.includes(key));
        const unmatchedItems = allItemIds.filter(id => 
            !supplierSelectionKeys.includes(id));
            
        if (unmatchedSelections.length > 0) {
            console.warn('매칭되지 않는 서플라이어 선택 키들:', unmatchedSelections);
        }
        if (unmatchedItems.length > 0) {
            console.warn('서플라이어가 선택되지 않은 아이템 ID들:', unmatchedItems);
        }
        
        const filteredItems = allItems.filter(item => {
            const hasSelection = approvalData.supplierSelections[item.itemId];
            if (!hasSelection) {
                console.log(`아이템 ${item.itemId} (${item.partNumber})에 서플라이어 선택 없음`);
            } else {
                console.log(`아이템 ${item.itemId} (${item.partNumber})에 서플라이어 선택 있음:`, hasSelection);
            }
            return hasSelection;
        });
        
        console.log('필터링된 아이템 수:', filteredItems.length);
        
        return filteredItems.map(item => {
            const selection = approvalData.supplierSelections[item.itemId];
            console.log(`아이템 ${item.itemId}에 선택된 서플라이어:`, selection);
            return {
                ...item,
                selectedSupplier: selection
            };
        });
    }

    // 임시 저장
    saveSupplierSelections() {
        if (!this.selectedPackage || !this.selectedPackage.supplierSelections) {
            this.app.showToast('저장할 서플라이어 선택 정보가 없습니다.', 'warning');
            return;
        }

        // 로컬 스토리지에 저장 (실제로는 서버 API 호출)
        const saveData = {
            packageId: this.selectedPackage.id,
            supplierSelections: this.selectedPackage.supplierSelections,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`supplier_selections_${this.selectedPackage.id}`, JSON.stringify(saveData));
        
        const count = Object.keys(this.selectedPackage.supplierSelections).length;
        this.app.showToast(`${count}개 아이템의 서플라이어 선택이 임시 저장되었습니다.`, 'success');
    }

    // 아이템별 이메일 모달 표시
    showItemEmailModal(item, selectedSupplier, itemId) {
        const modal = document.getElementById('item-email-modal');
        if (!modal) {
            this.createItemEmailModal();
        }

        // 모달 내용 업데이트
        document.getElementById('item-email-item-info').innerHTML = `
            <div class="text-sm text-gray-600">
                <div><strong>아이템:</strong> ${item.partNumber} - ${item.partName}</div>
                <div><strong>카테고리:</strong> ${this.getItemCategory(item)}</div>
                ${selectedSupplier ? `<div><strong>선정 서플라이어:</strong> ${selectedSupplier.name} (${this.selectedPackage?.supplierSelections?.[itemId]?.matchPercentage}% 일치)</div>` : ''}
            </div>
        `;

        const emailContent = this.generateItemEmailContent(item, selectedSupplier, itemId);
        document.getElementById('item-email-to').value = selectedSupplier?.contact || '';
        document.getElementById('item-email-subject').value = `[CS Wind] 아이템 사양 요청 - ${item.partNumber}`;
        document.getElementById('item-email-body').value = emailContent;
        
        // 전송 버튼에 itemId 저장
        const sendBtn = document.getElementById('send-item-email-btn');
        sendBtn.setAttribute('data-item-id', itemId);
        
        document.getElementById('item-email-modal').classList.add('show');
    }

    // 아이템 이메일 내용 생성
    generateItemEmailContent(item, selectedSupplier, itemId) {
        let content = `안녕하세요,\n\n`;
        content += `CS Wind SCM팀에서 아이템 사양 및 견적 요청드립니다.\n\n`;
        
        content += `■ 아이템 정보\n`;
        content += `- 패키지 번호: ${this.selectedPackage?.packageNumber || 'N/A'}\n`;
        content += `- 아이템 번호: ${item.partNumber}\n`;
        content += `- 아이템 명: ${item.partName}\n`;
        content += `- 재질: ${item.material || 'N/A'}\n`;
        content += `- 수량: ${item.quantity || 1}\n`;
        if (item.weight) content += `- 무게: ${item.weight}kg\n`;
        content += `- 카테고리: ${this.getItemCategory(item)}\n\n`;
        
        if (selectedSupplier) {
            content += `■ 선정 사유\n`;
            content += `- 귀사는 해당 아이템에 대해 ${this.selectedPackage?.supplierSelections?.[itemId]?.matchPercentage}% 정합성을 보여주어 선정되었습니다.\n`;
            content += `- 전문분야: ${selectedSupplier.specialties.join(', ')}\n\n`;
        }
        
        content += `■ 요청사항\n`;
        content += `1. 상세 사양서 및 도면 검토\n`;
        content += `2. 단가 견적서 제출\n`;
        content += `3. 납기일 협의\n`;
        content += `4. 품질 인증서 제출\n\n`;
        
        content += `회신 기한: ${new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString('ko-KR')}\n\n`;
        content += `감사합니다.\n\n`;
        content += `CS Wind SCM팀\n`;
        content += `담당자: SCM Manager`;
        
        return content;
    }

    // 아이템 이메일 모달 생성
    createItemEmailModal() {
        const modal = document.createElement('div');
        modal.id = 'item-email-modal';
        modal.className = 'pdf-modal';
        modal.innerHTML = `
            <div class="pdf-modal-content" style="max-width: 600px;">
                <button class="pdf-modal-close" onclick="document.getElementById('item-email-modal').classList.remove('show')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pdf-modal-header">
                    <h3 class="text-xl font-bold text-gray-800">아이템별 이메일 발송</h3>
                </div>
                <div class="space-y-4">
                    <div id="item-email-item-info" class="p-3 bg-gray-50 rounded-lg">
                        <!-- 아이템 정보 동적 표시 -->
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">받는 사람</label>
                        <input type="email" id="item-email-to" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                               placeholder="supplier@example.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
                        <input type="text" id="item-email-subject" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
                        <textarea id="item-email-body" rows="12" class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div class="flex space-x-2 pt-4">
                        <button id="send-item-email-btn" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            <i class="fas fa-paper-plane mr-2"></i>이메일 발송
                        </button>
                        <button onclick="document.getElementById('item-email-modal').classList.remove('show')" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                            취소
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 이메일 발송 이벤트 연결
        document.getElementById('send-item-email-btn').addEventListener('click', () => this.sendItemEmailAction());
    }

    // 아이템 이메일 발송 실행
    sendItemEmailAction() {
        const to = document.getElementById('item-email-to').value;
        const subject = document.getElementById('item-email-subject').value;
        const body = document.getElementById('item-email-body').value;
        const itemId = document.getElementById('send-item-email-btn').getAttribute('data-item-id');

        if (!to || !subject || !body) {
            this.app.showToast('모든 필드를 입력해주세요.', 'warning');
            return;
        }

        // 이메일 발송 시뮬레이션
        this.app.showLoading(true, '아이템 이메일 발송 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            document.getElementById('item-email-modal').classList.remove('show');
            this.app.showToast(`아이템 정보가 ${to}로 발송되었습니다.`, 'success');
        }, 1500);
    }

    // PO 아이템 관리 시스템
    loadApprovedPOItems() {
        console.log('loadApprovedPOItems 호출됨');
        
        if (!this.app.approvedPOItems) {
            this.app.approvedPOItems = [];
        }
        
        console.log('현재 PO 아이템 수:', this.app.approvedPOItems.length);
        console.log('PO 아이템 목록:', this.app.approvedPOItems);

        // 빈 상태 체크를 위한 강화된 로직
        if (this.app.approvedPOItems.length === 0) {
            console.log('PO 아이템이 없습니다. 빈 상태를 표시합니다.');
        }

        const container = document.getElementById('approved-mto-container');
        const emptyDiv = document.getElementById('approved-mto-empty');
        
        // 대시보드 업데이트
        this.updatePODashboard();
        
        if (this.app.approvedPOItems.length === 0) {
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }

        if (emptyDiv) emptyDiv.style.display = 'none';

        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-medium text-gray-800">
                        PO 아이템 목록 (${this.app.approvedPOItems.length}개)
                    </h4>
                    <div class="flex space-x-2">
                        <button onclick="filterPOItems()" class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
                            <i class="fas fa-filter mr-1"></i>필터
                        </button>
                        <button onclick="refreshPOList()" class="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200">
                            <i class="fas fa-sync mr-1"></i>새로고침
                        </button>
                        <button onclick="createTestPOItems()" class="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">
                            <i class="fas fa-plus mr-1"></i>테스트 PO 생성
                        </button>
                    </div>
                </div>
                ${this.renderPOItemsList()}
            </div>
        `;
    }

    // PO 아이템 리스트 렌더링
    renderPOItemsList() {
        if (!this.app.approvedPOItems || this.app.approvedPOItems.length === 0) {
            return '<div class="text-center text-gray-500 py-8">결재 완료된 PO 아이템이 없습니다.</div>';
        }

        return this.app.approvedPOItems.map(item => this.renderPOItemCard(item)).join('');
    }

    // PO 대시보드 업데이트
    updatePODashboard() {
        const totalElement = document.getElementById('approved-mto-count');
        const negotiatingElement = document.getElementById('negotiating-po-count');
        const confirmedElement = document.getElementById('confirmed-po-count');

        const total = this.app.approvedPOItems?.length || 0;
        const negotiating = this.app.approvedPOItems?.filter(item => 
            item.poStatus === 'pending_delivery_negotiation' || item.poStatus === 'negotiating').length || 0;
        const confirmed = this.app.approvedPOItems?.filter(item => 
            item.poStatus === 'delivery_confirmed' || item.poStatus === 'completed').length || 0;

        if (totalElement) totalElement.textContent = total;
        if (negotiatingElement) negotiatingElement.textContent = negotiating;
        if (confirmedElement) confirmedElement.textContent = confirmed;
    }

    // PO 아이템 카드 렌더링
    renderPOItemCard(item) {
        const statusColor = this.getPOStatusColor(item.poStatus);
        const statusText = this.getPOStatusText(item.poStatus);
        const supplierInfo = item.selectedSupplier || {};

        return `
        <div class="po-item-wrapper">
            <div id="po-card-${item.poNumber}" class="po-item-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:border-purple-300">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="text-lg font-semibold text-purple-800">${item.poNumber}</h4>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                                ${statusText}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><i class="fas fa-box text-blue-500 mr-1"></i>아이템: ${item.partNumber}</div>
                            <div><i class="fas fa-industry text-green-500 mr-1"></i>서플라이어: ${supplierInfo.supplierName || 'N/A'}</div>
                            <div><i class="fas fa-percentage text-orange-500 mr-1"></i>정합성: ${supplierInfo.matchPercentage || 0}%</div>
                            <div><i class="fas fa-calendar text-purple-500 mr-1"></i>결재일: ${new Date(item.approvalCompletedAt).toLocaleDateString('ko-KR')}</div>
                        </div>
                    </div>
                    <div class="text-right bg-purple-50 rounded-lg p-2 min-w-16">
                        <div class="text-xs text-purple-600 font-medium">수량</div>
                        <div class="text-lg font-bold text-purple-700">${item.quantity || 1}</div>
                    </div>
                </div>

                <!-- 아이템 상세 정보 -->
                <div class="bg-gray-50 rounded p-3 mb-3">
                    <div class="text-sm">
                        <div class="font-medium text-gray-800 mb-1">${item.partName}</div>
                        <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>재질: ${item.material || 'N/A'}</div>
                            <div>레벨: L${item.level || 1}</div>
                            ${item.weight ? `<div>무게: ${item.weight}kg</div>` : ''}
                            <div>카테고리: ${this.getItemCategory(item)}</div>
                        </div>
                    </div>
                </div>

                <!-- 납기 상태 -->
                <div class="mb-3">
                    ${this.renderDeliveryStatus(item)}
                </div>

                <!-- 액션 버튼들 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button onclick="togglePODetails('${item.poNumber}')" 
                            id="toggle-btn-${item.poNumber}"
                            class="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                        <i class="fas fa-eye mr-1"></i>상세보기
                    </button>
                    <button onclick="negotiatePODelivery('${item.poNumber}')" 
                            class="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                            ${item.poStatus === 'delivery_confirmed' ? 'disabled' : ''}>
                        <i class="fas fa-handshake mr-1"></i>납기 협의
                    </button>
                    <button onclick="downloadPODocument('${item.poNumber}')" 
                            class="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                        <i class="fas fa-download mr-1"></i>PO 다운로드
                    </button>
                </div>
            </div>
        </div>
        
            <!-- 개별 PO 상세보기 토글 영역 -->
            <div id="po-detail-${item.poNumber}" class="po-detail-toggle hidden mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 overflow-hidden">
                <div class="p-6 fade-in">
                    ${this.renderPODetailContent(item)}
                </div>
            </div>
        </div>
        `;
    }

    // PO 상태별 색상 반환
    getPOStatusColor(status) {
        const statusColors = {
            'pending_delivery_negotiation': 'bg-yellow-100 text-yellow-800',
            'negotiating': 'bg-blue-100 text-blue-800',
            'delivery_confirmed': 'bg-green-100 text-green-800',
            'completed': 'bg-gray-100 text-gray-800'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    }

    // PO 상태별 텍스트 반환
    getPOStatusText(status) {
        const statusTexts = {
            'pending_delivery_negotiation': '납기 협의 대기',
            'negotiating': '납기 협의 중',
            'delivery_confirmed': '납기 확정',
            'completed': '완료'
        };
        return statusTexts[status] || '알 수 없음';
    }

    // 납기 상태 렌더링
    renderDeliveryStatus(item) {
        if (!item.desiredDeliveryDate && !item.supplierProposedDate) {
            return `
                <div class="text-xs text-gray-500">
                    <i class="fas fa-clock mr-1"></i>납기일 협의 필요
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                ${item.desiredDeliveryDate ? `
                    <div class="text-blue-600">
                        <i class="fas fa-calendar-plus mr-1"></i>희망: ${new Date(item.desiredDeliveryDate).toLocaleDateString('ko-KR')}
                    </div>
                ` : ''}
                ${item.supplierProposedDate ? `
                    <div class="text-green-600">
                        <i class="fas fa-calendar-check mr-1"></i>제안: ${new Date(item.supplierProposedDate).toLocaleDateString('ko-KR')}
                    </div>
                ` : ''}
                ${item.agreedDeliveryDate ? `
                    <div class="text-purple-600 font-medium">
                        <i class="fas fa-handshake mr-1"></i>확정: ${new Date(item.agreedDeliveryDate).toLocaleDateString('ko-KR')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // PO 상세보기 토글
    togglePODetails(poNumber) {
        const detailElement = document.getElementById(`po-detail-${poNumber}`);
        const toggleBtn = document.getElementById(`toggle-btn-${poNumber}`);
        
        if (!detailElement || !toggleBtn) {
            console.error('PO 상세보기 요소를 찾을 수 없습니다:', poNumber);
            return;
        }

        // 다른 열려있는 상세보기들을 모두 닫기
        const allDetails = document.querySelectorAll('.po-detail-toggle:not(.hidden)');
        allDetails.forEach(detail => {
            if (detail.id !== `po-detail-${poNumber}`) {
                const otherPoNumber = detail.id.replace('po-detail-', '');
                const otherBtn = document.getElementById(`toggle-btn-${otherPoNumber}`);
                if (otherBtn) {
                    detail.classList.add('hidden');
                    otherBtn.innerHTML = '<i class="fas fa-eye mr-1"></i>상세보기';
                    otherBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                    otherBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                }
            }
        });

        const isHidden = detailElement.classList.contains('hidden');
        
        if (isHidden) {
            // 펼치기
            detailElement.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>접기';
            toggleBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
            toggleBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            
            // 부드럽게 스크롤하여 상세보기 영역으로 이동
            setTimeout(() => {
                detailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        } else {
            // 접기
            detailElement.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-eye mr-1"></i>상세보기';
            toggleBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            toggleBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        }
    }

    // PO 상세 컨텐츠 렌더링
    renderPODetailContent(poItem) {
        const supplierInfo = poItem.selectedSupplier || {};
        
        return `
            <!-- PO 상세 정보 헤더 -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">PO 상세: ${poItem.poNumber}</h3>
                    <p class="text-sm text-gray-600 mt-1">패키지: ${poItem.packageNumber}</p>
                    <p class="text-xs text-gray-500">결재 완료: ${new Date(poItem.approvalCompletedAt).toLocaleString('ko-KR')}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getPOStatusColor(poItem.poStatus)}">
                        ${this.getPOStatusText(poItem.poStatus)}
                    </span>
                </div>
            </div>
            
            <!-- PO 요약 정보 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 class="font-semibold text-gray-800 mb-3">
                        <i class="fas fa-info-circle mr-2"></i>PO 정보
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div><strong>아이템:</strong> ${poItem.partNumber} - ${poItem.partName}</div>
                        <div><strong>수량:</strong> ${poItem.quantity || 1}개</div>
                        <div><strong>재질:</strong> ${poItem.material || 'N/A'}</div>
                        ${poItem.weight ? `<div><strong>무게:</strong> ${poItem.weight}kg</div>` : ''}
                        <div><strong>예상 단가:</strong> ₩${(Math.random() * 100000 + 50000).toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 class="font-semibold text-gray-800 mb-3">
                        <i class="fas fa-building mr-2"></i>서플라이어 정보
                    </h4>
                    <div class="space-y-2 text-sm">
                        <div><strong>회사명:</strong> ${supplierInfo.supplierName || 'N/A'}</div>
                        <div><strong>정합성:</strong> ${supplierInfo.matchPercentage || 0}%</div>
                        <div><strong>전문분야:</strong> ${supplierInfo.specialties?.join(', ') || 'N/A'}</div>
                        <div><strong>품질등급:</strong> ${supplierInfo.qualityRating || 'N/A'}</div>
                        <div><strong>연락처:</strong> ${supplierInfo.contact || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            ${this.renderPODetailNegotiation(poItem)}
        `;
    }

    // PO별 납기 협의 섹션 렌더링
    renderPODetailNegotiation(poItem) {
        return `
            <!-- 개별 PO 납기 협의 섹션 -->
            <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <h6 class="font-medium text-blue-800 mb-3">
                    <i class="fas fa-calendar-alt mr-2"></i>PO 납기일 협의
                </h6>
                <div class="text-xs text-blue-700 mb-3">
                    <i class="fas fa-info-circle mr-1"></i>이 PO 아이템(${poItem.poNumber})에 대한 개별 납기 협의
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">희망 납기일</label>
                        <input type="date" id="po-desired-date-${poItem.poNumber}" 
                               class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                               value="${poItem.desiredDeliveryDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">서플라이어 제안일</label>
                        <input type="date" id="po-supplier-date-${poItem.poNumber}" 
                               class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100" 
                               value="${poItem.supplierProposedDate || ''}" readonly>
                    </div>
                    <button onclick="requestPODeliveryNegotiation('${poItem.poNumber}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ${poItem.poStatus === 'delivery_confirmed' ? 'opacity-50 cursor-not-allowed' : ''}">
                        <i class="fas fa-paper-plane mr-1"></i>협의 요청
                    </button>
                </div>
                
                ${poItem.supplierProposedDate ? `
                    <div class="mt-3 pt-3 border-t border-blue-200">
                        <div class="flex space-x-2">
                            <button onclick="acceptPODeliveryDate('${poItem.poNumber}')" 
                                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                <i class="fas fa-check mr-1"></i>제안일 승인
                            </button>
                            <button onclick="rejectPODeliveryDate('${poItem.poNumber}')" 
                                    class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                                <i class="fas fa-times mr-1"></i>재협의 요청
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- 협의 이력 -->
            <div class="bg-gray-50 rounded-lg p-4">
                <h6 class="font-medium text-gray-800 mb-3">
                    <i class="fas fa-history mr-2"></i>협의 이력
                </h6>
                <div id="negotiation-history-${poItem.poNumber}" class="space-y-2">
                    ${this.renderNegotiationHistory(poItem)}
                </div>
            </div>
        `;
    }

    // 협의 이력 렌더링
    renderNegotiationHistory(poItem) {
        const history = poItem.negotiationHistory || [];
        
        if (history.length === 0) {
            return `
                <div class="text-sm text-gray-500 text-center py-4">
                    <i class="fas fa-inbox mr-2"></i>협의 이력이 없습니다.
                </div>
            `;
        }
        
        return history.map(entry => `
            <div class="flex items-start space-x-3 p-2 bg-white rounded border border-gray-200">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <i class="fas fa-user text-blue-600 text-xs"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-sm text-gray-800">${entry.from}</span>
                        <span class="text-xs text-gray-500">${new Date(entry.timestamp).toLocaleString('ko-KR')}</span>
                    </div>
                    <p class="text-sm text-gray-600">${entry.message}</p>
                </div>
            </div>
        `).join('');
    }

    // PO 상세 토글 표시 (기존 함수 - 호환성 유지)
    showPODetailToggle(poItem) {
        // 토글 영역 내용 업데이트
        document.getElementById('toggle-mto-title').textContent = `PO 상세: ${poItem.poNumber}`;
        document.getElementById('toggle-mto-package').textContent = poItem.packageNumber;
        document.getElementById('toggle-mto-date').textContent = new Date(poItem.approvalCompletedAt).toLocaleString('ko-KR');
        
        // PO 요약 정보
        const summaryDiv = document.getElementById('mto-summary');
        const supplierInfo = poItem.selectedSupplier || {};
        summaryDiv.innerHTML = `
            <div><strong>PO 번호:</strong> ${poItem.poNumber}</div>
            <div><strong>아이템:</strong> ${poItem.partNumber} - ${poItem.partName}</div>
            <div><strong>서플라이어:</strong> ${supplierInfo.supplierName || 'N/A'} (${supplierInfo.matchPercentage || 0}% 일치)</div>
            <div><strong>수량:</strong> ${poItem.quantity || 1}개</div>
            <div><strong>상태:</strong> ${this.getPOStatusText(poItem.poStatus)}</div>
            <div><strong>예상 단가:</strong> ₩${(Math.random() * 100000 + 50000).toLocaleString()}</div>
        `;
        
        // PO 아이템 상세 정보 표시
        const itemsContainer = document.getElementById('toggle-mto-items');
        itemsContainer.innerHTML = this.renderPOItemDetail(poItem);

        // 협의 이력 표시
        this.updatePONegotiationHistory(poItem);

        // 토글 영역 표시
        const toggleArea = document.getElementById('mto-detail-toggle');
        toggleArea.classList.remove('hidden');
        
        // 부드럽게 스크롤하여 토글 영역으로 이동
        setTimeout(() => {
            toggleArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // PO 아이템 상세 정보 렌더링
    renderPOItemDetail(poItem) {
        const supplierInfo = poItem.selectedSupplier || {};
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex items-center justify-between mb-4">
                    <h5 class="font-medium text-gray-800 flex items-center">
                        <i class="fas fa-industry mr-2 text-purple-500"></i>
                        ${supplierInfo.supplierName || 'Unknown Supplier'}
                        <span class="ml-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            ${supplierInfo.matchPercentage || 0}% 정합성
                        </span>
                    </h5>
                    <div class="text-sm text-gray-600">
                        PO 상태: ${this.getPOStatusText(poItem.poStatus)}
                    </div>
                </div>

                <!-- 아이템 상세 정보 -->
                <div class="bg-white rounded-lg p-3 mb-4">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-xs text-gray-500 mb-1">아이템 정보</div>
                            <div><strong>부품번호:</strong> ${poItem.partNumber}</div>
                            <div><strong>부품명:</strong> ${poItem.partName}</div>
                            <div><strong>수량:</strong> ${poItem.quantity || 1}</div>
                            <div><strong>재질:</strong> ${poItem.material || 'N/A'}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500 mb-1">분류 정보</div>
                            <div><strong>레벨:</strong> L${poItem.level || 1}</div>
                            <div><strong>카테고리:</strong> ${this.getItemCategory(poItem)}</div>
                            ${poItem.weight ? `<div><strong>무게:</strong> ${poItem.weight}kg</div>` : ''}
                            <div><strong>예상 단가:</strong> ₩${(Math.random() * 100000 + 50000).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <!-- 개별 PO 납기 협의 섹션 -->
                <div class="bg-blue-50 rounded-lg p-4">
                    <h6 class="font-medium text-blue-800 mb-3">
                        <i class="fas fa-calendar-alt mr-2"></i>PO 납기일 협의
                    </h6>
                    <div class="text-xs text-blue-700 mb-3">
                        <i class="fas fa-info-circle mr-1"></i>이 PO 아이템(${poItem.poNumber})에 대한 개별 납기 협의
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">희망 납기일</label>
                            <input type="date" id="po-desired-date-${poItem.poNumber}" 
                                   class="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                                   value="${poItem.desiredDeliveryDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">서플라이어 제안일</label>
                            <input type="date" id="po-supplier-date-${poItem.poNumber}" 
                                   class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100" 
                                   value="${poItem.supplierProposedDate || ''}" readonly>
                        </div>
                        <button onclick="requestPODeliveryNegotiation('${poItem.poNumber}')" 
                                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 ${poItem.poStatus === 'delivery_confirmed' ? 'opacity-50 cursor-not-allowed' : ''}">
                            <i class="fas fa-paper-plane mr-1"></i>협의 요청
                        </button>
                    </div>
                    
                    ${poItem.supplierProposedDate ? `
                        <div class="mt-3 pt-3 border-t border-blue-200">
                            <div class="flex space-x-2">
                                <button onclick="acceptPODeliveryDate('${poItem.poNumber}')" 
                                        class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                    <i class="fas fa-check mr-1"></i>제안일 승인
                                </button>
                                <button onclick="rejectPODeliveryDate('${poItem.poNumber}')" 
                                        class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                                    <i class="fas fa-times mr-1"></i>재협의 요청
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // MTO의 고유 서플라이어 목록 추출
    getUniqueSuppliers(mto) {
        if (!mto.items) return [];
        
        const supplierCounts = {};
        mto.items.forEach(item => {
            const supplierName = item.selectedSupplier?.supplierName || 'Unknown';
            supplierCounts[supplierName] = (supplierCounts[supplierName] || 0) + 1;
        });

        return Object.entries(supplierCounts).map(([name, count]) => ({ name, count }));
    }

    // MTO 상세보기
    viewMTODetails(mtoId) {
        const mto = this.app.approvedMTOs?.find(m => m.id === mtoId);
        if (!mto) {
            this.app.showToast('MTO 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        this.showMTODetailToggle(mto);
    }

    // MTO 상세 토글 표시
    showMTODetailToggle(mto) {
        // 토글 영역 내용 업데이트
        document.getElementById('toggle-mto-title').textContent = mto.id;
        document.getElementById('toggle-mto-package').textContent = mto.packageNumber;
        document.getElementById('toggle-mto-date').textContent = new Date(mto.approvalCompletedAt).toLocaleString('ko-KR');
        
        // MTO 요약 정보
        const summaryDiv = document.getElementById('mto-summary');
        summaryDiv.innerHTML = `
            <div><strong>총 아이템:</strong> ${mto.items?.length || 0}개</div>
            <div><strong>서플라이어:</strong> ${this.getUniqueSuppliers(mto).length}개사</div>
            <div><strong>상태:</strong> ${mto.status === 'pending_po_creation' ? 'PO 생성 대기' : 
                                      mto.status === 'negotiating' ? '납기 협의 중' : 
                                      mto.status === 'confirmed' ? 'PO 확정 완료' : '알 수 없음'}</div>
            <div><strong>예상 총액:</strong> ₩${this.calculateEstimatedTotal(mto).toLocaleString()}</div>
        `;
        
        // MTO 아이템 목록 표시
        const itemsContainer = document.getElementById('toggle-mto-items');
        itemsContainer.innerHTML = this.renderMTOItems(mto);

        // 토글 영역 표시
        const toggleArea = document.getElementById('mto-detail-toggle');
        toggleArea.classList.remove('hidden');
        
        // 부드럽게 스크롤하여 토글 영역으로 이동
        setTimeout(() => {
            toggleArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // MTO 아이템 목록 렌더링
    renderMTOItems(mto) {
        if (!mto.items || mto.items.length === 0) {
            return '<div class="text-center text-gray-500 py-4">아이템이 없습니다.</div>';
        }

        // 서플라이어별로 그룹화
        const itemsBySupplier = {};
        mto.items.forEach(item => {
            const supplierName = item.selectedSupplier?.supplierName || 'Unknown';
            if (!itemsBySupplier[supplierName]) {
                itemsBySupplier[supplierName] = [];
            }
            itemsBySupplier[supplierName].push(item);
        });

        return Object.entries(itemsBySupplier).map(([supplierName, items]) => `
            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-gray-800 flex items-center">
                        <i class="fas fa-industry mr-2 text-blue-500"></i>
                        ${supplierName}
                        <span class="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            ${items.length}개 아이템
                        </span>
                    </h5>
                    <div class="text-sm text-gray-600">
                        정합성: ${items[0]?.selectedSupplier?.matchPercentage || 0}%
                    </div>
                </div>
                <div class="space-y-2">
                    ${items.map(item => this.renderMTOItem(item)).join('')}
                </div>
                
                <!-- 서플라이어별 납기 협의 정보 -->
                <div class="mt-3 pt-3 border-t border-gray-300">
                    <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <i class="fas fa-info-circle mr-1"></i>
                        개별 PO 아이템별 납기 협의는 각 PO 상세보기에서 진행됩니다.
                    </div>
                </div>
            </div>
        `).join('');
    }

    // MTO 개별 아이템 렌더링
    renderMTOItem(item) {
        return `
            <div class="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded font-medium">L${item.level || 1}</span>
                        <span class="font-medium text-sm text-gray-800">${item.partNumber}</span>
                        <span class="text-sm text-gray-600">${item.partName}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        수량: ${item.quantity || 1} | 재질: ${item.material || 'N/A'}
                    </div>
                </div>
                <div class="text-right text-xs">
                    <div class="font-medium">₩${(Math.random() * 100000 + 50000).toFixed(0)}</div>
                    <div class="text-gray-500">단가(추정)</div>
                </div>
            </div>
        `;
    }

    // 예상 총액 계산
    calculateEstimatedTotal(mto) {
        if (!mto.items) return 0;
        return mto.items.length * 75000; // 임시 계산
    }

    // MTO 상세 토글 닫기
    closeMTODetail() {
        const toggleArea = document.getElementById('mto-detail-toggle');
        if (toggleArea) {
            toggleArea.classList.add('hidden');
        }
    }

    // 납기 협의 요청
    requestDeliveryNegotiation() {
        const desiredDate = document.getElementById('desired-delivery-date').value;
        if (!desiredDate) {
            this.app.showToast('희망 납기일을 선택해주세요.', 'warning');
            return;
        }

        this.app.showLoading(true, '서플라이어에게 납기 협의 요청 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            
            // 협의 이력에 추가
            this.addNegotiationHistoryItem('SCM Manager', `희망 납기일 요청: ${desiredDate}`);
            
            // 서플라이어 응답 시뮬레이션
            setTimeout(() => {
                const proposedDate = new Date(new Date(desiredDate).getTime() + 7*24*60*60*1000);
                document.getElementById('supplier-proposed-date').value = proposedDate.toISOString().split('T')[0];
                this.addNegotiationHistoryItem('서플라이어', `제안 납기일: ${proposedDate.toISOString().split('T')[0]} (7일 후 제안)`);
                this.app.showToast('서플라이어가 납기일을 제안했습니다.', 'success');
            }, 3000);
            
            this.app.showToast('납기 협의 요청이 전송되었습니다.', 'success');
        }, 2000);
    }

    // 서플라이어별 납기 협의 요청
    requestSupplierDelivery(supplierName) {
        this.app.showLoading(true, `${supplierName}에게 납기 협의 요청 중...`);
        
        setTimeout(() => {
            this.app.showLoading(false);
            this.app.showToast(`${supplierName}에게 납기 협의 요청이 전송되었습니다.`, 'success');
            
            // 협의 이력 추가
            this.addNegotiationHistoryItem('SCM Manager', `${supplierName}에게 개별 납기 협의 요청`);
        }, 1500);
    }

    // 협의 이력 추가
    addNegotiationHistoryItem(actor, message) {
        const historyDiv = document.getElementById('delivery-negotiation-history');
        const historyList = document.getElementById('negotiation-history-list');
        
        if (!historyDiv || !historyList) return;
        
        historyDiv.classList.remove('hidden');
        
        const newItem = document.createElement('div');
        newItem.className = `p-3 rounded border-l-4 ${
            actor === 'SCM Manager' ? 'bg-blue-50 border-blue-500' :
            actor === '서플라이어' ? 'bg-green-50 border-green-500' :
            'bg-gray-50 border-gray-500'
        }`;
        
        newItem.innerHTML = `
            <div class="flex justify-between text-sm">
                <span class="font-medium">${actor}</span>
                <span class="text-gray-500">${new Date().toLocaleString('ko-KR')}</span>
            </div>
            <div class="text-gray-700 mt-1">${message}</div>
        `;
        
        historyList.insertBefore(newItem, historyList.firstChild);
    }

    // PO 문서 생성
    generatePODocument(mtoId) {
        const mto = this.app.approvedMTOs?.find(m => m.id === mtoId);
        if (!mto) {
            this.app.showToast('MTO 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        this.app.showLoading(true, 'PO 문서 생성 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            
            // PO 문서 내용 생성
            const poContent = this.generatePOContent(mto);
            
            const blob = new Blob([poContent], { type: 'text/plain; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `PO_${mto.id}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // MTO 상태 업데이트
            mto.status = 'confirmed';
            this.updateMTODashboard();
            
            this.app.showToast('PO 문서가 생성되어 다운로드되었습니다.', 'success');
        }, 2000);
    }

    // PO 문서 내용 생성
    generatePOContent(mto) {
        let content = `=== PURCHASE ORDER (PO) ===\n\n`;
        content += `PO 번호: PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}\n`;
        content += `MTO 번호: ${mto.id}\n`;
        content += `패키지 번호: ${mto.packageNumber}\n`;
        content += `발행일: ${new Date().toLocaleDateString('ko-KR')}\n`;
        content += `발주처: CS Wind (씨에스윈드)\n`;
        content += `담당자: SCM Manager\n\n`;
        
        content += `=== 주문 아이템 목록 ===\n\n`;
        
        // 서플라이어별로 그룹화하여 표시
        const itemsBySupplier = {};
        mto.items?.forEach(item => {
            const supplierName = item.selectedSupplier?.supplierName || 'Unknown';
            if (!itemsBySupplier[supplierName]) {
                itemsBySupplier[supplierName] = [];
            }
            itemsBySupplier[supplierName].push(item);
        });
        
        Object.entries(itemsBySupplier).forEach(([supplierName, items]) => {
            content += `[공급업체] ${supplierName}\n`;
            content += `정합성: ${items[0]?.selectedSupplier?.matchPercentage || 0}%\n\n`;
            
            items.forEach((item, index) => {
                content += `${index + 1}. ${item.partNumber} - ${item.partName}\n`;
                content += `   재질: ${item.material || 'N/A'}\n`;
                content += `   수량: ${item.quantity || 1}\n`;
                content += `   단가: ₩${(Math.random() * 100000 + 50000).toFixed(0)} (추정)\n`;
                content += `   소계: ₩${((Math.random() * 100000 + 50000) * (item.quantity || 1)).toFixed(0)}\n\n`;
            });
            content += '\n';
        });
        
        content += `=== 납기 및 조건 ===\n`;
        content += `희망 납기일: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('ko-KR')}\n`;
        content += `납품 장소: 전라남도 영광군 CS Wind 공장\n`;
        content += `결제 조건: 납품 후 30일 내 은행 송금\n`;
        content += `품질 기준: CS Wind 품질 표준서 준수\n\n`;
        
        content += `=== 특별 조건 ===\n`;
        content += `1. 모든 자재는 도면 및 사양서에 명시된 기준을 만족해야 함\n`;
        content += `2. 납품 전 품질 검사 성적서 제출 필수\n`;
        content += `3. 포장은 운송 중 손상 방지를 위한 적절한 보호 조치 필요\n`;
        content += `4. 긴급 상황 시 24시간 이내 연락 가능해야 함\n\n`;
        
        content += `발행일시: ${new Date().toLocaleString('ko-KR')}\n`;
        content += `발행자: CS Wind SCM Team\n`;
        
        return content;
    }

    // PO 납기 협의 관련 함수들
    negotiatePODelivery(poNumber) {
        // 상세보기 토글을 열어서 납기 협의 섹션으로 이동
        this.viewPODetails(poNumber);
    }

    // PO 납기 협의 요청
    requestPODeliveryNegotiation(poNumber) {
        const poItem = this.app.approvedPOItems?.find(item => item.poNumber === poNumber);
        if (!poItem) {
            this.app.showToast('PO 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        const desiredDateElement = document.getElementById(`po-desired-date-${poNumber}`);
        const desiredDate = desiredDateElement?.value;
        
        if (!desiredDate) {
            this.app.showToast('희망 납기일을 선택해주세요.', 'warning');
            return;
        }

        // PO 아이템 정보 업데이트
        poItem.desiredDeliveryDate = desiredDate;
        poItem.poStatus = 'negotiating';
        poItem.deliveryStatus = 'requested';

        this.app.showLoading(true, '서플라이어에게 납기 협의 요청 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            
            // 협의 이력에 추가
            this.addPONegotiationHistory(poItem, 'SCM Manager', `희망 납기일 요청: ${desiredDate}`);
            
            // 서플라이어 응답 시뮬레이션 (5초 후)
            setTimeout(() => {
                const proposedDate = new Date(new Date(desiredDate).getTime() + 7*24*60*60*1000);
                const proposedDateStr = proposedDate.toISOString().split('T')[0];
                
                poItem.supplierProposedDate = proposedDateStr;
                document.getElementById(`po-supplier-date-${poNumber}`).value = proposedDateStr;
                
                this.addPONegotiationHistory(poItem, '서플라이어', `제안 납기일: ${proposedDateStr} (7일 후 제안)`);
                this.app.showToast(`${poItem.selectedSupplier?.supplierName || '서플라이어'}가 납기일을 제안했습니다.`, 'success');
                
                // PO 상세 화면 업데이트
                this.showPODetailToggle(poItem);
            }, 5000);
            
            this.app.showToast('납기 협의 요청이 전송되었습니다.', 'success');
        }, 2000);
    }

    // PO 제안 납기일 승인
    acceptPODeliveryDate(poNumber) {
        const poItem = this.app.approvedPOItems?.find(item => item.poNumber === poNumber);
        if (!poItem || !poItem.supplierProposedDate) {
            this.app.showToast('제안된 납기일이 없습니다.', 'error');
            return;
        }

        poItem.agreedDeliveryDate = poItem.supplierProposedDate;
        poItem.poStatus = 'delivery_confirmed';
        poItem.deliveryStatus = 'confirmed';

        this.addPONegotiationHistory(poItem, 'SCM Manager', `납기일 승인: ${poItem.supplierProposedDate}`);
        
        this.app.showToast('납기일이 확정되었습니다.', 'success');
        
        // 대시보드 및 UI 업데이트
        this.updatePODashboard();
        this.loadApprovedPOItems();
        this.showPODetailToggle(poItem);
    }

    // PO 제안 납기일 거부 (재협의)
    rejectPODeliveryDate(poNumber) {
        const poItem = this.app.approvedPOItems?.find(item => item.poNumber === poNumber);
        if (!poItem) {
            this.app.showToast('PO 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        // 제안일 초기화
        poItem.supplierProposedDate = null;
        poItem.poStatus = 'pending_delivery_negotiation';
        poItem.deliveryStatus = 'rejected';

        document.getElementById(`po-supplier-date-${poNumber}`).value = '';

        this.addPONegotiationHistory(poItem, 'SCM Manager', '제안 납기일 거부 - 재협의 요청');
        
        this.app.showToast('재협의가 요청되었습니다.', 'warning');
        
        // UI 업데이트
        this.showPODetailToggle(poItem);
    }

    // PO 협의 이력 추가
    addPONegotiationHistory(poItem, actor, message) {
        if (!poItem.negotiationHistory) {
            poItem.negotiationHistory = [];
        }
        
        poItem.negotiationHistory.unshift({
            actor: actor,
            message: message,
            timestamp: new Date().toISOString()
        });

        // 협의 이력 UI 업데이트
        this.updatePONegotiationHistory(poItem);
    }

    // PO 협의 이력 UI 업데이트
    updatePONegotiationHistory(poItem) {
        const historyDiv = document.getElementById('delivery-negotiation-history');
        const historyList = document.getElementById('negotiation-history-list');
        
        if (!historyDiv || !historyList) return;
        
        if (poItem.negotiationHistory && poItem.negotiationHistory.length > 0) {
            historyDiv.classList.remove('hidden');
            
            historyList.innerHTML = poItem.negotiationHistory.map(entry => `
                <div class="p-3 rounded border-l-4 ${
                    entry.actor === 'SCM Manager' ? 'bg-blue-50 border-blue-500' :
                    entry.actor === '서플라이어' ? 'bg-green-50 border-green-500' :
                    'bg-gray-50 border-gray-500'
                }">
                    <div class="flex justify-between text-sm">
                        <span class="font-medium">${entry.actor}</span>
                        <span class="text-gray-500">${new Date(entry.timestamp).toLocaleString('ko-KR')}</span>
                    </div>
                    <div class="text-gray-700 mt-1">${entry.message}</div>
                </div>
            `).join('');
        } else {
            historyDiv.classList.add('hidden');
        }
    }

    // PO 문서 다운로드
    downloadPODocument(poNumber) {
        const poItem = this.app.approvedPOItems?.find(item => item.poNumber === poNumber);
        if (!poItem) {
            this.app.showToast('PO 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        this.app.showLoading(true, 'PO 문서 생성 중...');
        
        setTimeout(() => {
            this.app.showLoading(false);
            
            // PO 문서 내용 생성
            const poContent = this.generateIndividualPOContent(poItem);
            
            const blob = new Blob([poContent], { type: 'text/plain; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${poItem.poNumber}_${poItem.partNumber}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.app.showToast('PO 문서가 다운로드되었습니다.', 'success');
        }, 1500);
    }

    // 개별 PO 문서 내용 생성
    generateIndividualPOContent(poItem) {
        const supplierInfo = poItem.selectedSupplier || {};
        
        let content = `=== 개별 구매 주문서 (PURCHASE ORDER) ===\n\n`;
        content += `PO 번호: ${poItem.poNumber}\n`;
        content += `발행일: ${new Date().toLocaleDateString('ko-KR')}\n`;
        content += `패키지 번호: ${poItem.packageNumber}\n`;
        content += `발주처: CS Wind (씨에스윈드)\n`;
        content += `담당자: SCM Manager\n\n`;
        
        content += `=== 서플라이어 정보 ===\n`;
        content += `업체명: ${supplierInfo.supplierName || 'N/A'}\n`;
        content += `AI 매칭도: ${supplierInfo.matchPercentage || 0}%\n`;
        content += `선정일시: ${new Date(supplierInfo.selectedAt).toLocaleString('ko-KR')}\n\n`;
        
        content += `=== 주문 아이템 ===\n`;
        content += `부품번호: ${poItem.partNumber}\n`;
        content += `부품명: ${poItem.partName}\n`;
        content += `재질: ${poItem.material || 'N/A'}\n`;
        content += `수량: ${poItem.quantity || 1}\n`;
        if (poItem.weight) content += `무게: ${poItem.weight}kg\n`;
        content += `카테고리: ${this.getItemCategory(poItem)}\n`;
        content += `레벨: L${poItem.level || 1}\n\n`;
        
        content += `=== 납기 정보 ===\n`;
        if (poItem.desiredDeliveryDate) {
            content += `희망 납기일: ${new Date(poItem.desiredDeliveryDate).toLocaleDateString('ko-KR')}\n`;
        }
        if (poItem.supplierProposedDate) {
            content += `서플라이어 제안일: ${new Date(poItem.supplierProposedDate).toLocaleDateString('ko-KR')}\n`;
        }
        if (poItem.agreedDeliveryDate) {
            content += `확정 납기일: ${new Date(poItem.agreedDeliveryDate).toLocaleDateString('ko-KR')}\n`;
        }
        content += `납기 상태: ${this.getPOStatusText(poItem.poStatus)}\n\n`;
        
        content += `=== 협의 이력 ===\n`;
        if (poItem.negotiationHistory && poItem.negotiationHistory.length > 0) {
            poItem.negotiationHistory.reverse().forEach((entry, index) => {
                content += `${index + 1}. [${new Date(entry.timestamp).toLocaleString('ko-KR')}] ${entry.actor}: ${entry.message}\n`;
            });
        } else {
            content += `협의 이력 없음\n`;
        }
        
        content += `\n=== 특별 조건 ===\n`;
        content += `1. 도면 및 사양서 기준 준수 필수\n`;
        content += `2. 납품 전 품질 검사 성적서 제출\n`;
        content += `3. 적절한 포장으로 운송 중 손상 방지\n`;
        content += `4. 긴급 상황 시 24시간 연락 가능\n\n`;
        
        content += `발행일시: ${new Date().toLocaleString('ko-KR')}\n`;
        content += `발행자: CS Wind SCM Team\n`;
        
        return content;
    }

    // PO 목록 새로고침
    refreshPOList() {
        this.loadApprovedPOItems();
        this.app.showToast('PO 목록이 새로고침되었습니다.', 'success');
    }

    // 샘플 PO 아이템 생성 (테스트용)
    createSamplePOItems() {
        const sampleItems = [
            {
                poNumber: this.generatePONumber(),
                partNumber: 'CABLE-001',
                partName: '제어 케이블',
                quantity: 2,
                material: 'Copper',
                level: 2,
                weight: 5.2,
                packageNumber: 'CSW-20241014-001',
                packageId: 'pkg-001',
                approvalCompletedAt: new Date().toISOString(),
                poStatus: 'pending_delivery_negotiation',
                deliveryStatus: 'not_requested',
                desiredDeliveryDate: null,
                supplierProposedDate: null,
                agreedDeliveryDate: null,
                negotiationHistory: [],
                createdAt: new Date().toISOString(),
                selectedSupplier: {
                    supplierId: 'SUP004',
                    supplierName: '케이씨테크',
                    matchPercentage: 96,
                    selectedAt: new Date().toISOString()
                },
                specialCategory: '전장품'
            },
            {
                poNumber: this.generatePONumber(),
                partNumber: 'STEEL-002', 
                partName: '고강도 강재',
                quantity: 10,
                material: 'S690QL',
                level: 1,
                weight: 150.5,
                packageNumber: 'CSW-20241014-001',
                packageId: 'pkg-001',
                approvalCompletedAt: new Date().toISOString(),
                poStatus: 'pending_delivery_negotiation',
                deliveryStatus: 'not_requested',
                desiredDeliveryDate: null,
                supplierProposedDate: null,
                agreedDeliveryDate: null,
                negotiationHistory: [],
                createdAt: new Date().toISOString(),
                selectedSupplier: {
                    supplierId: 'SUP001',
                    supplierName: '포스코강판',
                    matchPercentage: 98,
                    selectedAt: new Date().toISOString()
                },
                specialCategory: '고강도 강재'
            },
            {
                poNumber: this.generatePONumber(),
                partNumber: 'FLANGE-003',
                partName: '연결 플랜지',
                quantity: 4,
                material: 'Steel',
                level: 2,
                weight: 25.8,
                packageNumber: 'CSW-20241014-002',
                packageId: 'pkg-002',
                approvalCompletedAt: new Date().toISOString(),
                poStatus: 'negotiating',
                deliveryStatus: 'requested',
                desiredDeliveryDate: '2024-11-15',
                supplierProposedDate: '2024-11-22',
                agreedDeliveryDate: null,
                negotiationHistory: [
                    {
                        actor: 'SCM Manager',
                        message: '희망 납기일 요청: 2024-11-15',
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        actor: '서플라이어',
                        message: '제안 납기일: 2024-11-22 (7일 후 제안)',
                        timestamp: new Date().toISOString()
                    }
                ],
                createdAt: new Date().toISOString(),
                selectedSupplier: {
                    supplierId: 'SUP008',
                    supplierName: '효성중공업',
                    matchPercentage: 96,
                    selectedAt: new Date().toISOString()
                },
                specialCategory: '플랜지류'
            }
        ];

        this.app.approvedPOItems.push(...sampleItems);
        console.log('샘플 PO 아이템 생성 완료:', sampleItems.length, '개');
    }

    // 패키지 아이템 상태 업데이트
    updatePackageItemStatus(packageId, supplierSelections) {
        console.log('=== 패키지 아이템 상태 업데이트 ===');
        
        if (!this.app.packageItemStatus) {
            this.app.packageItemStatus = {};
        }
        
        if (!this.app.packageItemStatus[packageId]) {
            this.app.packageItemStatus[packageId] = {};
        }
        
        // PO가 생성된 아이템들을 완료 상태로 표시
        Object.keys(supplierSelections).forEach(itemId => {
            this.app.packageItemStatus[packageId][itemId] = 'po_created';
            console.log(`아이템 ${itemId} 상태를 'po_created'로 업데이트`);
        });
        
        // 현재 선택된 패키지의 상태 업데이트
        if (this.selectedPackage && this.selectedPackage.id === packageId) {
            this.refreshPackageDetailView();
        }
    }

    // 패키지 상세보기 새로고침
    refreshPackageDetailView() {
        if (this.selectedPackage) {
            console.log('패키지 상세보기 새로고침');
            this.showPackageDetailToggle(this.selectedPackage);
        }
    }

    // 아이템의 PO 상태 확인
    getItemPOStatus(packageId, itemId) {
        if (!this.app.packageItemStatus || 
            !this.app.packageItemStatus[packageId] || 
            !this.app.packageItemStatus[packageId][itemId]) {
            return 'not_created'; // PO 미생성
        }
        
        return this.app.packageItemStatus[packageId][itemId]; // 'po_created' 등
    }

    // 공급업체 탭 패키지 상세보기 토글
    toggleSupplierPackageDetails(packageId) {
        console.log('=== toggleSupplierPackageDetails 호출 ===', packageId);
        
        const detailsElement = document.getElementById(`details-${packageId}`);
        const btnElement = document.getElementById(`detail-btn-${packageId}`);
        
        if (!detailsElement || !btnElement) {
            console.error('상세보기 요소를 찾을 수 없습니다:', packageId);
            return;
        }

        // 다른 열린 상세보기들을 모두 닫기
        const allDetails = document.querySelectorAll('.package-details:not(.hidden)');
        
        allDetails.forEach(detail => {
            if (detail.id !== `details-${packageId}`) {
                const otherPackageId = detail.id.replace('details-', '');
                const otherBtn = document.getElementById(`detail-btn-${otherPackageId}`);
                if (otherBtn) {
                    detail.classList.add('hidden');
                    otherBtn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>상세보기';
                }
            }
        });

        const isHidden = detailsElement.classList.contains('hidden');
        
        if (isHidden) {
            // 패키지 찾기 및 선택
            const pkg = this.findPackageById(packageId);
            if (!pkg) {
                this.app.showToast('패키지를 찾을 수 없습니다.', 'error');
                return;
            }

            // 현재 선택된 패키지로 설정 (기존 viewPackageDetails 로직 활용)
            this.selectedPackage = pkg;
            this.activePackageId = packageId;

            // 상세보기 내용을 실제 BOM 트리와 인터랙티브 기능으로 업데이트
            this.updatePackageDetailsContent(detailsElement, pkg);
            
            // 펼치기
            detailsElement.classList.remove('hidden');
            btnElement.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>접기';
            
            console.log('패키지 상세보기 펼침:', packageId);
            
            // 부드럽게 스크롤하여 상세보기 영역으로 이동
            setTimeout(() => {
                detailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                // 드롭다운 이벤트 설정
                this.setupSupplierDropdownEvents();
            }, 150);
            
        } else {
            // 접기
            detailsElement.classList.add('hidden');
            btnElement.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>상세보기';
            
            // 선택 해제
            if (this.activePackageId === packageId) {
                this.selectedPackage = null;
                this.activePackageId = null;
            }
            
            console.log('패키지 상세보기 접음:', packageId);
        }
    }

    // 패키지 상세보기 내용을 실제 BOM 트리로 업데이트
    updatePackageDetailsContent(detailsElement, pkg) {
        console.log('=== 패키지 상세보기 내용 업데이트 ===', pkg.id);
        
        // 기존 내용을 BOM 트리와 인터랙티브 기능으로 교체
        detailsElement.innerHTML = `
            <div class="p-6">
                <!-- 패키지 헤더 -->
                <div class="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">${pkg.packageNumber}</h3>
                        <p class="text-sm text-gray-600">결재자: ${pkg.requester.name} | 수신일: ${new Date(pkg.receivedDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="saveSupplierSelections()" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            <i class="fas fa-save mr-1"></i>임시저장
                        </button>
                        <button onclick="submitForApproval()" id="submit-approval-btn" 
                                class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                disabled>
                            <i class="fas fa-paper-plane mr-1"></i>결재 요청
                        </button>
                    </div>
                </div>

                <!-- 선택 진행 상황 -->
                <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium text-blue-800">서플라이어 선택 진행률</h4>
                        <div id="selected-suppliers-count" class="text-sm text-blue-600">
                            선택을 시작하세요
                        </div>
                    </div>
                </div>

                <!-- 승인 진행 상황 (처음에는 숨김) -->
                <div id="approval-status-section" class="hidden mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 class="font-medium text-yellow-800 mb-3">
                        <i class="fas fa-clock mr-2"></i>결재 진행 상황
                    </h4>
                    <div id="approval-progress" class="space-y-2">
                        <!-- 결재 진행 상황이 여기에 표시됩니다 -->
                    </div>
                </div>

                <!-- BOM 트리 구조 -->
                <div class="space-y-6">
                    <h4 class="font-medium text-gray-800 mb-4">
                        <i class="fas fa-sitemap mr-2"></i>BOM 구조 및 서플라이어 선정
                    </h4>
                    ${this.renderBOMTree(pkg.packages)}
                </div>
            </div>
        `;

        // 선택된 서플라이어 수 업데이트
        this.updateSelectedSuppliersCount();
    }
}

// 전역 함수들
function viewPackageDetails(packageId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.viewPackageDetails(packageId);
    }
}

function downloadPackageZip(packageId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.downloadPackageZip(packageId);
    }
}

function sendPackageEmail(packageId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.sendPackageEmail(packageId);
    }
}

function managePO(packageId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.managePO(packageId);
    }
}

function manageSupplier(supplierId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.manageSupplier(supplierId);
    }
}

function closePackageDetail() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.closePackageDetail();
    }
}

function togglePODetails(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.togglePODetails(poNumber);
    }
}

function toggleSupplierDropdown(dropdownId, itemId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.toggleSupplierDropdown(dropdownId, itemId);
    }
}

function selectSupplier(itemId, supplierId, supplierName, matchPercentage) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.selectSupplier(itemId, supplierId, supplierName, matchPercentage);
    }
}

function downloadItemSpec(itemId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.downloadItemSpec(itemId);
    }
}

function sendItemEmail(itemId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.sendItemEmail(itemId);
    }
}

function submitForApproval() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.submitForApproval();
    }
}

function saveSupplierSelections() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.saveSupplierSelections();
    }
}

// MTO 관리 관련 전역 함수들
function viewMTODetails(mtoId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.viewMTODetails(mtoId);
    }
}

function closeMTODetail() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.closeMTODetail();
    }
}

function requestDeliveryNegotiation() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.requestDeliveryNegotiation();
    }
}

function requestSupplierDelivery(supplierName) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.requestSupplierDelivery(supplierName);
    }
}

function generatePODocument(mtoId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.generatePODocument(mtoId);
    }
}

function refreshMTOList() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.refreshMTOList();
    }
}

function negotiateDelivery(mtoId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.viewMTODetails(mtoId);
    }
}

// PO 관리 관련 전역 함수들
function viewPODetails(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.viewPODetails(poNumber);
    }
}

function negotiatePODelivery(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.negotiatePODelivery(poNumber);
    }
}

function downloadPODocument(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.downloadPODocument(poNumber);
    }
}

function requestPODeliveryNegotiation(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.requestPODeliveryNegotiation(poNumber);
    }
}

function acceptPODeliveryDate(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.acceptPODeliveryDate(poNumber);
    }
}

function rejectPODeliveryDate(poNumber) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.rejectPODeliveryDate(poNumber);
    }
}

function refreshPOList() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.refreshPOList();
    }
}

function filterPOItems() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.app.showToast('필터 기능은 추후 구현 예정입니다.', 'info');
    }
}

function createTestPOItems() {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.createSamplePOItems();
        window.csWindApp.supplierManager.loadApprovedPOItems();
        window.csWindApp.supplierManager.app.showToast('테스트 PO 아이템이 생성되었습니다.', 'success');
    }
}

// 공급업체 탭 패키지 상세보기 토글 함수
function toggleSupplierPackageDetails(packageId) {
    if (window.csWindApp && window.csWindApp.supplierManager) {
        window.csWindApp.supplierManager.toggleSupplierPackageDetails(packageId);
    }
}