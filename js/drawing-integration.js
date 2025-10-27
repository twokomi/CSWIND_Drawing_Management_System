// 드로잉 패키지 통합 관리 JavaScript

// 단순한 초기화 (재귀 방지)
let drawingIntegrationInitialized = false;

function safeInitializeDrawingIntegration() {
    if (drawingIntegrationInitialized) {
        console.log('Drawing Integration 이미 초기화됨, 중복 실행 방지');
        return;
    }
    
    console.log('=== Drawing Integration 안전 초기화 시작 ===');
    drawingIntegrationInitialized = true;
    
    // 간단한 초기화만 실행
    try {
        setupUploadTabs();
        console.log('✅ Drawing Integration 초기화 완료');
    } catch (error) {
        console.error('❌ Drawing Integration 초기화 실패:', error);
        drawingIntegrationInitialized = false;
    }
}

// DOM 로드 시 한 번만 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(safeInitializeDrawingIntegration, 1000);
});

function initializeDrawingIntegration() {
    console.log('=== initializeDrawingIntegration 실행 ===');
    
    try {
        // 탭 전환 이벤트 설정
        setupUploadTabs();
        console.log('✅ 탭 설정 완료');
    } catch (error) {
        console.error('❌ 탭 설정 실패:', error);
    }
}

function setupUploadTabs() {
    console.log('=== setupUploadTabs 시작 ===');
    
    // 요소들을 찾을 때까지 재시도
    let retryCount = 0;
    const maxRetries = 10;
    
    // 간단한 요소 찾기 (재시도 없음)
    const bomTab = document.getElementById('tab-bom-upload');
    const drawingTab = document.getElementById('tab-drawing-upload');
    const bomPanel = document.getElementById('panel-bom-upload');
    const drawingPanel = document.getElementById('panel-drawing-upload');

    console.log('탭 요소 확인:', {
        bomTab: !!bomTab,
        drawingTab: !!drawingTab,
        bomPanel: !!bomPanel,
        drawingPanel: !!drawingPanel
    });

    if (!bomTab || !drawingTab || !bomPanel || !drawingPanel) {
        console.log('⚠️ 일부 탭 요소를 찾을 수 없지만 계속 진행');
        return;
    }

    // 이벤트 리스너 추가 (한 번만)
    if (!bomTab.dataset.listenerAdded) {
        bomTab.addEventListener('click', handleBOMTabClick);
        bomTab.dataset.listenerAdded = 'true';
    }
    
    if (!drawingTab.dataset.listenerAdded) {
        drawingTab.addEventListener('click', handleDrawingTabClick);
        drawingTab.dataset.listenerAdded = 'true';
    }
    
    console.log('✅ 탭 이벤트 리스너 추가 완료');
}

// 분리된 이벤트 핸들러 함수들
function handleBOMTabClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🟦 BOM 탭 클릭됨');
    
    const bomTab = window.bomTabElement || document.getElementById('tab-bom-upload');
    const drawingTab = window.drawingTabElement || document.getElementById('tab-drawing-upload');
    const bomPanel = window.bomPanelElement || document.getElementById('panel-bom-upload');
    const drawingPanel = window.drawingPanelElement || document.getElementById('panel-drawing-upload');

    if (bomTab && drawingTab && bomPanel && drawingPanel) {
        // BOM 탭 활성화
        bomTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors bg-white text-blue-600 shadow-sm';
        drawingTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-800';

        // 패널 전환
        bomPanel.classList.remove('hidden');
        drawingPanel.classList.add('hidden');
        
        console.log('✅ BOM 패널로 전환 완료');
    }
}

function handleDrawingTabClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🟧 드로잉 탭 클릭됨!!!');
    
    const bomTab = window.bomTabElement || document.getElementById('tab-bom-upload');
    const drawingTab = window.drawingTabElement || document.getElementById('tab-drawing-upload');
    const bomPanel = window.bomPanelElement || document.getElementById('panel-bom-upload');
    const drawingPanel = window.drawingPanelElement || document.getElementById('panel-drawing-upload');

    if (bomTab && drawingTab && bomPanel && drawingPanel) {
        // 드로잉 탭 활성화
        drawingTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors bg-white text-blue-600 shadow-sm';
        bomTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-800';

        // 패널 전환
        drawingPanel.classList.remove('hidden');
        bomPanel.classList.add('hidden');
        
        console.log('✅ 드로잉 패널로 전환 완료');
    }
}

