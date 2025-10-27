// 성능 최적화 및 모니터링 시스템

class PerformanceManager {
    constructor(app) {
        this.app = app;
        this.metrics = {
            pageLoad: 0,
            apiCalls: [],
            renderTimes: {},
            memoryUsage: [],
            userInteractions: []
        };
        this.observers = new Map();
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.setupPerformanceObservers();
        this.setupAPIMonitoring();
        this.setupMemoryMonitoring();
        this.setupUserInteractionTracking();
        this.optimizeRendering();
        
        // 성능 리포트를 주기적으로 생성
        setInterval(() => {
            this.generatePerformanceReport();
        }, 5 * 60 * 1000); // 5분마다
    }

    measurePageLoad() {
        // 페이지 로드 시간 측정
        window.addEventListener('load', () => {
            if (performance.timing) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                this.metrics.pageLoad = loadTime;
                
                if (loadTime > 3000) { // 3초 이상이면 알림
                    if (window.notificationManager) {
                        window.notificationManager.addNotification(
                            'warning',
                            '페이지 로딩 속도 경고',
                            `페이지 로드 시간이 ${(loadTime/1000).toFixed(1)}초입니다. 성능 최적화가 필요할 수 있습니다.`
                        );
                    }
                }
            }
        });

        // Core Web Vitals 측정
        this.measureCoreWebVitals();
    }

    measureCoreWebVitals() {
        // LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = lastEntry.startTime;
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', lcpObserver);
            } catch (e) {
                console.log('LCP 측정 불가:', e);
            }

            // FID (First Input Delay)
            try {
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', fidObserver);
            } catch (e) {
                console.log('FID 측정 불가:', e);
            }

            // CLS (Cumulative Layout Shift)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            this.metrics.cls = clsValue;
                        }
                    });
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', clsObserver);
            } catch (e) {
                console.log('CLS 측정 불가:', e);
            }
        }
    }

    setupPerformanceObservers() {
        // 페인트 이벤트 관찰
        if ('PerformanceObserver' in window) {
            try {
                const paintObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        this.metrics[entry.name] = entry.startTime;
                    });
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.set('paint', paintObserver);
            } catch (e) {
                console.log('Paint 이벤트 관찰 불가:', e);
            }
        }
    }

    setupAPIMonitoring() {
        // Fetch API 성능 모니터링
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordAPICall(url, duration, response.status);
                
                // 느린 API 호출 감지
                if (duration > 2000) { // 2초 이상
                    if (window.notificationManager) {
                        window.notificationManager.addNotification(
                            'warning',
                            'API 응답 속도 경고',
                            `API 호출이 ${(duration/1000).toFixed(1)}초 소요되었습니다: ${url}`
                        );
                    }
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordAPICall(url, duration, 'error');
                throw error;
            }
        };
    }

    recordAPICall(url, duration, status) {
        this.metrics.apiCalls.push({
            url: url,
            duration: duration,
            status: status,
            timestamp: new Date().toISOString()
        });
        
        // 최대 100개의 API 호출만 유지
        if (this.metrics.apiCalls.length > 100) {
            this.metrics.apiCalls = this.metrics.apiCalls.slice(-100);
        }
    }

    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: new Date().toISOString()
                };
                
                this.metrics.memoryUsage.push(memoryInfo);
                
                // 최대 50개의 메모리 사용량 기록만 유지
                if (this.metrics.memoryUsage.length > 50) {
                    this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-50);
                }
                
                // 메모리 사용량이 높으면 경고
                const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
                if (usagePercent > 80) {
                    if (window.notificationManager) {
                        window.notificationManager.addNotification(
                            'warning',
                            '메모리 사용량 경고',
                            `메모리 사용량이 ${usagePercent.toFixed(1)}%입니다. 브라우저 새로고침을 권장합니다.`
                        );
                    }
                }
                
            }, 30000); // 30초마다
        }
    }

    setupUserInteractionTracking() {
        // 사용자 상호작용 성능 측정
        const interactionTypes = ['click', 'keydown', 'touchstart'];
        
        interactionTypes.forEach(type => {
            document.addEventListener(type, (event) => {
                const startTime = performance.now();
                
                // 다음 프레임에서 처리 시간 측정
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    this.recordUserInteraction(type, duration, event.target);
                });
            });
        });
    }

    recordUserInteraction(type, duration, target) {
        const interaction = {
            type: type,
            duration: duration,
            target: target.tagName + (target.id ? '#' + target.id : '') + (target.className ? '.' + target.className.split(' ')[0] : ''),
            timestamp: new Date().toISOString()
        };
        
        this.metrics.userInteractions.push(interaction);
        
        // 최대 100개의 상호작용만 유지
        if (this.metrics.userInteractions.length > 100) {
            this.metrics.userInteractions = this.metrics.userInteractions.slice(-100);
        }
        
        // 느린 상호작용 감지 (100ms 이상)
        if (duration > 100) {
            console.warn(`느린 ${type} 이벤트 감지:`, duration + 'ms', target);
        }
    }

    optimizeRendering() {
        // 가상 스크롤링 구현
        this.setupVirtualScrolling();
        
        // 이미지 지연 로딩
        this.setupLazyLoading();
        
        // 디바운싱된 리사이즈 이벤트
        this.setupOptimizedResize();
        
        // RAF 기반 애니메이션 최적화
        this.optimizeAnimations();
    }

    setupVirtualScrolling() {
        // 대용량 테이블을 위한 가상 스크롤링
        const tables = document.querySelectorAll('.data-table');
        
        tables.forEach(table => {
            if (table.dataset.virtualScroll === 'true') {
                this.implementVirtualScrolling(table);
            }
        });
    }

    implementVirtualScrolling(table) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rowHeight = 50; // 기본 행 높이
        const containerHeight = 400; // 컨테이너 높이
        const visibleRows = Math.ceil(containerHeight / rowHeight);
        const bufferRows = 5;
        
        let allRows = Array.from(tbody.children);
        let startIndex = 0;
        
        const container = document.createElement('div');
        container.style.height = containerHeight + 'px';
        container.style.overflow = 'auto';
        container.style.position = 'relative';
        
        const scrollableContent = document.createElement('div');
        scrollableContent.style.height = (allRows.length * rowHeight) + 'px';
        scrollableContent.style.position = 'relative';
        
        const viewPort = document.createElement('div');
        viewPort.style.position = 'absolute';
        viewPort.style.top = '0';
        viewPort.style.width = '100%';
        
        // 초기 렌더링
        this.renderVisibleRows(viewPort, allRows, startIndex, visibleRows + bufferRows);
        
        // 스크롤 이벤트
        container.addEventListener('scroll', SearchUtils.debounce(() => {
            const scrollTop = container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / rowHeight);
            
            if (Math.abs(newStartIndex - startIndex) > bufferRows) {
                startIndex = newStartIndex;
                this.renderVisibleRows(viewPort, allRows, startIndex, visibleRows + bufferRows);
                viewPort.style.transform = `translateY(${startIndex * rowHeight}px)`;
            }
        }, 10));
        
        scrollableContent.appendChild(viewPort);
        container.appendChild(scrollableContent);
        
        // 기존 테이블 교체
        table.parentNode.replaceChild(container, table);
    }

    renderVisibleRows(container, allRows, startIndex, count) {
        const fragment = document.createDocumentFragment();
        const endIndex = Math.min(startIndex + count, allRows.length);
        
        // 기존 행들 제거
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // 보이는 행들만 렌더링
        for (let i = startIndex; i < endIndex; i++) {
            if (allRows[i]) {
                fragment.appendChild(allRows[i].cloneNode(true));
            }
        }
        
        container.appendChild(fragment);
    }

    setupLazyLoading() {
        // 이미지 지연 로딩
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            // 모든 지연 로딩 이미지 관찰
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
            
            this.observers.set('images', imageObserver);
        }
    }

    setupOptimizedResize() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // 차트 리사이즈
                if (window.chartManager) {
                    window.chartManager.updateCharts();
                }
                
                // 테이블 레이아웃 재계산
                this.recalculateTableLayouts();
                
            }, 250);
        });
    }

    optimizeAnimations() {
        // CSS 애니메이션 성능 최적화
        const style = document.createElement('style');
        style.textContent = `
            * {
                will-change: auto;
            }
            
            .animating {
                will-change: transform, opacity;
            }
            
            .smooth-transition {
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                           opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    recalculateTableLayouts() {
        // 테이블 레이아웃 재계산
        const tables = document.querySelectorAll('.data-table');
        tables.forEach(table => {
            // 컬럼 너비 재계산
            const headers = table.querySelectorAll('th');
            const rows = table.querySelectorAll('tbody tr');
            
            if (headers.length > 0 && rows.length > 0) {
                this.optimizeTableColumnWidths(table, headers, rows);
            }
        });
    }

    optimizeTableColumnWidths(table, headers, rows) {
        // 컨텐츠 기반 컬럼 너비 최적화
        const columnWidths = Array(headers.length).fill(0);
        
        // 헤더 너비 측정
        headers.forEach((header, index) => {
            const headerText = header.textContent || '';
            columnWidths[index] = Math.max(columnWidths[index], headerText.length * 8);
        });
        
        // 첫 5행의 데이터 기반으로 너비 계산
        const sampleRows = Array.from(rows).slice(0, 5);
        sampleRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                const cellText = cell.textContent || '';
                columnWidths[index] = Math.max(columnWidths[index], cellText.length * 8);
            });
        });
        
        // 최소/최대 너비 적용
        columnWidths.forEach((width, index) => {
            const minWidth = 80;
            const maxWidth = 300;
            columnWidths[index] = Math.max(minWidth, Math.min(width, maxWidth));
        });
        
        // CSS 적용
        const tableId = table.id || 'table_' + Math.random().toString(36).substr(2, 9);
        table.id = tableId;
        
        let css = `#${tableId} th:nth-child(n), #${tableId} td:nth-child(n) { width: auto; }`;
        columnWidths.forEach((width, index) => {
            css += `#${tableId} th:nth-child(${index + 1}), #${tableId} td:nth-child(${index + 1}) { min-width: ${width}px; }`;
        });
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            pageLoad: this.metrics.pageLoad,
            coreWebVitals: {
                lcp: this.metrics.lcp,
                fid: this.metrics.fid,
                cls: this.metrics.cls
            },
            apiPerformance: this.analyzeAPIPerformance(),
            memoryUsage: this.analyzeMemoryUsage(),
            userInteractions: this.analyzeUserInteractions(),
            recommendations: this.generateRecommendations()
        };
        
        // 성능 문제가 있으면 알림 생성
        if (report.recommendations.length > 0) {
            if (window.notificationManager) {
                window.notificationManager.addNotification(
                    'system',
                    '성능 리포트',
                    `${report.recommendations.length}개의 성능 개선 권장사항이 있습니다.`,
                    { type: 'show_performance_report', data: report }
                );
            }
        }
        
        // 콘솔에 리포트 출력
        console.group('🚀 CS Wind 성능 리포트');
        console.log('페이지 로드 시간:', (this.metrics.pageLoad / 1000).toFixed(2) + 's');
        console.log('LCP:', this.metrics.lcp ? (this.metrics.lcp / 1000).toFixed(2) + 's' : 'N/A');
        console.log('FID:', this.metrics.fid ? this.metrics.fid.toFixed(2) + 'ms' : 'N/A');
        console.log('CLS:', this.metrics.cls ? this.metrics.cls.toFixed(3) : 'N/A');
        console.log('평균 API 응답시간:', report.apiPerformance.averageResponseTime.toFixed(0) + 'ms');
        console.log('메모리 사용량:', report.memoryUsage.current);
        console.log('권장사항:', report.recommendations);
        console.groupEnd();
        
        return report;
    }

    analyzeAPIPerformance() {
        if (this.metrics.apiCalls.length === 0) {
            return { averageResponseTime: 0, slowCalls: 0, errorRate: 0 };
        }
        
        const totalTime = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
        const averageResponseTime = totalTime / this.metrics.apiCalls.length;
        const slowCalls = this.metrics.apiCalls.filter(call => call.duration > 1000).length;
        const errorCalls = this.metrics.apiCalls.filter(call => call.status === 'error' || call.status >= 400).length;
        const errorRate = (errorCalls / this.metrics.apiCalls.length) * 100;
        
        return { averageResponseTime, slowCalls, errorRate };
    }

    analyzeMemoryUsage() {
        if (this.metrics.memoryUsage.length === 0) {
            return { current: 'N/A', trend: 'N/A' };
        }
        
        const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        const usedMB = (latest.used / 1024 / 1024).toFixed(1);
        const totalMB = (latest.total / 1024 / 1024).toFixed(1);
        
        // 트렌드 분석
        let trend = 'stable';
        if (this.metrics.memoryUsage.length > 5) {
            const recent = this.metrics.memoryUsage.slice(-5);
            const first = recent[0].used;
            const last = recent[recent.length - 1].used;
            const change = ((last - first) / first) * 100;
            
            if (change > 10) trend = 'increasing';
            else if (change < -10) trend = 'decreasing';
        }
        
        return {
            current: `${usedMB}MB / ${totalMB}MB`,
            trend: trend
        };
    }

    analyzeUserInteractions() {
        if (this.metrics.userInteractions.length === 0) {
            return { averageResponseTime: 0, slowInteractions: 0 };
        }
        
        const totalTime = this.metrics.userInteractions.reduce((sum, interaction) => sum + interaction.duration, 0);
        const averageResponseTime = totalTime / this.metrics.userInteractions.length;
        const slowInteractions = this.metrics.userInteractions.filter(interaction => interaction.duration > 100).length;
        
        return { averageResponseTime, slowInteractions };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 페이지 로드 시간 검사
        if (this.metrics.pageLoad > 3000) {
            recommendations.push('페이지 로드 시간이 3초를 초과합니다. 리소스 최적화를 고려하세요.');
        }
        
        // Core Web Vitals 검사
        if (this.metrics.lcp && this.metrics.lcp > 2500) {
            recommendations.push('LCP가 2.5초를 초과합니다. 주요 콘텐츠 최적화가 필요합니다.');
        }
        
        if (this.metrics.fid && this.metrics.fid > 100) {
            recommendations.push('FID가 100ms를 초과합니다. JavaScript 실행 최적화가 필요합니다.');
        }
        
        if (this.metrics.cls && this.metrics.cls > 0.1) {
            recommendations.push('CLS가 0.1을 초과합니다. 레이아웃 시프트를 줄이세요.');
        }
        
        // API 성능 검사
        const apiAnalysis = this.analyzeAPIPerformance();
        if (apiAnalysis.averageResponseTime > 1000) {
            recommendations.push('API 응답 시간이 평균 1초를 초과합니다. 서버 최적화를 고려하세요.');
        }
        
        if (apiAnalysis.errorRate > 5) {
            recommendations.push(`API 오류율이 ${apiAnalysis.errorRate.toFixed(1)}%입니다. 에러 핸들링을 확인하세요.`);
        }
        
        // 메모리 사용량 검사
        if (performance.memory) {
            const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
            if (usagePercent > 70) {
                recommendations.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
            }
        }
        
        return recommendations;
    }

    // 성능 최적화 도구들
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 리소스 정리
    cleanup() {
        // 모든 observers 정리
        this.observers.forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        this.observers.clear();
    }

    // 성능 리포트 내보내기
    exportPerformanceReport() {
        const report = this.generatePerformanceReport();
        const exportData = [{
            '측정시간': report.timestamp,
            '페이지로드시간(초)': (report.pageLoad / 1000).toFixed(2),
            'LCP(초)': report.coreWebVitals.lcp ? (report.coreWebVitals.lcp / 1000).toFixed(2) : 'N/A',
            'FID(ms)': report.coreWebVitals.fid ? report.coreWebVitals.fid.toFixed(2) : 'N/A',
            'CLS': report.coreWebVitals.cls ? report.coreWebVitals.cls.toFixed(3) : 'N/A',
            '평균API응답시간(ms)': report.apiPerformance.averageResponseTime.toFixed(0),
            'API오류율(%)': report.apiPerformance.errorRate.toFixed(1),
            '메모리사용량': report.memoryUsage.current,
            '권장사항수': report.recommendations.length
        }];
        
        const filename = `CS_Wind_성능리포트_${new Date().toISOString().split('T')[0]}.csv`;
        FileUtils.downloadCSV(exportData, filename);
        
        this.app.showToast('성능 리포트가 내보내졌습니다.', 'success');
    }
}

// 전역 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.csWindApp) {
            window.performanceManager = new PerformanceManager(window.csWindApp);
        }
    }, 400);
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (window.performanceManager) {
        window.performanceManager.cleanup();
    }
});