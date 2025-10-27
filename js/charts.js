// 차트 및 데이터 시각화 기능

class ChartManager {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.initCharts();
    }

    initCharts() {
        // Chart.js 로드 확인 후 초기화
        if (typeof Chart !== 'undefined') {
            this.setupDefaultChartConfig();
        } else {
            // Chart.js 동적 로드
            this.loadChartJS().then(() => {
                this.setupDefaultChartConfig();
            });
        }
    }

    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupDefaultChartConfig() {
        // Chart.js 기본 설정
        Chart.defaults.font.family = 'Inter, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#374151';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
        Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
    }

    // 프로젝트 상태별 도넛 차트
    createProjectStatusChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.app.projects) return;

        const statusCounts = this.app.projects.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {});

        const canvas = document.createElement('canvas');
        canvas.style.height = '300px';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        this.charts.projectStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: '프로젝트 상태 분포',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }

    // 자재 유형별 분포 차트
    createMaterialDistributionChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.app.bomItems) return;

        const materialCounts = this.app.bomItems.reduce((acc, item) => {
            const material = item.material_type || '미분류';
            acc[material] = (acc[material] || 0) + 1;
            return acc;
        }, {});

        const canvas = document.createElement('canvas');
        canvas.style.height = '300px';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        this.charts.materialDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(materialCounts),
                datasets: [{
                    label: 'BOM 아이템 수',
                    data: Object.values(materialCounts),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', 
                        '#f59e0b', '#8b5cf6', '#06b6d4'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '자재 유형별 BOM 분포',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // 월별 프로젝트 생성 추이
    createMonthlyProjectTrendChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.app.projects) return;

        // 최근 6개월 데이터 준비
        const months = [];
        const projectCounts = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
            months.push(monthStr);

            const monthProjects = this.app.projects.filter(project => {
                const projectDate = new Date(project.created_date);
                return projectDate.getFullYear() === date.getFullYear() && 
                       projectDate.getMonth() === date.getMonth();
            });
            projectCounts.push(monthProjects.length);
        }

        const canvas = document.createElement('canvas');
        canvas.style.height = '300px';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        this.charts.monthlyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '신규 프로젝트',
                    data: projectCounts,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '월별 프로젝트 생성 추이',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // 서플라이어별 용량 비교 차트
    createSupplierCapacityChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.app.suppliers) return;

        const activeSuppliers = this.app.suppliers
            .filter(s => s.status === '활성')
            .slice(0, 10); // 상위 10개만

        if (activeSuppliers.length === 0) return;

        const canvas = document.createElement('canvas');
        canvas.style.height = '400px';
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        
        this.charts.supplierCapacity = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: activeSuppliers.map(s => s.supplier_name),
                datasets: [{
                    label: '최대 처리 중량 (톤)',
                    data: activeSuppliers.map(s => (s.weight_capacity || 0) / 1000),
                    backgroundColor: activeSuppliers.map((_, i) => 
                        `hsl(${(i * 360) / activeSuppliers.length}, 70%, 60%)`
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: '서플라이어별 처리 용량 비교',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '처리 용량 (톤)'
                        }
                    }
                }
            }
        });
    }

    // 대시보드에 차트 섹션 추가
    addDashboardCharts() {
        const dashboardTab = document.getElementById('tab-dashboard');
        if (!dashboardTab) return;

        // 차트 섹션이 이미 있는지 확인
        if (document.getElementById('dashboard-charts')) return;

        // 기존 내용 다음에 차트 섹션 추가
        const chartsSection = document.createElement('div');
        chartsSection.id = 'dashboard-charts';
        chartsSection.className = 'mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8';
        
        chartsSection.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <div id="project-status-chart"></div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div id="material-distribution-chart"></div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div id="monthly-trend-chart"></div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div id="supplier-capacity-chart"></div>
            </div>
        `;

        dashboardTab.appendChild(chartsSection);

        // 차트 생성
        setTimeout(() => {
            this.createProjectStatusChart('project-status-chart');
            this.createMaterialDistributionChart('material-distribution-chart');
            this.createMonthlyProjectTrendChart('monthly-trend-chart');
            this.createSupplierCapacityChart('supplier-capacity-chart');
        }, 500);
    }

    // 차트 업데이트
    updateCharts() {
        if (this.charts.projectStatus) {
            this.createProjectStatusChart('project-status-chart');
        }
        if (this.charts.materialDistribution) {
            this.createMaterialDistributionChart('material-distribution-chart');
        }
        if (this.charts.monthlyTrend) {
            this.createMonthlyProjectTrendChart('monthly-trend-chart');
        }
        if (this.charts.supplierCapacity) {
            this.createSupplierCapacityChart('supplier-capacity-chart');
        }
    }

    // 차트 파괴
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // 차트 데이터 내보내기
    exportChartData(chartType) {
        switch (chartType) {
            case 'projects':
                const projectData = this.app.projects.map(p => ({
                    '프로젝트명': p.project_name,
                    '고객사': p.customer_name,
                    '상태': p.status,
                    '생성일': DateUtils.formatKorean(p.created_date)
                }));
                FileUtils.downloadCSV(projectData, `프로젝트_분석_${DateUtils.formatKorean(new Date())}.csv`);
                break;
            
            case 'materials':
                const materialData = Object.entries(
                    ArrayUtils.groupBy(this.app.bomItems, 'material_type')
                ).map(([type, items]) => ({
                    '자재유형': type || '미분류',
                    '아이템수': items.length,
                    '총중량': items.reduce((sum, item) => sum + (item.weight || 0), 0),
                    '평균중량': Math.round((items.reduce((sum, item) => sum + (item.weight || 0), 0) / items.length) * 100) / 100
                }));
                FileUtils.downloadCSV(materialData, `자재분석_${DateUtils.formatKorean(new Date())}.csv`);
                break;
            
            default:
                this.app.showToast('지원하지 않는 차트 유형입니다.', 'warning');
        }
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.chartManager = new ChartManager(window.csWindApp);
            
            // 대시보드 탭이 활성화될 때 차트 추가
            const dashboardTab = document.getElementById('nav-dashboard');
            if (dashboardTab) {
                dashboardTab.addEventListener('click', () => {
                    setTimeout(() => {
                        window.chartManager.addDashboardCharts();
                    }, 300);
                });
            }
        }
    }, 1000);
});