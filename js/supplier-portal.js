// 서플라이어 포털 전용 JavaScript

class SupplierPortal {
    constructor() {
        this.currentTab = 'packages';
        this.supplierInfo = {
            name: '포스코강판',
            code: 'SUP-001',
            email: 'posco@example.com'
        };
        this.packages = [];
        this.poList = [];
        this.pallets = [];
        this.init();
    }

    init() {
        this.loadSupplierInfo();
        this.setupEventListeners();
        this.loadPackages();
        this.loadSampleData();
    }

    loadSupplierInfo() {
        // URL 파라미터에서 서플라이어 정보 로드
        const urlParams = new URLSearchParams(window.location.search);
        const supplierCode = urlParams.get('supplier') || 'SUP-001';
        
        document.getElementById('supplier-name').textContent = this.supplierInfo.name;
        document.getElementById('supplier-code').textContent = this.supplierInfo.code;
    }

    setupEventListeners() {
        // 탭 전환 이벤트
        const packagesTab = document.getElementById('tab-packages');
        const poTab = document.getElementById('tab-po-management');
        const logisticsTab = document.getElementById('tab-logistics');
        const palletBtn = document.getElementById('btn-add-pallet');
        
        if (packagesTab) {
            packagesTab.addEventListener('click', () => this.switchTab('packages'));
        }
        
        if (poTab) {
            poTab.addEventListener('click', () => this.switchTab('po-management'));
        }
        
        if (logisticsTab) {
            logisticsTab.addEventListener('click', () => this.switchTab('logistics'));
        }
        
        // 파레트 추가 버튼
        if (palletBtn) {
            palletBtn.addEventListener('click', () => this.showPalletModal());
        }
    }