function setupDrawingPackageUpload() {
    console.log('=== setupDrawingPackageUpload 초기화 ===');
    
    const drawingInput = document.getElementById('drawing-package-input');
    console.log('Drawing input 요소:', drawingInput);
    
    if (!drawingInput) {
        console.error('drawing-package-input 요소를 찾을 수 없습니다!');
        return;
    }

    drawingInput.addEventListener('change', (e) => {
        console.log('=== 드로잉 파일 선택 이벤트 ===');
        console.log('선택된 파일들:', e.target.files);
        
        const files = Array.from(e.target.files);
        const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
        
        console.log(`전체 파일: ${files.length}개, PDF 파일: ${pdfFiles.length}개`);
        
        updateDrawingPackageInfo(files, pdfFiles);
        
        const uploadBtn = document.getElementById('upload-drawings-btn');
        console.log('업로드 버튼:', uploadBtn);
        if (uploadBtn) {
            uploadBtn.disabled = pdfFiles.length === 0;
            console.log(`업로드 버튼 활성화: ${pdfFiles.length > 0}`);
        }
    });
}

function updateDrawingPackageInfo(allFiles, pdfFiles) {
    const drawingInfo = document.getElementById('selected-drawing-info');
    const folderName = document.getElementById('drawing-folder-name');
    const fileCount = document.getElementById('drawing-file-count');

    if (!drawingInfo || !folderName || !fileCount) return;

    if (allFiles.length === 0) {
        drawingInfo.classList.add('hidden');
        return;
    }

    // 폴더명 추출 (첫 번째 파일의 웹킷 경로에서)
    const firstFile = allFiles[0];
    const pathParts = firstFile.webkitRelativePath ? firstFile.webkitRelativePath.split('/') : [firstFile.name];
    const folderNameText = pathParts.length > 1 ? pathParts[0] : '선택된 폴더';

    folderName.textContent = folderNameText;
    fileCount.textContent = `총 ${allFiles.length}개 파일 (PDF: ${pdfFiles.length}개)`;
    
    drawingInfo.classList.remove('hidden');
}

function setupBOMUploadEvents() {
    const bomInput = document.getElementById('bom-file-input');
    
    if (!bomInput) return;

    // 기존 이벤트 리스너가 있다면 제거하고 새로 추가
    const newBomInput = bomInput.cloneNode(true);
    bomInput.parentNode.replaceChild(newBomInput, bomInput);
    
    newBomInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        updateBOMFileInfo(file);
        
        const uploadBtn = document.getElementById('upload-bom-btn');
        if (uploadBtn) {
            uploadBtn.disabled = !file;
        }
    });
}

