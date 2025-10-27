// 프로젝트 관리 기능

class ProjectManager {
    constructor(app) {
        this.app = app;
        this.currentProject = null;
        this.setupProjectEvents();
    }

    setupProjectEvents() {
        // 프로젝트 관리 탭이 로드될 때
        document.addEventListener('DOMContentLoaded', () => {
            this.app.loadProjectsList = () => this.loadProjectsList();
        });
    }

    async loadProjectsList() {
        const container = document.getElementById('projects-list');
        if (!container) return;

        try {
            // 로딩 상태 표시
            container.innerHTML = '<div class="p-8 text-center"><div class="animate-pulse">프로젝트 목록을 불러오는 중...</div></div>';

            // 프로젝트 데이터 새로고침
            const projectsData = await this.app.fetchTableData('projects');
            this.app.projects = projectsData.data || [];

            if (this.app.projects.length === 0) {
                container.innerHTML = this.renderEmptyState();
                return;
            }

            container.innerHTML = this.renderProjectsList(this.app.projects);
            this.attachProjectEvents();

        } catch (error) {
            console.error('프로젝트 목록 로드 실패:', error);
            container.innerHTML = '<div class="p-8 text-center text-red-500">프로젝트 목록을 불러올 수 없습니다.</div>';
        }
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3 class="text-lg font-semibold mb-2">등록된 프로젝트가 없습니다</h3>
                <p class="text-gray-600 mb-4">새 프로젝트를 생성하여 시작하세요.</p>
                <button onclick="showTab('dashboard')" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                    <i class="fas fa-plus mr-2"></i>프로젝트 생성하기
                </button>
            </div>
        `;
    }

    renderProjectsList(projects) {
        const projectsHTML = projects.map(project => this.renderProjectCard(project)).join('');
        
        return `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="search-container">
                            <i class="search-icon fas fa-search"></i>
                            <input 
                                type="text" 
                                id="project-search" 
                                class="search-input form-input" 
                                placeholder="프로젝트 검색..."
                            >
                        </div>
                        <select id="project-status-filter" class="form-select">
                            <option value="">모든 상태</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                            <option value="보류">보류</option>
                        </select>
                    </div>
                    <div class="flex space-x-2">
                        <button id="btn-import-project" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200">
                            <i class="fas fa-upload mr-2"></i>가져오기
                        </button>
                        <button id="btn-export-projects" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200">
                            <i class="fas fa-download mr-2"></i>내보내기
                        </button>
                    </div>
                </div>
                
                <div id="projects-grid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${projectsHTML}
                </div>
            </div>
        `;
    }

    renderProjectCard(project) {
        const statusClass = this.getStatusClass(project.status);
        const createdDate = DateUtils.formatKorean(project.created_date);
        const updatedDate = DateUtils.formatRelative(project.updated_date);
        
        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 card-hover" data-project-id="${project.id}">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-800 mb-1">${project.project_name}</h3>
                            <p class="text-sm text-gray-600">${project.customer_name} • ${project.tower_model}</p>
                        </div>
                        <span class="status-badge ${statusClass}">${project.status}</span>
                    </div>
                    
                    <p class="text-sm text-gray-700 mb-4 line-clamp-2">${project.project_description || '설명 없음'}</p>
                    
                    <div class="flex justify-between items-center text-xs text-gray-500 mb-4">
                        <span>생성: ${createdDate}</span>
                        <span>수정: ${updatedDate}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span class="flex items-center">
                                <i class="fas fa-list mr-1"></i>
                                <span id="bom-count-${project.id}">0</span> BOM
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-box mr-1"></i>
                                <span id="mto-count-${project.id}">0</span> MTO
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="projectManager.viewProject('${project.id}')" class="text-blue-600 hover:text-blue-800 transition duration-200" title="프로젝트 보기">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="projectManager.editProject('${project.id}')" class="text-green-600 hover:text-green-800 transition duration-200" title="편집">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="projectManager.deleteProject('${project.id}')" class="text-red-600 hover:text-red-800 transition duration-200" title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachProjectEvents() {
        // 검색 기능
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            const searchHandler = SearchUtils.createSearchHandler(
                this.app.projects,
                ['project_name', 'customer_name', 'tower_model', 'project_description'],
                (filteredProjects) => {
                    const grid = document.getElementById('projects-grid');
                    if (grid) {
                        grid.innerHTML = filteredProjects.map(project => this.renderProjectCard(project)).join('');
                    }
                }
            );
            
            searchInput.addEventListener('input', SearchUtils.debounce((e) => {
                const statusFilter = document.getElementById('project-status-filter').value;
                let filteredProjects = this.app.projects;
                
                if (statusFilter) {
                    filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
                }
                
                searchHandler(e.target.value);
            }, 300));
        }

        // 상태 필터
        const statusFilter = document.getElementById('project-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                const searchTerm = document.getElementById('project-search').value;
                let filteredProjects = this.app.projects;
                
                if (e.target.value) {
                    filteredProjects = filteredProjects.filter(p => p.status === e.target.value);
                }
                
                if (searchTerm) {
                    const searchHandler = SearchUtils.createSearchHandler(
                        filteredProjects,
                        ['project_name', 'customer_name', 'tower_model', 'project_description'],
                        (results) => {
                            const grid = document.getElementById('projects-grid');
                            if (grid) {
                                grid.innerHTML = results.map(project => this.renderProjectCard(project)).join('');
                            }
                        }
                    );
                    searchHandler(searchTerm);
                } else {
                    const grid = document.getElementById('projects-grid');
                    if (grid) {
                        grid.innerHTML = filteredProjects.map(project => this.renderProjectCard(project)).join('');
                    }
                }
            });
        }

        // 내보내기 버튼
        const exportBtn = document.getElementById('btn-export-projects');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProjects());
        }

        // 가져오기 버튼
        const importBtn = document.getElementById('btn-import-project');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportModal());
        }

        // 각 프로젝트의 BOM 및 MTO 개수 업데이트
        this.updateProjectCounts();
    }

    async updateProjectCounts() {
        for (const project of this.app.projects) {
            try {
                // BOM 아이템 개수
                const bomData = await this.app.fetchTableData('bom_items', { 
                    search: project.id,
                    limit: 1
                });
                const bomCount = bomData.total || 0;
                const bomElement = document.getElementById(`bom-count-${project.id}`);
                if (bomElement) bomElement.textContent = bomCount;

                // MTO 개수
                const mtoData = await this.app.fetchTableData('mto_packages', { 
                    search: project.id,
                    limit: 1 
                });
                const mtoCount = mtoData.total || 0;
                const mtoElement = document.getElementById(`mto-count-${project.id}`);
                if (mtoElement) mtoElement.textContent = mtoCount;

            } catch (error) {
                console.error(`프로젝트 ${project.id} 카운트 업데이트 실패:`, error);
            }
        }
    }

    async viewProject(projectId) {
        const project = this.app.projects.find(p => p.id === projectId);
        if (!project) return;

        this.currentProject = project;
        
        // BOM 분석 탭으로 전환하고 해당 프로젝트의 데이터 로드
        this.app.switchTab('bom');
        
        // BOM 분석 페이지에서 프로젝트 선택
        setTimeout(() => {
            const projectSelect = document.getElementById('bom-project-select');
            if (projectSelect) {
                projectSelect.value = projectId;
                projectSelect.dispatchEvent(new Event('change'));
            }
        }, 500);
    }

    async editProject(projectId) {
        const project = this.app.projects.find(p => p.id === projectId);
        if (!project) return;

        const modal = this.createEditModal(project);
        document.body.appendChild(modal);
        
        // 모달 이벤트 설정
        const form = modal.querySelector('#edit-project-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProject(projectId, new FormData(form));
            document.body.removeChild(modal);
        });

        const cancelBtn = modal.querySelector('#cancel-edit');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    async updateProject(projectId, formData) {
        try {
            this.app.showLoading(true);

            const updateData = {
                customer_name: formData.get('customer_name'),
                tower_model: formData.get('tower_model'),
                project_description: formData.get('project_description'),
                status: formData.get('status'),
                updated_date: DateUtils.getCurrentDateTime()
            };

            updateData.project_name = `${updateData.customer_name}-${updateData.tower_model}`;

            const updatedProject = await this.app.updateRecord('projects', projectId, updateData);
            
            // 로컬 데이터 업데이트
            const index = this.app.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                this.app.projects[index] = updatedProject;
            }

            // UI 새로고침
            await this.loadProjectsList();
            this.app.updateDashboardStats();
            this.app.addRecentActivity(`프로젝트 수정: ${updatedProject.project_name}`, 'info');
            this.app.showToast('프로젝트가 성공적으로 수정되었습니다.', 'success');

        } catch (error) {
            console.error('프로젝트 수정 실패:', error);
            this.app.showToast('프로젝트 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    async deleteProject(projectId) {
        const project = this.app.projects.find(p => p.id === projectId);
        if (!project) return;

        if (!confirm(`프로젝트 "${project.project_name}"를 정말 삭제하시겠습니까?\n\n관련된 모든 BOM 및 MTO 데이터도 함께 삭제됩니다.`)) {
            return;
        }

        try {
            this.app.showLoading(true);

            // 관련 데이터 삭제
            const bomItems = await this.app.fetchTableData('bom_items', { project_id: projectId });
            for (const item of bomItems.data || []) {
                await this.app.deleteRecord('bom_items', item.id);
            }

            const mtoPackages = await this.app.fetchTableData('mto_packages', { project_id: projectId });
            for (const pkg of mtoPackages.data || []) {
                await this.app.deleteRecord('mto_packages', pkg.id);
            }

            // 프로젝트 삭제
            await this.app.deleteRecord('projects', projectId);

            // 로컬 데이터에서 제거
            this.app.projects = this.app.projects.filter(p => p.id !== projectId);

            // UI 새로고침
            await this.loadProjectsList();
            this.app.updateDashboardStats();
            this.app.addRecentActivity(`프로젝트 삭제: ${project.project_name}`, 'warning');
            this.app.showToast('프로젝트가 성공적으로 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('프로젝트 삭제 실패:', error);
            this.app.showToast('프로젝트 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    createEditModal(project) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 modal-content">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">프로젝트 수정</h3>
                    <form id="edit-project-form">
                        <div class="space-y-4">
                            <div>
                                <label class="form-label">고객사명</label>
                                <input type="text" name="customer_name" value="${project.customer_name}" class="form-input" required>
                            </div>
                            <div>
                                <label class="form-label">타워 모델</label>
                                <input type="text" name="tower_model" value="${project.tower_model}" class="form-input" required>
                            </div>
                            <div>
                                <label class="form-label">프로젝트 상태</label>
                                <select name="status" class="form-select" required>
                                    <option value="진행중" ${project.status === '진행중' ? 'selected' : ''}>진행중</option>
                                    <option value="완료" ${project.status === '완료' ? 'selected' : ''}>완료</option>
                                    <option value="보류" ${project.status === '보류' ? 'selected' : ''}>보류</option>
                                </select>
                            </div>
                            <div>
                                <label class="form-label">프로젝트 설명</label>
                                <textarea name="project_description" class="form-input" rows="3">${project.project_description || ''}</textarea>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" id="cancel-edit" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                                취소
                            </button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                수정
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        return modal;
    }

    exportProjects() {
        if (this.app.projects.length === 0) {
            this.app.showToast('내보낼 프로젝트가 없습니다.', 'warning');
            return;
        }

        const exportData = this.app.projects.map(project => ({
            '프로젝트명': project.project_name,
            '고객사': project.customer_name,
            '타워모델': project.tower_model,
            '상태': project.status,
            '설명': project.project_description || '',
            '생성일': DateUtils.formatKorean(project.created_date),
            '수정일': DateUtils.formatKorean(project.updated_date)
        }));

        const filename = `CS_Wind_Projects_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.addRecentActivity(`프로젝트 데이터 내보내기: ${this.app.projects.length}건`, 'info');
        this.app.showToast('프로젝트 데이터가 성공적으로 내보내졌습니다.', 'success');
    }

    showImportModal() {
        // 파일 가져오기 모달 구현
        this.app.showToast('파일 가져오기 기능은 추후 구현 예정입니다.', 'info');
    }

    getStatusClass(status) {
        switch (status) {
            case '진행중': return 'status-progress';
            case '완료': return 'status-completed';
            case '보류': return 'status-pending';
            default: return 'status-pending';
        }
    }
}

// 전역 인스턴스 생성 (main.js에서 앱이 초기화된 후)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.projectManager = new ProjectManager(window.csWindApp);
        }
    }, 100);
});