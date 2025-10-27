// 고급 알림 시스템 및 작업 히스토리

class NotificationManager {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.workHistory = [];
        this.maxNotifications = 100;
        this.maxHistory = 500;
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupNotificationSystem();
        this.setupWorkHistoryTracking();
        this.createNotificationCenter();
    }

    loadStoredData() {
        // 로컬 스토리지에서 알림 및 히스토리 로드
        this.notifications = StorageUtils.get('cswind_notifications', []);
        this.workHistory = StorageUtils.get('cswind_work_history', []);
        
        // 오래된 데이터 정리 (30일 이상)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > thirtyDaysAgo
        );
        this.workHistory = this.workHistory.filter(h => 
            new Date(h.timestamp) > thirtyDaysAgo
        );
        
        this.saveData();
    }

    setupNotificationSystem() {
        // 알림 센터 버튼을 헤더에 추가
        this.addNotificationButton();
        
        // 정기적으로 시스템 상태 체크
        setInterval(() => {
            this.checkSystemStatus();
        }, 5 * 60 * 1000); // 5분마다
    }

    setupWorkHistoryTracking() {
        // 모든 중요한 작업을 히스토리에 기록
        this.trackProjectOperations();
        this.trackBOMOperations();
        this.trackSupplierOperations();
        this.trackMTOOperations();
    }

    addNotificationButton() {
        const headerRight = document.querySelector('header .flex.items-center.space-x-4');
        if (!headerRight) return;

        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'relative';
        
        notificationContainer.innerHTML = `
            <button id="notification-center-btn" 
                    class="relative text-gray-600 hover:text-gray-800 transition duration-200"
                    title="알림 센터">
                <i class="fas fa-bell text-lg"></i>
                <span id="notification-badge" 
                      class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hidden">
                    0
                </span>
            </button>
        `;
        
        headerRight.insertBefore(notificationContainer, headerRight.children[1]);
        
        // 알림 센터 버튼 이벤트
        document.getElementById('notification-center-btn').addEventListener('click', () => {
            this.showNotificationCenter();
        });
        
        this.updateNotificationBadge();
    }

    createNotificationCenter() {
        // 알림 센터 모달 HTML은 동적으로 생성
    }

    // 알림 생성 메서드들
    addNotification(type, title, message, actionData = null) {
        const notification = {
            id: StringUtils.generateId(),
            type: type, // 'info', 'success', 'warning', 'error', 'system'
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            read: false,
            actionData: actionData
        };
        
        this.notifications.unshift(notification);
        
        // 최대 개수 제한
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
        
        this.saveData();
        this.updateNotificationBadge();
        
        // 중요한 알림은 토스트로도 표시
        if (type === 'error' || type === 'warning') {
            this.app.showToast(title + ': ' + message, type, 8000);
        }
        
        return notification.id;
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveData();
            this.updateNotificationBadge();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveData();
        this.updateNotificationBadge();
    }

    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveData();
        this.updateNotificationBadge();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveData();
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    showNotificationCenter() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-hidden modal-content">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold flex items-center">
                            <i class="fas fa-bell text-blue-600 mr-2"></i>
                            알림 센터
                        </h3>
                        <div class="flex space-x-2">
                            <button onclick="notificationManager.markAllAsRead()" 
                                    class="text-sm text-blue-600 hover:text-blue-800">
                                모두 읽음 처리
                            </button>
                            <button onclick="notificationManager.clearAllNotifications(); this.closest('.fixed').remove()" 
                                    class="text-sm text-red-600 hover:text-red-800">
                                모두 삭제
                            </button>
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex space-x-4">
                        <button class="notification-filter-btn active" data-filter="all">
                            전체 (${this.notifications.length})
                        </button>
                        <button class="notification-filter-btn" data-filter="unread">
                            읽지 않음 (${this.notifications.filter(n => !n.read).length})
                        </button>
                        <button class="notification-filter-btn" data-filter="system">
                            시스템
                        </button>
                        <button class="notification-filter-btn" data-filter="work">
                            작업 알림
                        </button>
                    </div>
                </div>
                
                <div class="max-h-96 overflow-y-auto">
                    <div id="notification-list">
                        ${this.renderNotificationList()}
                    </div>
                </div>
                
                <div class="p-4 border-t border-gray-200 bg-gray-50">
                    <button onclick="notificationManager.showWorkHistory()" 
                            class="text-sm text-gray-600 hover:text-gray-800 flex items-center">
                        <i class="fas fa-history mr-2"></i>
                        전체 작업 히스토리 보기
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 필터 버튼 이벤트
        modal.querySelectorAll('.notification-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll('.notification-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                this.filterNotifications(filter, modal.querySelector('#notification-list'));
            });
        });
        
        // ESC로 닫기
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.remove();
        });
        
        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    renderNotificationList(filter = 'all') {
        let filteredNotifications = this.notifications;
        
        switch (filter) {
            case 'unread':
                filteredNotifications = this.notifications.filter(n => !n.read);
                break;
            case 'system':
                filteredNotifications = this.notifications.filter(n => n.type === 'system');
                break;
            case 'work':
                filteredNotifications = this.notifications.filter(n => ['info', 'success', 'warning'].includes(n.type));
                break;
        }
        
        if (filteredNotifications.length === 0) {
            return `
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-bell-slash text-3xl mb-2 block"></i>
                    <p>표시할 알림이 없습니다.</p>
                </div>
            `;
        }
        
        return filteredNotifications.map(notification => {
            const timeAgo = DateUtils.formatRelative(notification.timestamp);
            const iconClass = this.getNotificationIcon(notification.type);
            const bgClass = notification.read ? 'bg-white' : 'bg-blue-50';
            
            return `
                <div class="notification-item ${bgClass} border-b border-gray-100 p-4 hover:bg-gray-50 transition duration-200">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <i class="${iconClass} text-lg"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="font-medium text-gray-800 ${notification.read ? '' : 'font-semibold'}">${notification.title}</h4>
                                <div class="flex items-center space-x-2 ml-2">
                                    <span class="text-xs text-gray-500">${timeAgo}</span>
                                    <button onclick="notificationManager.deleteNotification('${notification.id}')" 
                                            class="text-gray-400 hover:text-red-600">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                            ${notification.actionData ? this.renderNotificationAction(notification) : ''}
                            ${!notification.read ? `
                                <button onclick="notificationManager.markAsRead('${notification.id}')" 
                                        class="text-xs text-blue-600 hover:text-blue-800 mt-2">
                                    읽음 처리
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderNotificationAction(notification) {
        if (!notification.actionData) return '';
        
        const { type, data } = notification.actionData;
        
        switch (type) {
            case 'goto_project':
                return `
                    <button onclick="notificationManager.executeAction('${notification.id}')" 
                            class="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-2 hover:bg-blue-700">
                        프로젝트 보기
                    </button>
                `;
            case 'download_mto':
                return `
                    <button onclick="notificationManager.executeAction('${notification.id}')" 
                            class="text-xs bg-green-600 text-white px-2 py-1 rounded mt-2 hover:bg-green-700">
                        MTO 다운로드
                    </button>
                `;
            default:
                return '';
        }
    }

    executeAction(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification || !notification.actionData) return;
        
        const { type, data } = notification.actionData;
        
        switch (type) {
            case 'goto_project':
                this.app.switchTab('projects');
                // 프로젝트 선택 로직 추가
                break;
            case 'download_mto':
                if (window.mtoManager && data.mtoId) {
                    window.mtoManager.downloadMTO(data.mtoId);
                }
                break;
        }
        
        this.markAsRead(notificationId);
    }

    filterNotifications(filter, container) {
        container.innerHTML = this.renderNotificationList(filter);
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'fas fa-info-circle text-blue-500',
            success: 'fas fa-check-circle text-green-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            error: 'fas fa-exclamation-circle text-red-500',
            system: 'fas fa-cog text-gray-500'
        };
        return icons[type] || icons.info;
    }

    // 작업 히스토리 추적
    addWorkHistory(category, action, details, relatedData = null) {
        const historyEntry = {
            id: StringUtils.generateId(),
            category: category, // 'project', 'bom', 'supplier', 'mto'
            action: action, // 'create', 'update', 'delete', 'import', 'export'
            details: details,
            timestamp: new Date().toISOString(),
            user: 'current_user', // 향후 다중 사용자 지원시 사용
            relatedData: relatedData
        };
        
        this.workHistory.unshift(historyEntry);
        
        // 최대 개수 제한
        if (this.workHistory.length > this.maxHistory) {
            this.workHistory = this.workHistory.slice(0, this.maxHistory);
        }
        
        this.saveData();
    }

    showWorkHistory() {
        // 작업 히스토리 모달 표시
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-hidden modal-content">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold flex items-center">
                            <i class="fas fa-history text-purple-600 mr-2"></i>
                            작업 히스토리
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="mt-4 flex space-x-4">
                        <button class="history-filter-btn active" data-filter="all">전체</button>
                        <button class="history-filter-btn" data-filter="project">프로젝트</button>
                        <button class="history-filter-btn" data-filter="bom">BOM</button>
                        <button class="history-filter-btn" data-filter="supplier">서플라이어</button>
                        <button class="history-filter-btn" data-filter="mto">MTO</button>
                    </div>
                </div>
                
                <div class="max-h-96 overflow-y-auto">
                    <div id="history-list">
                        ${this.renderWorkHistoryList()}
                    </div>
                </div>
                
                <div class="p-4 border-t border-gray-200 bg-gray-50">
                    <div class="flex justify-between items-center text-sm text-gray-600">
                        <span>총 ${this.workHistory.length}개의 작업 기록</span>
                        <button onclick="notificationManager.exportWorkHistory()" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-download mr-1"></i>히스토리 내보내기
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 필터 이벤트
        modal.querySelectorAll('.history-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                this.filterWorkHistory(filter, modal.querySelector('#history-list'));
            });
        });
    }

    renderWorkHistoryList(filter = 'all') {
        let filteredHistory = this.workHistory;
        
        if (filter !== 'all') {
            filteredHistory = this.workHistory.filter(h => h.category === filter);
        }
        
        if (filteredHistory.length === 0) {
            return `
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-history text-3xl mb-2 block"></i>
                    <p>표시할 히스토리가 없습니다.</p>
                </div>
            `;
        }
        
        // 날짜별로 그룹화
        const groupedHistory = ArrayUtils.groupBy(filteredHistory, (item) => {
            return DateUtils.formatKorean(item.timestamp);
        });
        
        return Object.entries(groupedHistory).map(([date, entries]) => `
            <div class="history-date-group">
                <div class="sticky top-0 bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h4 class="font-medium text-gray-800">${date}</h4>
                </div>
                ${entries.map(entry => this.renderHistoryEntry(entry)).join('')}
            </div>
        `).join('');
    }

    renderHistoryEntry(entry) {
        const timeStr = new Date(entry.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const actionIcon = this.getActionIcon(entry.action);
        const categoryColor = this.getCategoryColor(entry.category);
        
        return `
            <div class="history-entry p-4 border-b border-gray-100 hover:bg-gray-50 transition duration-200">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="${categoryColor} p-2 rounded-full">
                            <i class="${actionIcon} text-white text-sm"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-medium text-gray-800">${entry.details}</p>
                                <p class="text-sm text-gray-600">${this.getCategoryName(entry.category)} • ${this.getActionName(entry.action)}</p>
                            </div>
                            <span class="text-xs text-gray-500">${timeStr}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryName(category) {
        const names = {
            project: '프로젝트',
            bom: 'BOM',
            supplier: '서플라이어',
            mto: 'MTO'
        };
        return names[category] || category;
    }

    getActionName(action) {
        const names = {
            create: '생성',
            update: '수정',
            delete: '삭제',
            import: '가져오기',
            export: '내보내기'
        };
        return names[action] || action;
    }

    getActionIcon(action) {
        const icons = {
            create: 'fas fa-plus',
            update: 'fas fa-edit',
            delete: 'fas fa-trash',
            import: 'fas fa-upload',
            export: 'fas fa-download'
        };
        return icons[action] || 'fas fa-circle';
    }

    getCategoryColor(category) {
        const colors = {
            project: 'bg-blue-500',
            bom: 'bg-green-500',
            supplier: 'bg-purple-500',
            mto: 'bg-orange-500'
        };
        return colors[category] || 'bg-gray-500';
    }

    filterWorkHistory(filter, container) {
        container.innerHTML = this.renderWorkHistoryList(filter);
    }

    exportWorkHistory() {
        if (this.workHistory.length === 0) {
            this.app.showToast('내보낼 히스토리가 없습니다.', 'warning');
            return;
        }

        const exportData = this.workHistory.map(entry => ({
            '날짜': DateUtils.formatKorean(entry.timestamp),
            '시간': new Date(entry.timestamp).toLocaleTimeString('ko-KR'),
            '카테고리': this.getCategoryName(entry.category),
            '작업': this.getActionName(entry.action),
            '상세내용': entry.details,
            '사용자': entry.user
        }));

        const filename = `CS_Wind_작업히스토리_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.showToast('작업 히스토리가 내보내졌습니다.', 'success');
    }

    // 작업 추적 메서드들
    trackProjectOperations() {
        // 프로젝트 생성/수정/삭제 추적
        const originalCreateProject = this.app.createNewProject;
        this.app.createNewProject = (...args) => {
            const result = originalCreateProject.apply(this.app, args);
            this.addWorkHistory('project', 'create', `새 프로젝트 생성`);
            this.addNotification('success', '프로젝트 생성 완료', '새로운 프로젝트가 생성되었습니다.');
            return result;
        };
    }

    trackBOMOperations() {
        // BOM 작업 추적 로직
    }

    trackSupplierOperations() {
        // 서플라이어 작업 추적 로직
    }

    trackMTOOperations() {
        // MTO 작업 추적 로직
    }

    // 시스템 상태 체크
    checkSystemStatus() {
        const issues = [];
        
        // 데이터 무결성 체크
        if (window.validationManager) {
            const integrity = window.validationManager.validateDataIntegrity();
            if (!integrity.isValid) {
                issues.push(...integrity.issues);
            }
        }
        
        // 성능 체크
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            if (memoryUsage > 100) { // 100MB 이상
                issues.push(`메모리 사용량이 높습니다: ${memoryUsage.toFixed(1)}MB`);
            }
        }
        
        // 이슈가 있으면 시스템 알림 생성
        if (issues.length > 0) {
            this.addNotification('system', '시스템 상태 체크', 
                `${issues.length}개의 문제가 발견되었습니다: ${issues[0]}${issues.length > 1 ? ' 외' : ''}`);
        }
    }

    saveData() {
        StorageUtils.set('cswind_notifications', this.notifications);
        StorageUtils.set('cswind_work_history', this.workHistory);
    }
}

// CSS 스타일 추가
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-filter-btn, .history-filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        background: white;
        color: #6b7280;
        font-size: 0.875rem;
        border-radius: 0.375rem;
        transition: all 0.2s;
    }
    
    .notification-filter-btn.active, .history-filter-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }
    
    .notification-filter-btn:hover, .history-filter-btn:hover {
        background: #f3f4f6;
    }
    
    .notification-filter-btn.active:hover, .history-filter-btn.active:hover {
        background: #2563eb;
    }
    
    .notification-item {
        cursor: pointer;
    }
    
    .history-date-group {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .history-entry {
        position: relative;
    }
    
    .history-entry::before {
        content: '';
        position: absolute;
        left: 1.75rem;
        top: 0;
        bottom: 0;
        width: 1px;
        background: #e5e7eb;
    }
    
    .history-entry:last-child::before {
        display: none;
    }
`;
document.head.appendChild(notificationStyles);

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.notificationManager = new NotificationManager(window.csWindApp);
        }
    }, 200);
});