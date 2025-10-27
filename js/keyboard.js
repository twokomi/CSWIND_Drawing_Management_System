// 키보드 단축키 및 접근성 기능

class KeyboardManager {
    constructor(app) {
        this.app = app;
        this.shortcuts = {
            // 탭 네비게이션
            'ctrl+1': () => this.app.switchTab('dashboard'),
            'ctrl+2': () => this.app.switchTab('projects'),
            'ctrl+3': () => this.app.switchTab('bom'),
            'ctrl+4': () => this.app.switchTab('suppliers'),
            'ctrl+5': () => this.app.switchTab('mto'),
            
            // 기능 단축키
            'ctrl+n': () => this.openNewProjectModal(),
            'ctrl+s': (e) => { e.preventDefault(); this.quickSave(); },
            'ctrl+f': (e) => { e.preventDefault(); this.focusSearch(); },
            'ctrl+e': () => this.quickExport(),
            
            // ESC 키로 모달 닫기
            'escape': () => this.closeModals(),
            
            // 도움말
            'f1': (e) => { e.preventDefault(); this.showHelpModal(); },
            'ctrl+h': (e) => { e.preventDefault(); this.showHelpModal(); }
        };
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 도움말 버튼을 헤더에 추가
        this.addHelpButton();
        
        // 툴팁 시스템 초기화
        this.initTooltips();
    }

    handleKeyDown(e) {
        const key = this.getKeyCombo(e);
        
        if (this.shortcuts[key]) {
            // 입력 필드에서 타이핑 중일 때는 일부 단축키 무시
            if (this.isTyping(e) && !['escape', 'f1'].includes(key)) {
                return;
            }
            
            this.shortcuts[key](e);
        }
    }

    getKeyCombo(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        const keyName = e.key.toLowerCase();
        if (keyName === 'escape') return 'escape';
        if (keyName === 'f1') return 'f1';
        
        parts.push(keyName);
        
        return parts.join('+');
    }

    isTyping(e) {
        const target = e.target;
        return target.tagName === 'INPUT' || 
               target.tagName === 'TEXTAREA' || 
               target.contentEditable === 'true';
    }

    openNewProjectModal() {
        // 현재 탭에 따라 적절한 새로 만들기 액션
        const currentTab = this.app.currentTab;
        
        switch (currentTab) {
            case 'dashboard':
            case 'projects':
                document.getElementById('customer-name')?.focus();
                this.app.showToast('새 프로젝트 생성 폼으로 이동했습니다', 'info');
                break;
            case 'suppliers':
                const supplierNameInput = document.querySelector('[name="supplier_name"]');
                if (supplierNameInput) {
                    supplierNameInput.focus();
                    this.app.showToast('새 서플라이어 등록 폼으로 이동했습니다', 'info');
                }
                break;
            default:
                this.app.showToast(`현재 탭(${currentTab})에서는 새로 만들기를 지원하지 않습니다`, 'warning');
        }
    }