function updateBOMFileInfo(file) {
    const fileInfo = document.getElementById('selected-file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');

    if (!fileInfo || !fileName || !fileSize) return;

    if (!file) {
        fileInfo.classList.add('hidden');
        return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileInfo.classList.remove('hidden');
}

// 전역 함수들
window.uploadDrawingPackage = async function() {
    console.log('=== uploadDrawingPackage 함수 호출됨 ===');
    
    const drawingInput = document.getElementById('drawing-package-input');
    console.log('드로잉 인풋:', drawingInput);
    console.log('선택된 파일들:', drawingInput ? drawingInput.files : 'null');
    
    if (!drawingInput || !drawingInput.files || drawingInput.files.length === 0) {
        showToast('드로잉 패키지 폴더를 선택하세요.', 'error');
        return;
    }

    const files = Array.from(drawingInput.files);
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    console.log(`전체 파일: ${files.length}개, PDF 파일: ${pdfFiles.length}개`);

    if (pdfFiles.length === 0) {
        showToast('PDF 파일이 발견되지 않았습니다.', 'error');
        return;
    }

    try {
        // bomAnalyzer 인스턴스가 있으면 해당 메서드 사용
        if (window.bomAnalyzer) {
            console.log('bomAnalyzer 인스턴스 사용');
            
            // bomAnalyzer의 drawingFiles Map에 직접 파일들을 추가
            let processedCount = 0;
            
            for (const file of pdfFiles) {
                const drawingNumber = extractDrawingNumberFromFilename(file.name);
                
                if (drawingNumber) {
                    // File 객체를 Map에 저장
                    window.bomAnalyzer.drawingFiles.set(drawingNumber, file);
                    
                    // Blob URL 생성
                    const blobUrl = URL.createObjectURL(file);
                    window.bomAnalyzer.drawingUrls.set(drawingNumber, blobUrl);
                    
                    processedCount++;
                }
            }
            
            console.log(`${processedCount}개의 도면이 매핑됨`);
            
            // BOM 트리 업데이트
            window.bomAnalyzer.updateDrawingLinksInBOMTree();
            
            showToast(`${processedCount}개의 도면이 성공적으로 업로드되었습니다.`, 'success');
            updateDrawingUploadStatus(true, processedCount);
        
        // 성공 시 드로잉 정보 업데이트
        if (window.bomAnalyzer.drawingFiles.size > 0) {
            updateDrawingUploadStatus(true, window.bomAnalyzer.drawingFiles.size);
        }
    } else {
        // bomAnalyzer가 없으면 독립적으로 처리
        await uploadDrawingPackageIndependent(drawingInput.files);
    }
    } catch (error) {
        console.error('드로잉 패키지 업로드 오류:', error);
        showToast('드로잉 패키지 업로드에 실패했습니다.', 'error');
    }
};

async function uploadDrawingPackageIndependent(files) {
    try {
        const allFiles = Array.from(files);
        const pdfFiles = allFiles.filter(file => file.name.toLowerCase().endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            showToast('PDF 파일이 발견되지 않았습니다.', 'error');
            return;
        }

        showToast(`${pdfFiles.length}개의 PDF 도면이 업로드되었습니다.`, 'success');
        updateDrawingUploadStatus(true, pdfFiles.length);
        
    } catch (error) {
        console.error('드로잉 패키지 업로드 실패:', error);
        showToast('드로잉 패키지 업로드에 실패했습니다.', 'error');
        updateDrawingUploadStatus(false, 0);
    }
}

function updateDrawingUploadStatus(success, fileCount) {
    const drawingInfo = document.getElementById('selected-drawing-info');
    const fileCountElement = document.getElementById('drawing-file-count');
    
    if (!success) {
        if (drawingInfo) drawingInfo.classList.add('hidden');
        return;
    }
    
    if (fileCountElement) {
        const currentText = fileCountElement.textContent;
        fileCountElement.textContent = currentText + ` → ${fileCount}개 매칭 완료`;
    }
}

window.clearSelectedFile = function() {
    const fileInput = document.getElementById('bom-file-input');
    const fileInfo = document.getElementById('selected-file-info');
    const uploadBtn = document.getElementById('upload-bom-btn');

    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = true;
};

window.clearSelectedDrawings = function() {
    const drawingInput = document.getElementById('drawing-package-input');
    const drawingInfo = document.getElementById('selected-drawing-info');
    const uploadBtn = document.getElementById('upload-drawings-btn');

    if (drawingInput) drawingInput.value = '';
    if (drawingInfo) drawingInfo.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = true;
};

function extractDrawingNumberFromFilename(filename) {
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

function showToast(message, type = 'info') {
    if (window.csWindApp && window.csWindApp.showToast) {
        window.csWindApp.showToast(message, type);
    } else {
        // 폴백: 간단한 알림
        console.log(`Toast (${type}): ${message}`);
        alert(message);
    }
}

// 전역 탭 전환 함수들
window.switchToDrawingTab = function() {
    console.log('🔥 강제 드로잉 탭 전환 실행!');
    handleDrawingTabClick({ preventDefault: () => {}, stopPropagation: () => {} });
};

window.switchToBOMTab = function() {
    console.log('🔥 강제 BOM 탭 전환 실행!');
    handleBOMTabClick({ preventDefault: () => {}, stopPropagation: () => {} });
};

// 직접 클릭 시뮬레이션
window.clickDrawingTab = function() {
    console.log('🖱️ 드로잉 탭 직접 클릭 시뮬레이션');
    const drawingTab = document.getElementById('tab-drawing-upload');
    if (drawingTab) {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        drawingTab.dispatchEvent(clickEvent);
    } else {
        console.error('드로잉 탭을 찾을 수 없습니다');
    }
};

// 테스트 함수 - 개발자 콘솔에서 사용
window.testDrawingUpload = function() {
    console.log('=== 드로잉 업로드 테스트 ===');
    
    const drawingInput = document.getElementById('drawing-package-input');
    const uploadBtn = document.getElementById('upload-drawings-btn');
    
    console.log('Drawing Input:', drawingInput);
    console.log('Upload Button:', uploadBtn);
    console.log('Button disabled:', uploadBtn ? uploadBtn.disabled : 'N/A');
    
    if (drawingInput && drawingInput.files) {
        console.log('Selected files:', drawingInput.files.length);
    }
    
    console.log('bomAnalyzer instance:', window.bomAnalyzer);
    
    // 탭 요소들 확인
    console.log('=== 탭 요소 확인 ===');
    const bomTab = document.getElementById('tab-bom-upload');
    const drawingTab = document.getElementById('tab-drawing-upload');
    const bomPanel = document.getElementById('panel-bom-upload');
    const drawingPanel = document.getElementById('panel-drawing-upload');
    
    console.log('BOM Tab:', bomTab);
    console.log('Drawing Tab:', drawingTab);
    console.log('BOM Panel:', bomPanel);
    console.log('Drawing Panel:', drawingPanel);
    
    if (drawingTab) {
        console.log('드로잉 탭 클래스:', drawingTab.className);
        console.log('드로잉 탭 onclick:', drawingTab.onclick);
    }
};