    switchTab(tabName) {
        // 모든 탭 버튼 리셋
        document.querySelectorAll('nav button').forEach(btn => {
            btn.className = 'py-4 px-2 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm';
        });

        // 모든 섹션 숨기기
        const packagesSection = document.getElementById('packages-section');
        const poSection = document.getElementById('po-management-section');
        const logisticsSection = document.getElementById('logistics-section');
        
        if (packagesSection) packagesSection.classList.add('hidden');
        if (poSection) poSection.classList.add('hidden');
        if (logisticsSection) logisticsSection.classList.add('hidden');

        // 활성 탭 설정
        const activeTab = document.getElementById(`tab-${tabName}`);
        if (activeTab) {
            activeTab.className = 'py-4 px-2 border-b-2 border-blue-500 font-medium text-blue-600 text-sm';
        }

        // 해당 섹션 표시
        const targetSection = document.getElementById(`${tabName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        this.currentTab = tabName;

        // 각 탭별 데이터 로드
        switch(tabName) {
            case 'packages':
                this.renderPackages();
                break;
            case 'po-management':
                this.renderPOManagement();
                break;
            case 'logistics':
                this.renderLogistics();
                break;
        }
    }

    loadPackages() {
        // 시뮬레이션: 메인 시스템에서 전송받은 패키지들
        this.packages = [
            {
                id: 'PKG_001',
                packageNumber: 'CSW-20241013-001',
                requester: { name: '김철수', role: 'Production Technician' },
                receivedDate: new Date().toISOString(),
                status: 'received',
                poStatus: 'pending',
                packages: {
                    module: {
                        '타워 하부 조립체': [
                            { partNumber: 'TWR-L1-001', partName: '하부 링 플레이트', level: 2, material: 'S355', quantity: 1, drawingFile: 'TWR-L1-001.pdf' },
                            { partNumber: 'TWR-L1-002', partName: '보강 리브', level: 3, material: 'S355', quantity: 8, drawingFile: 'TWR-L1-002.pdf' }
                        ]
                    },
                    llt: {
                        '구조용 강재 (S355)': [
                            { partNumber: 'PL-355-20', partName: '플레이트 20T', level: 4, material: 'S355', quantity: 5 },
                            { partNumber: 'PL-355-25', partName: '플레이트 25T', level: 4, material: 'S355', quantity: 3 }
                        ]
                    },
                    supplier: {
                        '포스코강판': [
                            { partNumber: 'BOLT-M20', partName: '고장력 볼트 M20', level: 4, material: 'SCM435', quantity: 100 },
                            { partNumber: 'NUT-M20', partName: '너트 M20', level: 4, material: 'SCM435', quantity: 100 }
                        ]
                    }
                }
            },
            {
                id: 'PKG_002',
                packageNumber: 'CSW-20241013-002',
                requester: { name: '박영희', role: 'SCM Team Leader' },
                receivedDate: new Date(Date.now() - 86400000).toISOString(),
                status: 'received',
                poStatus: 'approved',
                packages: {
                    module: {},
                    llt: {
                        '고강도 강재 (S690)': [
                            { partNumber: 'PL-690-30', partName: '플레이트 30T', level: 4, material: 'S690', quantity: 2 }
                        ]
                    },
                    supplier: {
                        '포스코강판': [
                            { partNumber: 'FLANGE-001', partName: '플랜지 200A', level: 3, material: 'S355', quantity: 4 }
                        ]
                    }
                }
            },
            {
                id: 'PKG_003',
                packageNumber: 'CSW-20241012-001',
                requester: { name: '이대표', role: 'CEO' },
                receivedDate: new Date(Date.now() - 172800000).toISOString(),
                status: 'received',
                poStatus: 'in-production',
                packages: {
                    module: {
                        '나셀 조립체': [
                            { partNumber: 'NAC-001', partName: '나셀 프레임', level: 2, material: 'S355', quantity: 1 }
                        ]
                    },
                    llt: {},
                    supplier: {
                        '포스코강판': [
                            { partNumber: 'BEARING-001', partName: '베어링 하우징', level: 3, material: 'GCD400', quantity: 2 }
                        ]
                    }
                }
            }
        ];

        this.updateDashboard();
        this.renderPackages();
    }

    loadSampleData() {
        // PO 데이터 로드
        this.poList = [
            {
                id: 'PO_001',
                packageId: 'PKG_001',
                packageNumber: 'CSW-20241013-001',
                poNumber: 'PO-2024-001',
                status: 'negotiation',
                requestedDelivery: '2024-11-15',
                proposedDelivery: '2024-11-20',
                negotiationHistory: [
                    { date: '2024-10-13', actor: 'SCM팀', action: '납기일 요청: 2024-11-15' },
                    { date: '2024-10-13', actor: '서플라이어', action: '납기일 제안: 2024-11-20' }
                ]
            },
            {
                id: 'PO_002',
                packageId: 'PKG_002',
                packageNumber: 'CSW-20241013-002',
                poNumber: 'PO-2024-002',
                status: 'approved',
                requestedDelivery: '2024-11-10',
                proposedDelivery: '2024-11-10',
                negotiationHistory: [
                    { date: '2024-10-12', actor: 'SCM팀', action: '납기일 요청: 2024-11-10' },
                    { date: '2024-10-12', actor: '서플라이어', action: '납기일 승인' }
                ]
            }
        ];

        // 파레트 데이터 로드
        this.pallets = [
            {
                id: 'PAL_001',
                packageId: 'PKG_002',
                palletNumber: 'PAL-001-20241013',
                lotNumber: 'LOT-20241013-001',
                items: [
                    { partNumber: 'PL-690-30', partName: '플레이트 30T', quantity: 2 },
                    { partNumber: 'FLANGE-001', partName: '플랜지 200A', quantity: 4 }
                ],
                qrCode: 'QR-PAL-001-20241013',
                barcode: 'BC-PAL-001-20241013',
                status: 'ready',
                createdDate: new Date().toISOString()
            }
        ];
    }

    updateDashboard() {
        const stats = {
            totalPackages: this.packages.length,
            pendingPOs: this.packages.filter(p => p.poStatus === 'pending').length,
            inProduction: this.packages.filter(p => p.poStatus === 'in-production').length,
            readyToShip: this.pallets.filter(p => p.status === 'ready').length
        };

        document.getElementById('total-packages').textContent = stats.totalPackages;
        document.getElementById('pending-pos').textContent = stats.pendingPOs;
        document.getElementById('in-production').textContent = stats.inProduction;
        document.getElementById('ready-to-ship').textContent = stats.readyToShip;
    }

    renderPackages() {
        const container = document.getElementById('packages-container');
        
        container.innerHTML = this.packages.map(pkg => `
            <div class="package-card bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-semibold text-gray-800">${pkg.packageNumber}</h3>
                        <p class="text-sm text-gray-600">결재자: ${pkg.requester.name}</p>
                        <p class="text-xs text-gray-500">수신: ${new Date(pkg.receivedDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span class="status-badge px-3 py-1 rounded-full text-xs font-medium ${this.getStatusClass(pkg.poStatus)}">
                        ${this.getStatusText(pkg.poStatus)}
                    </span>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div class="bg-purple-50 p-2 rounded">
                        <div class="text-xs text-purple-600">모듈</div>
                        <div class="font-semibold text-purple-800">${Object.keys(pkg.packages.module).length}</div>
                    </div>
                    <div class="bg-orange-50 p-2 rounded">
                        <div class="text-xs text-orange-600">LLT</div>
                        <div class="font-semibold text-orange-800">${Object.keys(pkg.packages.llt).length}</div>
                    </div>
                    <div class="bg-blue-50 p-2 rounded">
                        <div class="text-xs text-blue-600">서플라이어</div>
                        <div class="font-semibold text-blue-800">${Object.keys(pkg.packages.supplier).length}</div>
                    </div>
                </div>

                <div class="flex space-x-2">
                    <button onclick="supplierPortal.viewPackageDetail('${pkg.id}')" 
                            class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                        <i class="fas fa-eye mr-1"></i>상세 보기
                    </button>
                    <button onclick="supplierPortal.downloadPackage('${pkg.id}')" 
                            class="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                        <i class="fas fa-download mr-1"></i>다운로드
                    </button>
                    ${pkg.poStatus === 'pending' || pkg.poStatus === 'negotiation' ? 
                        `<button onclick="supplierPortal.negotiatePO('${pkg.id}')" 
                                class="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700">
                            <i class="fas fa-handshake mr-1"></i>PO 협의
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }

    getStatusClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'negotiation': 'bg-blue-100 text-blue-800',
            'approved': 'bg-green-100 text-green-800',
            'in-production': 'bg-purple-100 text-purple-800',
            'shipped': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status) {
        const texts = {
            'pending': 'PO 대기',
            'negotiation': '협의 중',
            'approved': 'PO 승인',
            'in-production': '제작 중',
            'shipped': '배송 완료'
        };
        return texts[status] || status;
    }

    viewPackageDetail(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        if (!pkg) return;

        const modal = document.getElementById('package-detail-modal');
        const content = document.getElementById('package-detail-content');

        content.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800 mb-4">패키지 상세 정보</h2>
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-800 mb-2">기본 정보</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>패키지 번호: <span class="font-medium">${pkg.packageNumber}</span></div>
                        <div>결재자: <span class="font-medium">${pkg.requester.name}</span></div>
                        <div>수신일: <span class="font-medium">${new Date(pkg.receivedDate).toLocaleString('ko-KR')}</span></div>
                        <div>PO 상태: <span class="font-medium">${this.getStatusText(pkg.poStatus)}</span></div>
                    </div>
                </div>
                
                ${this.renderPackageBOMTree(pkg.packages)}
            </div>
        `;

        modal.classList.add('show');
    }

    renderPackageBOMTree(packages) {
        let html = '<div class="space-y-4">';

        // 모듈 패키지
        if (Object.keys(packages.module).length > 0) {
            html += '<div class="border border-purple-200 rounded-lg p-3 bg-purple-50">';
            html += '<h4 class="font-medium text-purple-800 mb-2 flex items-center">';
            html += '<i class="fas fa-puzzle-piece mr-2"></i>모듈 패키지</h4>';
            
            Object.entries(packages.module).forEach(([moduleKey, items]) => {
                html += `<div class="mb-3 bg-white rounded p-2 border border-purple-100">`;
                html += `<h5 class="text-sm font-medium text-gray-800 mb-1">${moduleKey}</h5>`;
                items.forEach(item => {
                    html += this.renderBOMItem(item);
                });
                html += '</div>';
            });
            html += '</div>';
        }

        // LLT 패키지
        if (Object.keys(packages.llt).length > 0) {
            html += '<div class="border border-orange-200 rounded-lg p-3 bg-orange-50">';
            html += '<h4 class="font-medium text-orange-800 mb-2 flex items-center">';
            html += '<i class="fas fa-layer-group mr-2"></i>LLT 패키지</h4>';
            
            Object.entries(packages.llt).forEach(([lltKey, items]) => {
                html += `<div class="mb-3 bg-white rounded p-2 border border-orange-100">`;
                html += `<h5 class="text-sm font-medium text-gray-800 mb-1">${lltKey}</h5>`;
                items.forEach(item => {
                    html += this.renderBOMItem(item);
                });
                html += '</div>';
            });
            html += '</div>';
        }

        // 서플라이어 패키지
        if (Object.keys(packages.supplier).length > 0) {
            html += '<div class="border border-blue-200 rounded-lg p-3 bg-blue-50">';
            html += '<h4 class="font-medium text-blue-800 mb-2 flex items-center">';
            html += '<i class="fas fa-industry mr-2"></i>서플라이어 패키지</h4>';
            
            Object.entries(packages.supplier).forEach(([supplier, items]) => {
                html += `<div class="mb-3 bg-white rounded p-2 border border-blue-100">`;
                html += `<h5 class="text-sm font-medium text-gray-800 mb-1">${supplier}</h5>`;
                items.forEach(item => {
                    html += this.renderBOMItem(item);
                });
                html += '</div>';
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    renderBOMItem(item) {
        const drawingLink = item.drawingFile ? 
            `<button onclick="viewDrawing('${item.drawingFile}')" class="text-blue-600 hover:text-blue-800 text-xs">
                <i class="fas fa-file-pdf"></i> 도면
            </button>` : '';

        return `
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs hover:bg-gray-100">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="bg-gray-200 px-1 rounded">L${item.level || 1}</span>
                        <span class="font-medium">${item.partNumber}</span>
                        <span class="text-gray-600">${item.partName}</span>
                    </div>
                    <div class="text-gray-500 mt-1">
                        재질: ${item.material || 'N/A'} | 수량: ${item.quantity || 1}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    ${drawingLink}
                </div>
            </div>
        `;
    }

    downloadPackage(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        if (!pkg) return;

        this.showToast('패키지 다운로드를 시작합니다...', 'info');
        
        // 시뮬레이션: ZIP 파일 생성 및 다운로드
        setTimeout(() => {
            const content = this.generatePackageContent(pkg);
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pkg.packageNumber}_Package.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('패키지 다운로드가 완료되었습니다.', 'success');
        }, 1500);
    }

    generatePackageContent(pkg) {
        let content = `CS Wind 서플라이어 패키지\n`;
        content += `패키지 번호: ${pkg.packageNumber}\n`;
        content += `수신일: ${new Date(pkg.receivedDate).toLocaleString('ko-KR')}\n`;
        content += `결재자: ${pkg.requester.name}\n\n`;
        
        content += '=== BOM 구조 ===\n\n';
        
        Object.entries(pkg.packages.module).forEach(([moduleKey, items]) => {
            content += `[모듈] ${moduleKey}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        Object.entries(pkg.packages.llt).forEach(([lltKey, items]) => {
            content += `[LLT] ${lltKey}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        Object.entries(pkg.packages.supplier).forEach(([supplier, items]) => {
            content += `[서플라이어] ${supplier}\n`;
            items.forEach(item => {
                content += `  - ${item.partNumber} | ${item.partName} | ${item.material || 'N/A'} | 수량: ${item.quantity || 1}\n`;
            });
            content += '\n';
        });
        
        return content;
    }

    negotiatePO(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        const po = this.poList.find(p => p.packageId === packageId);
        
        if (!pkg || !po) return;

        const modal = document.getElementById('po-negotiation-modal');
        const content = document.getElementById('po-negotiation-content');

        content.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800 mb-4">PO 일정 협의</h2>
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>패키지 번호: <span class="font-medium">${pkg.packageNumber}</span></div>
                        <div>PO 번호: <span class="font-medium">${po.poNumber}</span></div>
                        <div>요청 납기일: <span class="font-medium">${po.requestedDelivery}</span></div>
                        <div>제안 납기일: <span class="font-medium">${po.proposedDelivery}</span></div>
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-800 mb-2">협의 이력</h4>
                    <div class="space-y-2">
                        ${po.negotiationHistory.map(h => `
                            <div class="bg-white border-l-4 border-blue-500 p-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="font-medium">${h.actor}</span>
                                    <span class="text-gray-500">${h.date}</span>
                                </div>
                                <div class="text-gray-600 mt-1">${h.action}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h4 class="font-medium text-gray-800 mb-2">새로운 납기일 제안</h4>
                    <div class="flex items-center space-x-3">
                        <input type="date" id="new-delivery-date" class="border border-gray-300 rounded-md px-3 py-2" 
                               value="${po.proposedDelivery}">
                        <textarea id="negotiation-comment" placeholder="협의 사유를 입력하세요..." 
                                  class="flex-1 border border-gray-300 rounded-md px-3 py-2" rows="2"></textarea>
                    </div>
                </div>

                <div class="flex space-x-2 pt-4">
                    <button onclick="supplierPortal.submitPONegotiation('${po.id}')" 
                            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <i class="fas fa-paper-plane mr-2"></i>제안 전송
                    </button>
                    <button onclick="supplierPortal.approvePO('${po.id}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <i class="fas fa-check mr-2"></i>승인
                    </button>
                    <button onclick="closeModal('po-negotiation-modal')" 
                            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                        취소
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    submitPONegotiation(poId) {
        const newDate = document.getElementById('new-delivery-date').value;
        const comment = document.getElementById('negotiation-comment').value;
        
        if (!newDate || !comment) {
            this.showToast('날짜와 사유를 모두 입력해주세요.', 'warning');
            return;
        }

        const po = this.poList.find(p => p.id === poId);
        if (po) {
            po.proposedDelivery = newDate;
            po.negotiationHistory.push({
                date: new Date().toLocaleDateString('ko-KR'),
                actor: '서플라이어',
                action: `납기일 재제안: ${newDate} (사유: ${comment})`
            });
        }

        closeModal('po-negotiation-modal');
        this.showToast('납기일 제안이 SCM팀으로 전송되었습니다.', 'success');
    }

    approvePO(poId) {
        const po = this.poList.find(p => p.id === poId);
        const pkg = this.packages.find(p => p.id === po.packageId);
        
        if (po && pkg) {
            po.status = 'approved';
            pkg.poStatus = 'approved';
            po.negotiationHistory.push({
                date: new Date().toLocaleDateString('ko-KR'),
                actor: '서플라이어',
                action: 'PO 승인 완료'
            });
        }

        closeModal('po-negotiation-modal');
        this.showToast('PO가 승인되었습니다.', 'success');
        this.updateDashboard();
        this.renderPackages();
    }

    renderPOManagement() {
        const container = document.getElementById('po-container');
        
        container.innerHTML = this.poList.map(po => {
            const pkg = this.packages.find(p => p.id === po.packageId);
            return `
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800">${po.poNumber}</h3>
                            <p class="text-sm text-gray-600">패키지: ${pkg?.packageNumber || 'N/A'}</p>
                        </div>
                        <span class="po-status ${po.status}">
                            ${this.getPOStatusText(po.status)}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>요청 납기일: <span class="font-medium">${po.requestedDelivery}</span></div>
                        <div>제안 납기일: <span class="font-medium">${po.proposedDelivery}</span></div>
                    </div>

                    <div class="mb-4">
                        <h4 class="font-medium text-gray-800 mb-2 text-sm">최근 협의 이력</h4>
                        <div class="bg-gray-50 p-3 rounded text-sm">
                            ${po.negotiationHistory[po.negotiationHistory.length - 1]?.action || '협의 이력이 없습니다.'}
                        </div>
                    </div>

                    <div class="flex space-x-2">
                        <button onclick="supplierPortal.negotiatePO('${pkg?.id}')" 
                                class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                            <i class="fas fa-handshake mr-1"></i>협의하기
                        </button>
                        ${po.status !== 'approved' ? 
                            `<button onclick="supplierPortal.approvePO('${po.id}')" 
                                    class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                                <i class="fas fa-check mr-1"></i>승인
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    getPOStatusText(status) {
        const texts = {
            'pending': 'PO 대기',
            'negotiation': '협의 중',
            'approved': '승인 완료'
        };
        return texts[status] || status;
    }

    renderLogistics() {
        const container = document.getElementById('logistics-container');
        
        if (this.pallets.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-pallet fa-3x mb-4"></i>
                    <p>등록된 파레트가 없습니다.</p>
                    <p class="text-sm">파레트 추가 버튼을 클릭하여 새로운 파레트를 등록하세요.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pallets.map(pallet => `
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-semibold text-gray-800">${pallet.palletNumber}</h3>
                        <p class="text-sm text-gray-600">LOT: ${pallet.lotNumber}</p>
                        <p class="text-xs text-gray-500">생성일: ${new Date(pallet.createdDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span class="status-badge px-3 py-1 rounded-full text-xs font-medium ${this.getStatusClass(pallet.status)}">
                        ${this.getStatusText(pallet.status)}
                    </span>
                </div>

                <div class="mb-4">
                    <h4 class="font-medium text-gray-800 mb-2 text-sm">포함 아이템</h4>
                    <div class="space-y-1">
                        ${pallet.items.map(item => `
                            <div class="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <span>${item.partNumber} - ${item.partName}</span>
                                <span class="font-medium">x${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-blue-50 p-3 rounded text-center">
                        <div class="text-xs text-blue-600">QR 코드</div>
                        <div class="font-mono text-sm text-blue-800">${pallet.qrCode}</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded text-center">
                        <div class="text-xs text-green-600">바코드</div>
                        <div class="font-mono text-sm text-green-800">${pallet.barcode}</div>
                    </div>
                </div>

                <div class="flex space-x-2">
                    <button onclick="supplierPortal.generateQR('${pallet.id}')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                        <i class="fas fa-qrcode mr-1"></i>QR 생성
                    </button>
                    <button onclick="supplierPortal.generateBarcode('${pallet.id}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                        <i class="fas fa-barcode mr-1"></i>바코드 생성
                    </button>
                    <button onclick="supplierPortal.shipPallet('${pallet.id}')" 
                            class="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">
                        <i class="fas fa-shipping-fast mr-1"></i>배송 처리
                    </button>
                </div>
            </div>
        `).join('');
    }

    showPalletModal() {
        const modal = document.getElementById('pallet-modal');
        const content = document.getElementById('pallet-content');

        // 승인된 PO의 패키지들만 선택 가능
        const availablePackages = this.packages.filter(p => p.poStatus === 'approved');

        content.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800 mb-4">새 파레트 추가</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">패키지 선택</label>
                    <select id="pallet-package-select" class="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="">패키지를 선택하세요</option>
                        ${availablePackages.map(pkg => `
                            <option value="${pkg.id}">${pkg.packageNumber}</option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">파레트 번호</label>
                    <input type="text" id="pallet-number" class="w-full border border-gray-300 rounded-md px-3 py-2" 
                           value="PAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001" readonly>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">LOT 번호</label>
                    <input type="text" id="lot-number" class="w-full border border-gray-300 rounded-md px-3 py-2" 
                           value="LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001">
                </div>

                <div id="pallet-items-container" class="hidden">
                    <h4 class="font-medium text-gray-800 mb-2">포함할 아이템</h4>
                    <div id="pallet-items-list" class="space-y-2 max-h-48 overflow-y-auto">
                        <!-- 아이템 목록이 여기에 표시됩니다 -->
                    </div>
                </div>

                <div class="flex space-x-2 pt-4">
                    <button onclick="supplierPortal.createPallet()" 
                            class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>파레트 생성
                    </button>
                    <button onclick="closeModal('pallet-modal')" 
                            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                        취소
                    </button>
                </div>
            </div>
        `;

        // 패키지 선택 이벤트 연결
        document.getElementById('pallet-package-select').addEventListener('change', (e) => {
            this.showPalletItems(e.target.value);
        });

        modal.classList.add('show');
    }

    showPalletItems(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        if (!pkg) return;

        const container = document.getElementById('pallet-items-container');
        const itemsList = document.getElementById('pallet-items-list');

        const allItems = [
            ...Object.values(pkg.packages.module).flat(),
            ...Object.values(pkg.packages.llt).flat(),
            ...Object.values(pkg.packages.supplier).flat()
        ];

        itemsList.innerHTML = allItems.map((item, index) => `
            <div class="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <input type="checkbox" id="item-${index}" checked class="rounded">
                <label for="item-${index}" class="flex-1 text-sm">
                    <span class="font-medium">${item.partNumber}</span> - ${item.partName}
                    <span class="text-gray-500">(수량: ${item.quantity || 1})</span>
                </label>
            </div>
        `).join('');

        container.classList.remove('hidden');
    }

    createPallet() {
        const packageId = document.getElementById('pallet-package-select').value;
        const palletNumber = document.getElementById('pallet-number').value;
        const lotNumber = document.getElementById('lot-number').value;

        if (!packageId || !palletNumber || !lotNumber) {
            this.showToast('모든 필드를 입력해주세요.', 'warning');
            return;
        }

        const pkg = this.packages.find(p => p.id === packageId);
        if (!pkg) return;

        // 선택된 아이템들 수집
        const selectedItems = [];
        document.querySelectorAll('#pallet-items-list input[type="checkbox"]:checked').forEach((checkbox, index) => {
            const allItems = [
                ...Object.values(pkg.packages.module).flat(),
                ...Object.values(pkg.packages.llt).flat(),
                ...Object.values(pkg.packages.supplier).flat()
            ];
            if (allItems[index]) {
                selectedItems.push({
                    partNumber: allItems[index].partNumber,
                    partName: allItems[index].partName,
                    quantity: allItems[index].quantity || 1
                });
            }
        });

        const newPallet = {
            id: `PAL_${Date.now()}`,
            packageId: packageId,
            palletNumber: palletNumber,
            lotNumber: lotNumber,
            items: selectedItems,
            qrCode: `QR-${palletNumber}`,
            barcode: `BC-${palletNumber}`,
            status: 'ready',
            createdDate: new Date().toISOString()
        };

        this.pallets.push(newPallet);
        
        closeModal('pallet-modal');
        this.showToast('새 파레트가 생성되었습니다.', 'success');
        this.updateDashboard();
        this.renderLogistics();
    }

    generateQR(palletId) {
        const pallet = this.pallets.find(p => p.id === palletId);
        if (!pallet) return;

        // QR 코드 생성 시뮬레이션
        this.showToast(`QR 코드가 생성되었습니다: ${pallet.qrCode}`, 'success');
        
        // 실제로는 QR 코드 라이브러리 사용하여 이미지 생성 후 다운로드
        console.log('QR Code data:', {
            palletNumber: pallet.palletNumber,
            lotNumber: pallet.lotNumber,
            items: pallet.items
        });
    }

    generateBarcode(palletId) {
        const pallet = this.pallets.find(p => p.id === palletId);
        if (!pallet) return;

        // 바코드 생성 시뮬레이션
        this.showToast(`바코드가 생성되었습니다: ${pallet.barcode}`, 'success');
        
        // 실제로는 바코드 라이브러리 사용하여 이미지 생성 후 다운로드
        console.log('Barcode data:', {
            palletNumber: pallet.palletNumber,
            lotNumber: pallet.lotNumber
        });
    }

    shipPallet(palletId) {
        const pallet = this.pallets.find(p => p.id === palletId);
        if (!pallet) return;

        pallet.status = 'shipped';
        this.showToast(`파레트 ${pallet.palletNumber}가 배송 처리되었습니다.`, 'success');
        this.updateDashboard();
        this.renderLogistics();
    }

    showToast(message, type = 'info') {
        // 간단한 토스트 알림 구현
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'warning' ? 'bg-yellow-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 모달 닫기 함수
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 도면 보기 함수 (시뮬레이션)
function viewDrawing(fileName) {
    supplierPortal.showToast(`도면 파일을 열고 있습니다: ${fileName}`, 'info');
}

// 전역 인스턴스 생성
const supplierPortal = new SupplierPortal();