    quickSave() {
        // 현재 편집 중인 폼이 있다면 저장
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            const submitBtn = activeForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.click();
                this.app.showToast('저장되었습니다', 'success');
            }
        } else {
            this.app.showToast('저장할 데이터가 없습니다', 'info');
        }
    }

    focusSearch() {
        // 현재 탭의 검색 입력창에 포커스
        const searchInputs = [
            '#project-search',
            '#bom-search', 
            '#supplier-search'
        ];
        
        for (const selector of searchInputs) {
            const input = document.querySelector(selector);
            if (input && !input.classList.contains('hidden')) {
                input.focus();
                input.select();
                this.app.showToast('검색창으로 이동했습니다', 'info');
                return;
            }
        }
        
        this.app.showToast('검색 기능을 찾을 수 없습니다', 'warning');
    }

    quickExport() {
        // 현재 탭의 데이터 내보내기
        const currentTab = this.app.currentTab;
        
        switch (currentTab) {
            case 'projects':
                if (window.projectManager) {
                    window.projectManager.exportProjects();
                }
                break;
            case 'suppliers':
                if (window.supplierManager) {
                    window.supplierManager.exportSuppliers();
                }
                break;
            case 'bom':
                if (window.bomAnalyzer) {
                    window.bomAnalyzer.exportBOMData();
                }
                break;
            case 'mto':
                if (window.mtoManager) {
                    window.mtoManager.exportAllMTO();
                }
                break;
            default:
                this.app.showToast(`현재 탭(${currentTab})에서는 내보내기를 지원하지 않습니다`, 'warning');
        }
    }

    closeModals() {
        // 열려있는 모든 모달 닫기
        const modals = document.querySelectorAll('.fixed.inset-0.bg-black.bg-opacity-50');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                modal.remove();
            }
        });
        
        // 드롭다운 메뉴 닫기
        const dropdowns = document.querySelectorAll('.dropdown.open');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    showHelpModal() {
        this.closeModals();
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-auto modal-content">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-semibold flex items-center">
                            <i class="fas fa-question-circle text-blue-600 mr-2"></i>
                            도움말 및 단축키
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- 키보드 단축키 -->
                        <div>
                            <h4 class="text-lg font-medium mb-4 text-blue-600">
                                <i class="fas fa-keyboard mr-2"></i>키보드 단축키
                            </h4>
                            <div class="space-y-3">
                                ${this.getShortcutsList()}
                            </div>
                        </div>
                        
                        <!-- 사용법 가이드 -->
                        <div>
                            <h4 class="text-lg font-medium mb-4 text-green-600">
                                <i class="fas fa-book mr-2"></i>사용법 가이드
                            </h4>
                            <div class="space-y-4">
                                ${this.getUsageGuide()}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 시스템 정보 -->
                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <h4 class="text-lg font-medium mb-4 text-purple-600">
                            <i class="fas fa-info-circle mr-2"></i>시스템 정보
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium">버전</div>
                                <div class="text-gray-600">v1.0.0</div>
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium">브라우저</div>
                                <div class="text-gray-600">${navigator.userAgent.split(' ')[0]}</div>
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium">프로젝트 수</div>
                                <div class="text-gray-600">${this.app.projects.length}개</div>
                            </div>
                            <div class="bg-gray-50 p-3 rounded">
                                <div class="font-medium">BOM 아이템</div>
                                <div class="text-gray-600">${this.app.bomItems.length}개</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 text-center">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                            <i class="fas fa-check mr-2"></i>확인
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ESC 키로 닫기
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
        
        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getShortcutsList() {
        const shortcuts = [
            { keys: 'Ctrl + 1', desc: '대시보드로 이동' },
            { keys: 'Ctrl + 2', desc: '프로젝트 관리로 이동' },
            { keys: 'Ctrl + 3', desc: 'BOM 분석으로 이동' },
            { keys: 'Ctrl + 4', desc: '서플라이어 관리로 이동' },
            { keys: 'Ctrl + 5', desc: 'MTO 관리로 이동' },
            { keys: 'Ctrl + N', desc: '새로 만들기' },
            { keys: 'Ctrl + S', desc: '빠른 저장' },
            { keys: 'Ctrl + F', desc: '검색창 포커스' },
            { keys: 'Ctrl + E', desc: '데이터 내보내기' },
            { keys: 'ESC', desc: '모달/드롭다운 닫기' },
            { keys: 'F1 / Ctrl + H', desc: '도움말 열기' }
        ];
        
        return shortcuts.map(shortcut => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span class="font-mono text-sm bg-gray-200 px-2 py-1 rounded">${shortcut.keys}</span>
                <span class="text-sm text-gray-700">${shortcut.desc}</span>
            </div>
        `).join('');
    }

    getUsageGuide() {
        return `
            <div class="space-y-3">
                <div class="p-3 bg-blue-50 rounded">
                    <h5 class="font-medium text-blue-800 mb-1">1. 프로젝트 생성</h5>
                    <p class="text-sm text-blue-700">대시보드 또는 프로젝트 관리에서 새 프로젝트를 생성하세요.</p>
                </div>
                <div class="p-3 bg-green-50 rounded">
                    <h5 class="font-medium text-green-800 mb-1">2. BOM 데이터 업로드</h5>
                    <p class="text-sm text-green-700">CSV 파일로 BOM 데이터를 업로드하거나 수동으로 입력하세요.</p>
                </div>
                <div class="p-3 bg-yellow-50 rounded">
                    <h5 class="font-medium text-yellow-800 mb-1">3. 실물도면 필터링</h5>
                    <p class="text-sm text-yellow-700">스펙도면 등에서 실물도면만 자동으로 추출하세요.</p>
                </div>
                <div class="p-3 bg-purple-50 rounded">
                    <h5 class="font-medium text-purple-800 mb-1">4. MTO 생성</h5>
                    <p class="text-sm text-purple-700">서플라이어별로 도면을 그룹화하여 MTO를 생성하세요.</p>
                </div>
            </div>
        `;
    }

    addHelpButton() {
        const headerRight = document.querySelector('header .flex.items-center.space-x-4');
        if (headerRight) {
            const helpButton = document.createElement('button');
            helpButton.className = 'text-gray-600 hover:text-gray-800 transition duration-200';
            helpButton.innerHTML = '<i class="fas fa-question-circle text-lg"></i>';
            helpButton.title = '도움말 (F1)';
            helpButton.onclick = () => this.showHelpModal();
            
            headerRight.insertBefore(helpButton, headerRight.lastElementChild);
        }
    }

    initTooltips() {
        // 기본 툴팁 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            [data-tooltip] {
                position: relative;
            }
            
            [data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
            }
            
            [data-tooltip]:hover::before {
                content: '';
                position: absolute;
                bottom: 94%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: rgba(0, 0, 0, 0.8);
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
        
        // 주요 버튼들에 툴팁 추가
        this.addTooltipsToElements();
    }

    addTooltipsToElements() {
        // 네비게이션 탭에 툴팁 추가
        const navButtons = [
            { id: 'nav-dashboard', text: '대시보드 (Ctrl+1)' },
            { id: 'nav-projects', text: '프로젝트 관리 (Ctrl+2)' },
            { id: 'nav-bom', text: 'BOM 분석 (Ctrl+3)' },
            { id: 'nav-suppliers', text: '서플라이어 관리 (Ctrl+4)' },
            { id: 'nav-mto', text: 'MTO 관리 (Ctrl+5)' }
        ];
        
        navButtons.forEach(({ id, text }) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('data-tooltip', text);
            }
        });
    }

    // 접근성 향상 기능
    enhanceAccessibility() {
        // 포커스 관리
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // 포커스 스타일 추가
        const focusStyle = document.createElement('style');
        focusStyle.textContent = `
            body.keyboard-navigation *:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            body:not(.keyboard-navigation) *:focus {
                outline: none;
            }
        `;
        document.head.appendChild(focusStyle);
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.keyboardManager = new KeyboardManager(window.csWindApp);
            window.keyboardManager.enhanceAccessibility();
        }
    }, 100);
});